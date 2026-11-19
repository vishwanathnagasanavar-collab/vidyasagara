import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getDashboard: () => ipcRenderer.invoke('vp:getDashboard'),

  listCustomers: (search?: string) => ipcRenderer.invoke('vp:listCustomers', search),
  createCustomer: (data: unknown) => ipcRenderer.invoke('vp:createCustomer', data),
  updateCustomer: (id: number, data: unknown) => ipcRenderer.invoke('vp:updateCustomer', id, data),
  deleteCustomer: (id: number) => ipcRenderer.invoke('vp:deleteCustomer', id),

  listOrders: (filters?: unknown) => ipcRenderer.invoke('vp:listOrders', filters),
  createOrder: (data: unknown) => ipcRenderer.invoke('vp:createOrder', data),
  updateOrder: (id: number, data: unknown) => ipcRenderer.invoke('vp:updateOrder', id, data),
  deleteOrder: (id: number) => ipcRenderer.invoke('vp:deleteOrder', id),

  listReceipts: (orderId?: number, customerId?: number) =>
    ipcRenderer.invoke('vp:listReceipts', orderId, customerId),
  createReceipt: (data: unknown) => ipcRenderer.invoke('vp:createReceipt', data),
  deleteReceipt: (id: number) => ipcRenderer.invoke('vp:deleteReceipt', id),

  listProducts: () => ipcRenderer.invoke('vp:listProducts'),
  createProduct: (data: unknown) => ipcRenderer.invoke('vp:createProduct', data),
  updateProduct: (id: number, data: unknown) => ipcRenderer.invoke('vp:updateProduct', id, data),
  deleteProduct: (id: number) => ipcRenderer.invoke('vp:deleteProduct', id),

  listBranches: () => ipcRenderer.invoke('vp:listBranches'),
  createBranch: (data: unknown) => ipcRenderer.invoke('vp:createBranch', data),
  updateBranch: (id: number, data: unknown) => ipcRenderer.invoke('vp:updateBranch', id, data),
  deleteBranch: (id: number) => ipcRenderer.invoke('vp:deleteBranch', id),

  listUsers: () => ipcRenderer.invoke('vp:listUsers'),
  createUser: (data: unknown) => ipcRenderer.invoke('vp:createUser', data),
  updateUser: (id: number, data: unknown) => ipcRenderer.invoke('vp:updateUser', id, data),
  deleteUser: (id: number) => ipcRenderer.invoke('vp:deleteUser', id),

  getDbInfo: () => ipcRenderer.invoke('vp:getDbInfo'),
  exportBackup: () => ipcRenderer.invoke('vp:exportBackup'),
  restoreBackup: () => ipcRenderer.invoke('vp:restoreBackup'),
  resetDb: () => ipcRenderer.invoke('vp:resetDb'),
  openDataFolder: () => ipcRenderer.invoke('vp:openDataFolder'),
});
