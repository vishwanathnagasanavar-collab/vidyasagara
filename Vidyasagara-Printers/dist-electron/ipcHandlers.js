"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function registerIpcHandlers(db, getWindow) {
    electron_1.ipcMain.handle('vp:getDashboard', () => db.getDashboardSummary());
    // Customers
    electron_1.ipcMain.handle('vp:listCustomers', (_e, search) => db.listCustomers(search || ''));
    electron_1.ipcMain.handle('vp:createCustomer', (_e, data) => db.createCustomer(data));
    electron_1.ipcMain.handle('vp:updateCustomer', (_e, id, data) => db.updateCustomer(id, data));
    electron_1.ipcMain.handle('vp:deleteCustomer', (_e, id) => db.deleteCustomer(id));
    // Orders
    electron_1.ipcMain.handle('vp:listOrders', (_e, filters) => db.listOrders(filters || {}));
    electron_1.ipcMain.handle('vp:createOrder', (_e, data) => db.createOrder(data));
    electron_1.ipcMain.handle('vp:updateOrder', (_e, id, data) => db.updateOrder(id, data));
    electron_1.ipcMain.handle('vp:deleteOrder', (_e, id) => db.deleteOrder(id));
    // Receipts
    electron_1.ipcMain.handle('vp:listReceipts', (_e, orderId, customerId) => db.listReceipts(orderId, customerId));
    electron_1.ipcMain.handle('vp:createReceipt', (_e, data) => db.createReceipt(data));
    electron_1.ipcMain.handle('vp:deleteReceipt', (_e, id) => db.deleteReceipt(id));
    // Products
    electron_1.ipcMain.handle('vp:listProducts', () => db.listProducts());
    electron_1.ipcMain.handle('vp:createProduct', (_e, data) => db.createProduct(data));
    electron_1.ipcMain.handle('vp:updateProduct', (_e, id, data) => db.updateProduct(id, data));
    electron_1.ipcMain.handle('vp:deleteProduct', (_e, id) => db.deleteProduct(id));
    // Branches
    electron_1.ipcMain.handle('vp:listBranches', () => db.listBranches());
    electron_1.ipcMain.handle('vp:createBranch', (_e, data) => db.createBranch(data));
    electron_1.ipcMain.handle('vp:updateBranch', (_e, id, data) => db.updateBranch(id, data));
    electron_1.ipcMain.handle('vp:deleteBranch', (_e, id) => db.deleteBranch(id));
    // Users
    electron_1.ipcMain.handle('vp:listUsers', () => db.listUsers());
    electron_1.ipcMain.handle('vp:createUser', (_e, data) => db.createUser(data));
    electron_1.ipcMain.handle('vp:updateUser', (_e, id, data) => db.updateUser(id, data));
    electron_1.ipcMain.handle('vp:deleteUser', (_e, id) => db.deleteUser(id));
    // Database Backup & Restore
    electron_1.ipcMain.handle('vp:getDbInfo', () => db.getDbInfo());
    electron_1.ipcMain.handle('vp:exportBackup', async () => {
        const win = getWindow();
        const defaultName = `vidyasagara-printers-backup-${new Date().toISOString().slice(0, 10)}.db`;
        const result = await electron_1.dialog.showSaveDialog(win, {
            title: 'Export SQLite Database Backup',
            defaultPath: path_1.default.join(electron_1.app.getPath('documents'), defaultName),
            filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
        });
        if (result.canceled || !result.filePath) {
            return { ok: false, canceled: true };
        }
        const buf = db.exportBackupBuffer();
        fs_1.default.writeFileSync(result.filePath, buf);
        return { ok: true, filePath: result.filePath };
    });
    electron_1.ipcMain.handle('vp:restoreBackup', async () => {
        const win = getWindow();
        const result = await electron_1.dialog.showOpenDialog(win, {
            title: 'Select Vidyasagara Printers SQLite Backup',
            properties: ['openFile'],
            filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return { ok: false, canceled: true };
        }
        const buf = fs_1.default.readFileSync(result.filePaths[0]);
        db.restoreBackupBuffer(buf);
        return { ok: true, info: db.getDbInfo() };
    });
    electron_1.ipcMain.handle('vp:resetDb', () => {
        db.resetToSampleData();
        return { ok: true, info: db.getDbInfo() };
    });
    electron_1.ipcMain.handle('vp:openDataFolder', async () => {
        await electron_1.shell.openPath(path_1.default.dirname(db.dbPath));
    });
}
