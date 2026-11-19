import type {
  Branch,
  Customer,
  DashboardSummary,
  DbInfo,
  PrintOrder,
  Product,
  Receipt,
  StaffUser,
} from '../types/erp';

export interface OrderFilters {
  customerId?: number;
  search?: string;
  productCode?: string;
  fromDate?: string;
  toDate?: string;
  pendingOnly?: boolean;
  batchNo?: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  getDashboard: () => Promise<DashboardSummary>;
  listCustomers: (search?: string) => Promise<Customer[]>;
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: number, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<{ ok: boolean }>;
  listOrders: (filters?: OrderFilters) => Promise<PrintOrder[]>;
  createOrder: (data: Partial<PrintOrder> & { pay_mode?: string }) => Promise<PrintOrder>;
  updateOrder: (id: number, data: Partial<PrintOrder>) => Promise<PrintOrder>;
  deleteOrder: (id: number) => Promise<{ ok: boolean }>;
  listReceipts: (orderId?: number, customerId?: number) => Promise<Receipt[]>;
  createReceipt: (data: Partial<Receipt>) => Promise<Receipt>;
  deleteReceipt: (id: number) => Promise<{ ok: boolean }>;
  listProducts: () => Promise<Product[]>;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: number, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: number) => Promise<{ ok: boolean }>;
  listBranches: () => Promise<Branch[]>;
  createBranch: (data: Partial<Branch>) => Promise<Branch>;
  updateBranch: (id: number, data: Partial<Branch>) => Promise<Branch>;
  deleteBranch: (id: number) => Promise<{ ok: boolean }>;
  listUsers: () => Promise<StaffUser[]>;
  createUser: (data: Partial<StaffUser>) => Promise<StaffUser>;
  updateUser: (id: number, data: Partial<StaffUser>) => Promise<StaffUser>;
  deleteUser: (id: number) => Promise<{ ok: boolean }>;
  getDbInfo: () => Promise<DbInfo>;
  exportBackup: () => Promise<{ ok: boolean; filePath?: string; canceled?: boolean; base64?: string }>;
  restoreBackup: (base64?: string) => Promise<{ ok: boolean; info?: DbInfo; canceled?: boolean }>;
  resetDb: () => Promise<{ ok: boolean; info: DbInfo }>;
  openDataFolder?: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

async function httpJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

function getBridge(): ElectronAPI | undefined {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

export const erpClient = {
  isDesktopApp(): boolean {
    return Boolean(getBridge()?.isElectron);
  },

  async getDashboard(): Promise<DashboardSummary> {
    const b = getBridge();
    if (b) return b.getDashboard();
    return httpJson<DashboardSummary>('/api/dashboard');
  },

  async listCustomers(search = ''): Promise<Customer[]> {
    const b = getBridge();
    if (b) return b.listCustomers(search);
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return httpJson<Customer[]>(`/api/customers${qs}`);
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const b = getBridge();
    if (b) return b.createCustomer(data);
    return httpJson<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const b = getBridge();
    if (b) return b.updateCustomer(id, data);
    return httpJson<Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteCustomer(id: number): Promise<{ ok: boolean }> {
    const b = getBridge();
    if (b) return b.deleteCustomer(id);
    return httpJson<{ ok: boolean }>(`/api/customers/${id}`, { method: 'DELETE' });
  },

  async listOrders(filters: OrderFilters = {}): Promise<PrintOrder[]> {
    const b = getBridge();
    if (b) return b.listOrders(filters);
    const params = new URLSearchParams();
    if (filters.customerId) params.set('customerId', String(filters.customerId));
    if (filters.search) params.set('search', filters.search);
    if (filters.productCode) params.set('productCode', filters.productCode);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.pendingOnly) params.set('pendingOnly', '1');
    if (filters.batchNo) params.set('batchNo', filters.batchNo);
    const qs = params.toString();
    return httpJson<PrintOrder[]>(`/api/orders${qs ? `?${qs}` : ''}`);
  },

  async createOrder(data: Partial<PrintOrder> & { pay_mode?: string }): Promise<PrintOrder> {
    const b = getBridge();
    if (b) return b.createOrder(data);
    return httpJson<PrintOrder>('/api/orders', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateOrder(id: number, data: Partial<PrintOrder>): Promise<PrintOrder> {
    const b = getBridge();
    if (b) return b.updateOrder(id, data);
    return httpJson<PrintOrder>(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteOrder(id: number): Promise<{ ok: boolean }> {
    const b = getBridge();
    if (b) return b.deleteOrder(id);
    return httpJson<{ ok: boolean }>(`/api/orders/${id}`, { method: 'DELETE' });
  },

  async listReceipts(orderId?: number, customerId?: number): Promise<Receipt[]> {
    const b = getBridge();
    if (b) return b.listReceipts(orderId, customerId);
    const params = new URLSearchParams();
    if (orderId) params.set('orderId', String(orderId));
    if (customerId) params.set('customerId', String(customerId));
    const qs = params.toString();
    return httpJson<Receipt[]>(`/api/receipts${qs ? `?${qs}` : ''}`);
  },

  async createReceipt(data: Partial<Receipt>): Promise<Receipt> {
    const b = getBridge();
    if (b) return b.createReceipt(data);
    return httpJson<Receipt>('/api/receipts', { method: 'POST', body: JSON.stringify(data) });
  },

  async deleteReceipt(id: number): Promise<{ ok: boolean }> {
    const b = getBridge();
    if (b) return b.deleteReceipt(id);
    return httpJson<{ ok: boolean }>(`/api/receipts/${id}`, { method: 'DELETE' });
  },

  async listProducts(): Promise<Product[]> {
    const b = getBridge();
    if (b) return b.listProducts();
    return httpJson<Product[]>('/api/products');
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const b = getBridge();
    if (b) return b.createProduct(data);
    return httpJson<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const b = getBridge();
    if (b) return b.updateProduct(id, data);
    return httpJson<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteProduct(id: number): Promise<{ ok: boolean }> {
    const b = getBridge();
    if (b) return b.deleteProduct(id);
    return httpJson<{ ok: boolean }>(`/api/products/${id}`, { method: 'DELETE' });
  },

  async listBranches(): Promise<Branch[]> {
    const b = getBridge();
    if (b) return b.listBranches();
    return httpJson<Branch[]>('/api/branches');
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const b = getBridge();
    if (b) return b.createBranch(data);
    return httpJson<Branch>('/api/branches', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
    const b = getBridge();
    if (b) return b.updateBranch(id, data);
    return httpJson<Branch>(`/api/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteBranch(id: number): Promise<{ ok: boolean }> {
    const b = getBridge();
    if (b) return b.deleteBranch(id);
    return httpJson<{ ok: boolean }>(`/api/branches/${id}`, { method: 'DELETE' });
  },

  async listUsers(): Promise<StaffUser[]> {
    const b = getBridge();
    if (b) return b.listUsers();
    return httpJson<StaffUser[]>('/api/users');
  },

  async createUser(data: Partial<StaffUser>): Promise<StaffUser> {
    const b = getBridge();
    if (b) return b.createUser(data);
    return httpJson<StaffUser>('/api/users', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateUser(id: number, data: Partial<StaffUser>): Promise<StaffUser> {
    const b = getBridge();
    if (b) return b.updateUser(id, data);
    return httpJson<StaffUser>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteUser(id: number): Promise<{ ok: boolean }> {
    const b = getBridge();
    if (b) return b.deleteUser(id);
    return httpJson<{ ok: boolean }>(`/api/users/${id}`, { method: 'DELETE' });
  },

  async getDbInfo(): Promise<DbInfo> {
    const b = getBridge();
    if (b) return b.getDbInfo();
    return httpJson<DbInfo>('/api/db/info');
  },

  async exportBackup(): Promise<{ ok: boolean; filePath?: string; canceled?: boolean }> {
    const b = getBridge();
    if (b) return b.exportBackup();
    const res = await fetch('/api/db/backup');
    if (!res.ok) throw new Error('Backup download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidyasagara-printers-backup-${new Date().toISOString().slice(0, 10)}.db`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  },

  async restoreBackup(base64?: string): Promise<{ ok: boolean; info?: DbInfo; canceled?: boolean }> {
    const b = getBridge();
    if (b) return b.restoreBackup(base64);
    if (!base64) throw new Error('No backup file selected');
    return httpJson<{ ok: boolean; info: DbInfo }>('/api/db/restore', {
      method: 'POST',
      body: JSON.stringify({ base64 }),
    });
  },

  async resetDb(): Promise<{ ok: boolean; info: DbInfo }> {
    const b = getBridge();
    if (b) return b.resetDb();
    return httpJson<{ ok: boolean; info: DbInfo }>('/api/db/reset', { method: 'POST' });
  },

  async openDataFolder(): Promise<void> {
    const b = getBridge();
    if (b?.openDataFolder) {
      await b.openDataFolder();
    }
  },
};
