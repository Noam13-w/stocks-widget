# Stocks Widget

A polished, always-on-top desktop widget for tracking live stock prices on Windows. Built with Electron.

[![Platform](https://img.shields.io/badge/platform-Windows-blue)](https://github.com/Noam13-w/stocks-widget/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Built by Noam Nissan](https://img.shields.io/badge/built%20by-Noam%20Nissan-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/noam-nissan-b664793ba)

> 🇮🇱 [גלילה למטה להוראות בעברית](#-הוראות-בעברית)

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

> **⚠️ "Windows protected your PC" warning?**
>
> When you first run the app, Windows SmartScreen will show a blue warning: *"Microsoft Defender SmartScreen prevented an unrecognized app from starting."* This is **normal for any new app from an independent developer** — the app simply isn't code-signed with a paid commercial certificate (~$300/year), and that's the only thing the warning means.
>
> **To run it:**
> 1. Click **"More info"**
> 2. Click **"Run anyway"**
>
> The warning is about *unknown publisher*, not about anything malicious. The full source code is in this repo — feel free to inspect or build from source instead.

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

Built by **[Noam Nissan](https://www.linkedin.com/in/noam-nissan-b664793ba)** — connect with me on LinkedIn 👋

## License

[MIT](./LICENSE)

---

## 🇮🇱 הוראות בעברית

**Stocks Widget** — ויג'דט דסקטופ למעקב אחרי מחירי מניות בזמן אמת על Windows. צף מעל כל החלונות שלך, מינימליסטי, חינמי לחלוטין.

### תכונות

- 📈 מחירים חיים למניות, ETFs, מדדים וקריפטו (דרך Yahoo Finance — בלי API key)
- 📋 רשימות מעקב מרובות (Tech / Crypto / ETFs / מה שתרצה) עם טאבים
- 📊 פאנל פירוט עם **גרף אינטראקטיבי** (1D / 5D / 1M / 3M / 1Y)
- 🔔 **התראות מחיר** — נוטיפיקציה של Windows כשהמחיר חוצה את היעד
- 🌅 מידע מ-**Pre-market** ו-**After-hours**
- ✨ Sparklines אינטראדיי ברקע של כל שורה
- 🎯 **מצב מכווץ** — בר זעיר שצף בפינת המסך, גריר מכל מקום
- ⌨️ קיצור גלובלי **`Ctrl+Shift+S`** להצגה/הסתרה
- 🖱️ קליק ימני על מניה: העתק סימול, צפה ב-Yahoo, הוסף התראה, הסר
- 💾 ייצוא/ייבוא הגדרות כקובץ JSON
- 🔒 פרטיות מלאה — שום דבר לא נשלח לאף שרת מלבד Yahoo Finance

### התקנה

1. הורד את הקובץ `Stocks-Widget-1.0.0-win-x64.zip` מ-[Releases](https://github.com/Noam13-w/stocks-widget/releases/latest)
2. חלץ את הזיפ לכל מקום שתרצה (למשל `C:\Apps\Stocks Widget\`)
3. הפעל את `Stocks Widget.exe`

**אין צורך בהתקנה.**

### ⚠️ אזהרת "Windows הגן על המחשב שלך"

בהפעלה הראשונה Windows יציג מסך כחול עם הודעה: *"Microsoft Defender SmartScreen מנע הפעלה של אפליקציה לא מזוהה"*. זה **נורמלי לכל אפליקציה חדשה ממפתח פרטי** — האפליקציה פשוט לא חתומה בתעודת קוד מסחרית (~$300 לשנה), זה כל מה שהאזהרה אומרת.

**כדי להפעיל:**
1. לחץ על **"מידע נוסף"**
2. לחץ על **"הפעל בכל זאת"**

האזהרה מדברת על *מפרסם לא מזוהה*, לא על משהו זדוני. הקוד המלא פתוח לבדיקה כאן בריפו.

### שימוש

- **הוספת מניה:** הקלד סימול (או שם חברה) בתחתית — הצעות אוטומטיות יופיעו תוך כדי הקלדה
- **קליק על שורה** פותח פאנל פרטים עם גרף ואפשרות להגדיר התראות
- **קליק ימני על שורה** לפעולות מהירות: העתק סימול, פתח ב-Yahoo, הגדר התראה, הסר
- **גרור שורות** לסידור מחדש (כשמצב המיון "Manual")
- **טאבים בראש** — מעבר בין רשימות מעקב. לחץ `+` לרשימה חדשה. קליק ימני על טאב לעריכה/מחיקה
- **כפתור `−`** מכווץ את הווידג'ט לבר זעיר. גרור אותו לכל מקום, לחץ `⤢` להרחבה
- **כפתור `×`** שואל אם לסגור או רק למזער
- **אייקון במגש המערכת** (System Tray) — קליק ימני להצגה/הסתרה/יציאה

### קיצורי מקלדת

| קיצור | פעולה |
|---|---|
| `Ctrl+Shift+S` | הצג/הסתר ויג'דט (גלובלי) |
| `Enter` | הוסף מניה (בשדה ההקלדה) |
| `↑` / `↓` | נווט בהצעות |
| `Esc` | סגור פאנל / dropdown |

### פרטיות ונתונים

- כל נתוני המחירים נמשכים ישירות מ-Yahoo Finance — **שום דבר לא נשלח לשום שרת אחר**
- כל ההגדרות שלך (רשימות, התראות, מיקום חלון) נשמרות מקומית ב-`%APPDATA%\stocks-widget\config.json`
- בלי טראקינג, בלי אנליטיקס, בלי הרשמה

### קרדיט

נבנה על ידי **[נעם ניסן](https://www.linkedin.com/in/noam-nissan-b664793ba)** — נשמח להתחבר בלינקדאין 👋
