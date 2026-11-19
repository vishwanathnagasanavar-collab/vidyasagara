import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import type { DesktopPrinterDatabase } from './database';

export function registerIpcHandlers(db: DesktopPrinterDatabase, getWindow: () => BrowserWindow | null) {
  ipcMain.handle('vp:getDashboard', () => db.getDashboardSummary());

  // Customers
  ipcMain.handle('vp:listCustomers', (_e, search?: string) => db.listCustomers(search || ''));
  ipcMain.handle('vp:createCustomer', (_e, data) => db.createCustomer(data));
  ipcMain.handle('vp:updateCustomer', (_e, id: number, data) => db.updateCustomer(id, data));
  ipcMain.handle('vp:deleteCustomer', (_e, id: number) => db.deleteCustomer(id));

  // Orders
  ipcMain.handle('vp:listOrders', (_e, filters) => db.listOrders(filters || {}));
  ipcMain.handle('vp:createOrder', (_e, data) => db.createOrder(data));
  ipcMain.handle('vp:updateOrder', (_e, id: number, data) => db.updateOrder(id, data));
  ipcMain.handle('vp:deleteOrder', (_e, id: number) => db.deleteOrder(id));

  // Receipts
  ipcMain.handle('vp:listReceipts', (_e, orderId?: number, customerId?: number) =>
    db.listReceipts(orderId, customerId)
  );
  ipcMain.handle('vp:createReceipt', (_e, data) => db.createReceipt(data));
  ipcMain.handle('vp:deleteReceipt', (_e, id: number) => db.deleteReceipt(id));

  // Products
  ipcMain.handle('vp:listProducts', () => db.listProducts());
  ipcMain.handle('vp:createProduct', (_e, data) => db.createProduct(data));
  ipcMain.handle('vp:updateProduct', (_e, id: number, data) => db.updateProduct(id, data));
  ipcMain.handle('vp:deleteProduct', (_e, id: number) => db.deleteProduct(id));

  // Branches
  ipcMain.handle('vp:listBranches', () => db.listBranches());
  ipcMain.handle('vp:createBranch', (_e, data) => db.createBranch(data));
  ipcMain.handle('vp:updateBranch', (_e, id: number, data) => db.updateBranch(id, data));
  ipcMain.handle('vp:deleteBranch', (_e, id: number) => db.deleteBranch(id));

  // Users
  ipcMain.handle('vp:listUsers', () => db.listUsers());
  ipcMain.handle('vp:createUser', (_e, data) => db.createUser(data));
  ipcMain.handle('vp:updateUser', (_e, id: number, data) => db.updateUser(id, data));
  ipcMain.handle('vp:deleteUser', (_e, id: number) => db.deleteUser(id));

  // Database Backup & Restore
  ipcMain.handle('vp:getDbInfo', () => db.getDbInfo());

  ipcMain.handle('vp:exportBackup', async () => {
    const win = getWindow();
    const defaultName = `vidyasagara-printers-backup-${new Date().toISOString().slice(0, 10)}.db`;
    const result = await dialog.showSaveDialog(win!, {
      title: 'Export SQLite Database Backup',
      defaultPath: path.join(app.getPath('documents'), defaultName),
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
    });
    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }
    const buf = db.exportBackupBuffer();
    fs.writeFileSync(result.filePath, buf);
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle('vp:restoreBackup', async () => {
    const win = getWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: 'Select Vidyasagara Printers SQLite Backup',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const buf = fs.readFileSync(result.filePaths[0]);
    db.restoreBackupBuffer(buf);
    return { ok: true, info: db.getDbInfo() };
  });

  ipcMain.handle('vp:resetDb', () => {
    db.resetToSampleData();
    return { ok: true, info: db.getDbInfo() };
  });

  ipcMain.handle('vp:openDataFolder', async () => {
    await shell.openPath(path.dirname(db.dbPath));
  });
}
