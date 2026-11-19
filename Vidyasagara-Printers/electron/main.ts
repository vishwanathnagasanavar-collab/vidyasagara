import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import path from 'path';
import { DesktopPrinterDatabase } from './database';
import { registerIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;
let database: DesktopPrinterDatabase | null = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getIconPath(): string {
  return path.join(__dirname, '..', 'build', 'icon.png');
}

function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload Workspace',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload(),
        },
        { type: 'separator' },
        {
          label: 'Open Data Folder',
          click: () => {
            if (database) shell.openPath(path.dirname(database.dbPath));
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Vidyasagara Printers' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Vidyasagara Printers',
          click: () => {
            if (!mainWindow) return;
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Vidyasagara Printers',
              message: 'Vidyasagara Printers Desktop Software',
              detail: `Version: ${app.getVersion()}\nDatabase: ${database?.dbPath || 'AppData'}\nCommercial Print Order, Batch & Party Ledger System.`,
            });
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    title: 'Vidyasagara Printers',
    icon: getIconPath(),
    backgroundColor: '#F8F9FA',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    app.setName('Vidyasagara Printers');
    const userDataDir = app.getPath('userData');
    const dbPath = path.join(userDataDir, 'vidyasagara-printers.db');
    const appRoot = path.join(__dirname, '..');

    database = new DesktopPrinterDatabase(dbPath, appRoot);
    await database.init();

    registerIpcHandlers(database, () => mainWindow);
    createApplicationMenu();
    await createMainWindow();
  } catch (err) {
    dialog.showErrorBox('Startup Error', `Failed to initialize Vidyasagara Printers:\n${(err as Error).message}`);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  database?.close();
});

app.on('window-all-closed', () => {
  database?.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
