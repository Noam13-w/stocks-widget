# Stocks Widget

A polished, always-on-top desktop widget for tracking live stock prices on Windows. Built with Electron.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Live prices** for stocks, ETFs, indices, and crypto (via Yahoo Finance — no API key needed)
- **Multiple watchlists** — switch between Tech, Crypto, ETFs, etc.
- **Detailed view** with interactive chart (1D / 5D / 1M / 3M / 1Y)
- **Price alerts** — get a desktop notification when a stock crosses your target
- **Pre-market & after-hours** info
- **Sparkline charts** behind every row showing intraday trend
- **Drag-to-reorder** tickers, or sort by symbol / change % / price
- **Compact mode** for power users
- **Collapse to a small bar** that floats in your screen corner
- **Right-click menu** on any ticker — copy symbol, view on Yahoo, set alert, remove
- **Export / Import** your watchlists & settings as JSON
- **Always-on-top**, frameless, transparent — stays out of the way
- **Global shortcut** `Ctrl+Shift+S` to show/hide

## Install

### Option 1 — Installer (recommended)

Download the latest `Stocks Widget Setup.exe` from the [Releases](../../releases) page and run it.

### Option 2 — Portable

Download the latest `Stocks Widget-portable.exe` — no installation required, just run it.

### Option 3 — From source

Requires [Node.js](https://nodejs.org) 18+.

```bash
git clone https://github.com/<your-username>/stocks-widget.git
cd stocks-widget
npm install
npm start
```

To build a Windows installer yourself:

```bash
npm run dist
```

The installer ends up in `dist/`.

## Usage

- **Add a ticker:** type a symbol (or company name) in the input at the bottom — autocomplete suggestions appear as you type.
- **Click a row** to open the detail view with chart and price alerts.
- **Right-click a row** for quick actions: copy symbol, view on Yahoo Finance, set alert, remove.
- **Drag rows** to reorder them (only when sort mode is "Manual").
- **Tabs at the top** let you switch between watchlists. Click `+` to create a new one. Right-click a tab to rename or delete it.
- **`−` button** collapses the widget into a small bar that floats in your corner. Drag the bar anywhere; click the `⤢` icon to expand it back.
- **`×` button** asks if you want to quit or just minimize.
- The widget **also lives in your system tray** — right-click the tray icon for show/hide/quit.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+S` | Toggle widget (global) |
| `Enter` | Add ticker (in input) |
| `↑` / `↓` | Navigate suggestions |
| `Esc` | Close panel / dropdown |

## Privacy & data

- All price data is fetched directly from Yahoo Finance's public endpoints — **nothing is sent to any other server**.
- All your settings (watchlists, alerts, window position) are stored locally in `%APPDATA%\stocks-widget\config.json`.
- No telemetry, no analytics, no tracking.

## Tech stack

- [Electron](https://www.electronjs.org/) for the desktop runtime
- Vanilla HTML / CSS / JavaScript — no frameworks
- Yahoo Finance public API for quotes

## Credits

Built by **[Noam Nissan](https://www.linkedin.com/in/noam-nissan-b664793ba)**.

## License

[MIT](./LICENSE)
