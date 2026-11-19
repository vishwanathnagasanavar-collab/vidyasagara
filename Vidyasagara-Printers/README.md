# Vidyasagara Printers — Windows Desktop Software

A standalone Windows desktop application built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, **SQLite**, and **Electron Builder** for commercial print order tracking, customer ledgers, batch job cards, branch dispatch flags, and payment receipts.

---

## Folder Structure

```text
Vidyasagara-Printers/
├── electron/               # Secure Electron main process, preload bridge, SQLite engine & IPC
│   ├── main.ts
│   ├── preload.ts
│   ├── database.ts
│   └── ipcHandlers.ts
├── src/                    # React + TypeScript UI
│   ├── api/                # Electron IPC bridge client
│   ├── assets/             # App icon & profile imagery
│   ├── components/         # TopBar, Sidebar, Pagination, Checkboxes, Modals
│   ├── pages/              # Orders-Customerwise, Dashboard, Reports, Master Data
│   ├── styles/             # Tailwind CSS & design tokens
│   ├── types/              # Shared TypeScript interfaces
│   └── utils/              # Date & currency formatters
├── database/               # SQLite relational schema reference (schema.sql)
├── public/                 # Static public assets
├── build/                  # Windows icon resources (icon.ico, icon.png)
├── electron-builder.yml    # Windows NSIS installer & Portable EXE configuration
├── package.json
└── README.md
```

---

## Features

- **Orders - Customerwise (Master-Detail Grid)**:
  - Customer directory with instant highlight search (`ID`, `Name`, `Phone`, `Branch`, `Total Amt`, `Pending Amt`).
  - Selected customer order grid (`ID`, `Ord.No.`, `Date`, `Qty`, `Rate`, `Amount`, `Product` filter funnel, `Batch`, interactive `Br.Transfer`, `Br.Rcvd`, `Br.Despatch` checkboxes, `Rcvd. Amt`, `Bal. Amt`).
  - Red row alerts for undispatched or unpaid orders (`Bal. Amt > 0` or `Br.Despatch = 0`).
  - Bottom receipt & job specification panel with 1-click payment receipt recording and print-ready Job Card generation.
- **Management Information & Reports**:
  - `Dash Board` with revenue, collection, party outstanding, and pending despatch metrics.
  - `Orders - Datewise` (daily filter + CSV export), `Orders - Productwise`, `Batch - JobCards`, `Party Outstanding`, `Pending Jobs`, and `Orders History`.
- **Master Data & Local SQLite Persistence**:
  - Full Add / Edit / Delete CRUD for Customers, Products & Rates, Branches, and Staff Users.
  - Persistent SQLite database stored safely in the user's Windows AppData folder (`%APPDATA%\Vidyasagara Printers\vidyasagara-printers.db`) — completely separate from the installation directory so data is preserved during updates/reinstalls.
  - Built-in Database Backup (`.db` export), Restore, and Data Folder launcher.

---

## Security Architecture

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Strict `contextBridge` preload API (`electron/preload.ts`) with validated IPC handlers in `electron/ipcHandlers.ts`.

---

## Development & Building Windows Installers

### Prerequisites (for building from source)
- Node.js 20+ and npm 10+

### Install Dependencies
```bash
cd Vidyasagara-Printers
npm install
```

### Run in Desktop Mode
```bash
npm start
```

### Build Windows Installer & Portable EXE
```bash
npm run package:win
```

Output binaries in `release/`:
- `Vidyasagara-Printers-Setup.exe` — Windows NSIS installer (Desktop shortcut, Start Menu shortcut, custom install directory, uninstaller)
- `Vidyasagara-Printers-Portable.exe` — Standalone portable Windows executable
