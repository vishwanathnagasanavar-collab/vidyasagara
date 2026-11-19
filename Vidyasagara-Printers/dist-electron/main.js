"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const ipcHandlers_1 = require("./ipcHandlers");
let mainWindow = null;
let database = null;
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
function getIconPath() {
    return path_1.default.join(__dirname, '..', 'build', 'icon.png');
}
function createApplicationMenu() {
    const template = [
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
                        if (database)
                            electron_1.shell.openPath(path_1.default.dirname(database.dbPath));
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
                        if (!mainWindow)
                            return;
                        electron_1.dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Vidyasagara Printers',
                            message: 'Vidyasagara Printers Desktop Software',
                            detail: `Version: ${electron_1.app.getVersion()}\nDatabase: ${database?.dbPath || 'AppData'}\nCommercial Print Order, Batch & Party Ledger System.`,
                        });
                    },
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
async function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 880,
        minWidth: 1024,
        minHeight: 680,
        title: 'Vidyasagara Printers',
        icon: getIconPath(),
        backgroundColor: '#F8F9FA',
        show: false,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
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
            electron_1.shell.openExternal(url);
        }
        return { action: 'deny' };
    });
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
        await mainWindow.loadURL(devUrl);
    }
    else {
        await mainWindow.loadFile(path_1.default.join(__dirname, '..', 'dist', 'index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(async () => {
    try {
        electron_1.app.setName('Vidyasagara Printers');
        const userDataDir = electron_1.app.getPath('userData');
        const dbPath = path_1.default.join(userDataDir, 'vidyasagara-printers.db');
        const appRoot = path_1.default.join(__dirname, '..');
        database = new database_1.DesktopPrinterDatabase(dbPath, appRoot);
        await database.init();
        (0, ipcHandlers_1.registerIpcHandlers)(database, () => mainWindow);
        createApplicationMenu();
        await createMainWindow();
    }
    catch (err) {
        electron_1.dialog.showErrorBox('Startup Error', `Failed to initialize Vidyasagara Printers:\n${err.message}`);
        electron_1.app.quit();
    }
    electron_1.app.on('activate', async () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
});
electron_1.app.on('before-quit', () => {
    database?.close();
});
electron_1.app.on('window-all-closed', () => {
    database?.close();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
