const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('widget', {
  // Receivers
  onQuotes: (cb) => ipcRenderer.on('quotes', (_e, d) => cb(d)),
  onError:  (cb) => ipcRenderer.on('quotes-error', (_e, m) => cb(m)),
  onConfig: (cb) => ipcRenderer.on('config', (_e, c) => cb(c)),
  onMode:   (cb) => ipcRenderer.on('mode', (_e, m) => cb(m)),

  // Window
  refresh: () => ipcRenderer.invoke('refresh'),
  hide:    () => ipcRenderer.invoke('hide'),
  expand:  () => ipcRenderer.invoke('expand'),
  close:   () => ipcRenderer.invoke('close'),

  // Tickers
  addTicker:      (s) => ipcRenderer.invoke('add-ticker', s),
  removeTicker:   (s) => ipcRenderer.invoke('remove-ticker', s),
  reorderTickers: (list) => ipcRenderer.invoke('reorder-tickers', list),
  search:         (q) => ipcRenderer.invoke('search', q),
  fetchChart:     (sym, range) => ipcRenderer.invoke('fetch-chart', sym, range),

  // Watchlists
  createWatchlist: (name) => ipcRenderer.invoke('create-watchlist', name),
  switchWatchlist: (name) => ipcRenderer.invoke('switch-watchlist', name),
  renameWatchlist: (oldName, newName) => ipcRenderer.invoke('rename-watchlist', oldName, newName),
  deleteWatchlist: (name) => ipcRenderer.invoke('delete-watchlist', name),

  // Alerts
  addAlert:    (sym, type, price) => ipcRenderer.invoke('add-alert', sym, type, price),
  removeAlert: (sym, id) => ipcRenderer.invoke('remove-alert', sym, id),

  // Settings
  setConfig: (patch) => ipcRenderer.invoke('set-config', patch),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
