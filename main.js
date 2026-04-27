const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage,
        globalShortcut, shell, dialog, Notification, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// ──────────────────────────────────────────────────────────────────────────────
// Config

const CONFIG_DIR  = app.getPath('userData');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  watchlists: { 'Default': ['AAPL', 'MSFT', 'NVDA'] },
  activeWatchlist: 'Default',
  refreshSec: 15,
  showSparkline: true,
  showExtendedHours: true,
  compactMode: false,
  // theme removed — dark only (light theme had readability issues)
  sortBy: 'manual',       // 'manual' | 'symbol' | 'changeDesc' | 'changeAsc' | 'priceDesc'
  alerts: {},             // { SYMBOL: [{ id, type:'above'|'below', price, triggered }] }
  windowPos: null,
  windowSize: null,
  collapsed: false,
};

function loadConfig() {
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}

  // Migration: old configs had top-level `tickers`
  if (raw.tickers && !raw.watchlists) {
    raw.watchlists = { 'Default': raw.tickers };
    raw.activeWatchlist = 'Default';
    delete raw.tickers;
  }
  const merged = { ...DEFAULT_CONFIG, ...raw };
  // Ensure activeWatchlist exists
  if (!merged.watchlists[merged.activeWatchlist]) {
    merged.activeWatchlist = Object.keys(merged.watchlists)[0] || 'Default';
    if (!merged.watchlists[merged.activeWatchlist]) {
      merged.watchlists[merged.activeWatchlist] = [];
    }
  }
  return merged;
}

function saveConfig() {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) { console.error('saveConfig failed:', e); }
}

let config = loadConfig();
const activeTickers = () => config.watchlists[config.activeWatchlist] || [];

// ──────────────────────────────────────────────────────────────────────────────
// HTTP

function httpJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Yahoo Finance

async function fetchOne(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d&includePrePost=true`;
  try {
    const json = await httpJson(url);
    if (json.chart && json.chart.error) {
      return { symbol, error: json.chart.error.description || 'Symbol not found' };
    }
    const r = json.chart && json.chart.result && json.chart.result[0];
    if (!r || !r.meta) return { symbol, error: 'No data available' };
    const m = r.meta;

    const regularPrice = m.regularMarketPrice;
    const prevClose    = m.previousClose != null ? m.previousClose : m.chartPreviousClose;
    const regularChange    = (regularPrice != null && prevClose != null) ? regularPrice - prevClose : null;
    const regularChangePct = (regularChange != null && prevClose) ? (regularChange / prevClose) * 100 : null;

    const ts = r.timestamp || [];
    const closes = (r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
    let extPrice = null, extTs = null;
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] != null) { extPrice = closes[i]; extTs = ts[i]; break; }
    }

    const ctp = m.currentTradingPeriod || {};
    const inRange = (t, p) => p && t >= p.start && t < p.end;

    const sparkPoints = [];
    if (ctp.regular) {
      for (let i = 0; i < closes.length; i++) {
        if (closes[i] != null && ts[i] >= ctp.regular.start && ts[i] < ctp.regular.end) {
          sparkPoints.push(closes[i]);
        }
      }
    }
    const downsampled = sparkPoints.length > 40
      ? Array.from({ length: 40 }, (_, i) => sparkPoints[Math.floor(i * sparkPoints.length / 40)])
      : sparkPoints;

    let marketState = 'CLOSED';
    let displayPrice = regularPrice;
    let displayChange = regularChange;
    let displayChangePct = regularChangePct;
    let extended = null;

    if (extTs != null) {
      if (inRange(extTs, ctp.pre)) {
        marketState = 'PRE';
        displayPrice = extPrice;
        displayChange = (regularPrice != null) ? extPrice - regularPrice : null;
        displayChangePct = (displayChange != null && regularPrice) ? (displayChange / regularPrice) * 100 : null;
        const regChg = (regularPrice != null && prevClose != null) ? regularPrice - prevClose : null;
        extended = { label: 'At Close', price: regularPrice, change: regChg,
          changePct: (regChg != null && prevClose) ? (regChg / prevClose) * 100 : null };
      } else if (inRange(extTs, ctp.regular)) {
        marketState = 'REGULAR';
        displayPrice = extPrice;
        displayChange = (prevClose != null) ? extPrice - prevClose : null;
        displayChangePct = (displayChange != null && prevClose) ? (displayChange / prevClose) * 100 : null;
      } else if (inRange(extTs, ctp.post)) {
        marketState = 'POST';
        const eChg = (regularPrice != null) ? extPrice - regularPrice : null;
        extended = { label: 'After Hours', price: extPrice, change: eChg,
          changePct: (eChg != null && regularPrice) ? (eChg / regularPrice) * 100 : null };
      }
    }

    return {
      symbol: m.symbol || symbol,
      name: m.shortName || m.longName || m.symbol || symbol,
      price: displayPrice,
      change: displayChange,
      changePct: displayChangePct,
      currency: m.currency || 'USD',
      exchange: m.exchangeName || m.fullExchangeName || '',
      marketState,
      extended,
      previousClose: prevClose,
      regularPrice,
      dayHigh: m.regularMarketDayHigh,
      dayLow:  m.regularMarketDayLow,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh,
      fiftyTwoWeekLow:  m.fiftyTwoWeekLow,
      volume: m.regularMarketVolume,
      sparkline: downsampled,
      ts: (extTs != null ? extTs : m.regularMarketTime) * 1000 || Date.now(),
    };
  } catch (e) {
    return { symbol, error: e.message || 'Network error' };
  }
}

async function fetchQuotes(symbols) {
  if (!symbols.length) return [];
  return Promise.all(symbols.map(fetchOne));
}

// Fetch a chart series for a given range (1D/5D/1M/3M/1Y).
// Returns { timestamps[], closes[], currency } — closes may include nulls
// (gaps); the renderer filters them out.
async function fetchChart(symbol, range) {
  const map = {
    '1D':  { range: '1d',  interval: '1m'  },
    '5D':  { range: '5d',  interval: '15m' },
    '1M':  { range: '1mo', interval: '30m' },
    '3M':  { range: '3mo', interval: '1d'  },
    '1Y':  { range: '1y',  interval: '1d'  },
  };
  const cfg = map[range] || map['1D'];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${cfg.interval}&range=${cfg.range}`;
  try {
    const json = await httpJson(url);
    const r = json.chart && json.chart.result && json.chart.result[0];
    if (!r) return { error: 'No chart data' };
    const ts = r.timestamp || [];
    const closes = (r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
    const prev = r.meta && (r.meta.chartPreviousClose ?? r.meta.previousClose);
    return {
      timestamps: ts,
      closes,
      currency: r.meta && r.meta.currency || 'USD',
      previousClose: prev,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function searchTicker(query) {
  if (!query || query.length < 1) return [];
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
  try {
    const json = await httpJson(url);
    const quotes = json.quotes || [];
    return quotes
      .filter(q => q.symbol && q.quoteType !== 'OPTION')
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || '',
        exchange: q.exchDisp || q.exchange || '',
        type: q.typeDisp || q.quoteType || '',
      }))
      .slice(0, 6);
  } catch { return []; }
}

// ──────────────────────────────────────────────────────────────────────────────
// Price-alert evaluation

function checkAlerts(quotes) {
  if (!Notification.isSupported()) return;
  let mutated = false;
  for (const q of quotes) {
    if (q.error || q.price == null) continue;
    const list = config.alerts[q.symbol];
    if (!list || !list.length) continue;
    for (const a of list) {
      if (a.triggered) continue;
      const hit = (a.type === 'above' && q.price >= a.price) ||
                  (a.type === 'below' && q.price <= a.price);
      if (hit) {
        a.triggered = true;
        mutated = true;
        new Notification({
          title: `${q.symbol} ${a.type === 'above' ? '↑' : '↓'} ${a.price}`,
          body: `Now ${q.price.toFixed(2)} ${q.currency || ''} (${q.changePct?.toFixed(2) || '0'}%)`,
          silent: false,
        }).show();
      }
    }
  }
  if (mutated) saveConfig();
}

// ──────────────────────────────────────────────────────────────────────────────
// Window

let win;
let tray;
let interval;
const PILL = { w: 240, h: 36 };
const FULL_DEFAULT = { w: 340, h: 520 };
const FULL_MIN = { w: 300, h: 360 };
const FULL_MAX = { w: 600, h: 980 };

function defaultPosition(size) {
  const display = screen.getPrimaryDisplay();
  const { width } = display.workAreaSize;
  return { x: width - size.w - 24, y: 60 };
}

function createWindow() {
  const fullSize = config.windowSize || FULL_DEFAULT;
  const size = config.collapsed ? PILL : fullSize;
  const pos = config.windowPos || defaultPosition(size);

  win = new BrowserWindow({
    width: size.w, height: size.h, x: pos.x, y: pos.y,
    minWidth:  config.collapsed ? PILL.w : FULL_MIN.w,
    minHeight: config.collapsed ? PILL.h : FULL_MIN.h,
    maxWidth:  config.collapsed ? PILL.w : FULL_MAX.w,
    maxHeight: config.collapsed ? PILL.h : FULL_MAX.h,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: !config.collapsed, skipTaskbar: true, hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('config', config);
    win.webContents.send('mode', config.collapsed ? 'pill' : 'full');
    pushQuotes();
  });

  let posTimer = null, sizeTimer = null;
  win.on('move', () => {
    clearTimeout(posTimer);
    posTimer = setTimeout(() => {
      const [x, y] = win.getPosition();
      config.windowPos = { x, y }; saveConfig();
    }, 400);
  });
  win.on('resize', () => {
    if (config.collapsed) return;
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(() => {
      const [w, h] = win.getSize();
      config.windowSize = { w, h }; saveConfig();
    }, 400);
  });
}

function setCollapsed(state) {
  if (!win || win.isDestroyed()) return;
  config.collapsed = state; saveConfig();
  const target = state ? PILL : (config.windowSize || FULL_DEFAULT);
  const cur = win.getPosition();
  win.setResizable(!state);
  if (state) {
    win.setMinimumSize(PILL.w, PILL.h);
    win.setMaximumSize(PILL.w, PILL.h);
  } else {
    win.setMinimumSize(FULL_MIN.w, FULL_MIN.h);
    win.setMaximumSize(FULL_MAX.w, FULL_MAX.h);
  }
  win.setBounds({ x: cur[0], y: cur[1], width: target.w, height: target.h });
  win.webContents.send('mode', state ? 'pill' : 'full');
  if (!win.isVisible()) win.show();
}

async function pushQuotes() {
  if (!win || win.isDestroyed()) return;
  try {
    const quotes = await fetchQuotes(activeTickers());
    win.webContents.send('quotes', { quotes, ts: Date.now() });
    checkAlerts(quotes);
  } catch (e) {
    win.webContents.send('quotes-error', String(e?.message || e));
  }
}

function startTimer() {
  if (interval) clearInterval(interval);
  const sec = Math.max(5, config.refreshSec || 15);
  interval = setInterval(pushQuotes, sec * 1000);
}

// ─── Quit confirmation ─────────────────────────────────────────────────────
async function confirmQuit() {
  if (!win || win.isDestroyed()) { app.quit(); return; }
  const result = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: ['Quit', 'Minimize to bar', 'Cancel'],
    defaultId: 1, cancelId: 2, noLink: true,
    title: 'Quit Stocks Widget?',
    message: 'Are you sure you want to quit?',
    detail: 'You can also minimize the widget to a small bar in the corner of your screen, or use Ctrl+Shift+S to toggle it anytime.',
  });
  if (result.response === 0) app.quit();
  else if (result.response === 1) setCollapsed(true);
}

// ─── Tray ──────────────────────────────────────────────────────────────────
function createTray() {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYklEQVQ4y2NgGAWjYBSMghEM/v//' +
    'z0Ck+v/EaPiPRzMjsQb8x6OZkRQD/uPQzEgNA/5jaWYk1Yv/sWhmJDcM/mPRzEiJF9Bdg9OAUTAK' +
    'RsEoGAUjF/wHAMz5GMhkW8ImAAAAAElFTkSuQmCC',
    'base64'
  );
  const img = nativeImage.createFromBuffer(png);
  tray = new Tray(img);
  tray.setToolTip('Stocks Widget');
  const rebuild = () => Menu.buildFromTemplate([
    { label: 'Show / Hide', click: () => { win.isVisible() ? win.hide() : win.show(); } },
    { label: config.collapsed ? 'Expand' : 'Collapse to bar', click: () => setCollapsed(!config.collapsed) },
    { label: 'Refresh now', click: () => pushQuotes() },
    { type: 'separator' },
    { label: 'Open config folder', click: () => shell.openPath(CONFIG_DIR) },
    { label: 'Toggle shortcut: Ctrl+Shift+S', enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(rebuild());
  tray.on('click', () => {
    if (!win.isVisible()) win.show();
    else setCollapsed(!config.collapsed);
    tray.setContextMenu(rebuild());
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// IPC

ipcMain.handle('refresh', () => pushQuotes());
ipcMain.handle('hide',    () => setCollapsed(true));
ipcMain.handle('expand',  () => setCollapsed(false));
ipcMain.handle('close',   () => confirmQuit());

// Tickers (operate on active watchlist)
ipcMain.handle('add-ticker', (_e, sym) => {
  sym = String(sym || '').trim().toUpperCase();
  if (!sym) return config;
  const list = config.watchlists[config.activeWatchlist];
  if (!list.includes(sym)) { list.push(sym); saveConfig(); pushQuotes(); }
  return config;
});
ipcMain.handle('remove-ticker', (_e, sym) => {
  const list = config.watchlists[config.activeWatchlist];
  config.watchlists[config.activeWatchlist] = list.filter(t => t !== sym);
  delete config.alerts[sym];
  saveConfig(); pushQuotes();
  return config;
});
ipcMain.handle('reorder-tickers', (_e, list) => {
  if (Array.isArray(list)) {
    config.watchlists[config.activeWatchlist] = list.filter(s => typeof s === 'string');
    saveConfig(); pushQuotes();
  }
  return config;
});

// Watchlists
ipcMain.handle('create-watchlist', (_e, name) => {
  name = String(name || '').trim().slice(0, 24);
  if (!name || config.watchlists[name]) return config;
  config.watchlists[name] = [];
  config.activeWatchlist = name;
  saveConfig(); pushQuotes();
  return config;
});
ipcMain.handle('switch-watchlist', (_e, name) => {
  if (config.watchlists[name]) {
    config.activeWatchlist = name;
    saveConfig(); pushQuotes();
  }
  return config;
});
ipcMain.handle('rename-watchlist', (_e, oldName, newName) => {
  newName = String(newName || '').trim().slice(0, 24);
  if (!newName || !config.watchlists[oldName] || config.watchlists[newName]) return config;
  // Preserve insertion order
  const next = {};
  for (const k of Object.keys(config.watchlists)) {
    next[k === oldName ? newName : k] = config.watchlists[k];
  }
  config.watchlists = next;
  if (config.activeWatchlist === oldName) config.activeWatchlist = newName;
  saveConfig();
  return config;
});
ipcMain.handle('delete-watchlist', async (_e, name) => {
  if (!config.watchlists[name] || Object.keys(config.watchlists).length <= 1) return config;
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Delete', 'Cancel'], defaultId: 1, cancelId: 1, noLink: true,
    title: 'Delete watchlist?',
    message: `Delete "${name}"?`,
    detail: 'This cannot be undone. The tickers in this list will be removed.',
  });
  if (result.response !== 0) return config;
  delete config.watchlists[name];
  if (config.activeWatchlist === name) {
    config.activeWatchlist = Object.keys(config.watchlists)[0];
  }
  saveConfig(); pushQuotes();
  return config;
});

// Alerts
ipcMain.handle('add-alert', (_e, symbol, type, price) => {
  if (!symbol || !['above','below'].includes(type) || price == null) return config;
  if (!config.alerts[symbol]) config.alerts[symbol] = [];
  config.alerts[symbol].push({
    id: crypto.randomBytes(4).toString('hex'),
    type, price: Number(price), triggered: false,
  });
  saveConfig();
  return config;
});
ipcMain.handle('remove-alert', (_e, symbol, id) => {
  if (!config.alerts[symbol]) return config;
  config.alerts[symbol] = config.alerts[symbol].filter(a => a.id !== id);
  if (!config.alerts[symbol].length) delete config.alerts[symbol];
  saveConfig();
  return config;
});

// Generic config patch (sortBy, compactMode, refreshSec, etc.)
ipcMain.handle('set-config', (_e, patch) => {
  config = { ...config, ...patch };
  saveConfig();
  if (patch.refreshSec != null) startTimer();
  return config;
});

// Search
ipcMain.handle('search', async (_e, q) => searchTicker(q));
ipcMain.handle('fetch-chart', async (_e, sym, range) => fetchChart(sym, range));

// Open external URL (for "View on Yahoo Finance")
ipcMain.handle('open-external', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) shell.openExternal(url);
});

// Export / Import config
ipcMain.handle('export-config', async () => {
  const result = await dialog.showSaveDialog(win, {
    title: 'Export Stocks Widget config',
    defaultPath: 'stocks-widget-config.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return false;
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    dialog.showErrorBox('Export failed', e.message);
    return false;
  }
});

ipcMain.handle('import-config', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Import Stocks Widget config',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return false;
  try {
    const raw = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
    if (!raw.watchlists && !raw.tickers) throw new Error('Not a valid config file');
    if (raw.tickers && !raw.watchlists) {
      raw.watchlists = { 'Default': raw.tickers };
      raw.activeWatchlist = 'Default';
      delete raw.tickers;
    }
    config = { ...DEFAULT_CONFIG, ...raw };
    saveConfig(); startTimer();
    win.webContents.send('config', config);
    pushQuotes();
    return true;
  } catch (e) {
    dialog.showErrorBox('Import failed', e.message);
    return false;
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Boot

app.whenReady().then(() => {
  createWindow();
  createTray();
  startTimer();
  globalShortcut.register('Control+Shift+S', () => {
    if (!win.isVisible()) win.show();
    else setCollapsed(!config.collapsed);
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());
