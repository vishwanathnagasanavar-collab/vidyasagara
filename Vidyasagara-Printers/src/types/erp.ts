export interface Branch {
  id: number;
  code: string;
  name: string;
  city: string;
  phone: string;
  is_active: number;
}

export interface StaffUser {
  id: number;
  username: string;
  full_name: string;
  role: 'Admin' | 'Operator' | 'Accounts' | 'Despatch';
  branch_code: string;
  phone: string;
  is_active: number;
  created_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  default_rate: number;
  unit: string;
  gst_percent: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  branch_code: string;
  order_prefix: string;
  city: string;
  gstin: string;
  credit_limit: number;
  created_at: string;
  total_orders?: number;
  total_amount?: number;
  total_rcvd?: number;
  total_bal?: number;
}

export interface PrintOrder {
  id: number;
  ord_no: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  order_date: string;
  qty: number;
  rate: number;
  amount: number;
  product_code: string;
  batch_no: string;
  br_transfer: number;
  br_rcvd: number;
  br_despatch: number;
  rcvd_amt: number;
  bal_amt: number;
  job_notes: string;
  branch_code: string;
  created_by: string;
  created_at: string;
}

export interface Receipt {
  id: number;
  ref_id: string;
  order_id: number;
  ord_no?: string;
  customer_id: number;
  customer_name?: string;
  receipt_date: string;
  notes: string;
  total_rcpt: number;
  adjusted_amt: number;
  pay_mode: 'Cash' | 'UPI' | 'NEFT' | 'Cheque' | 'Credit Adj';
  user_name: string;
  created_at: string;
}

export interface DashboardSummary {
  totalOrdersCount: number;
  totalRevenue: number;
  totalReceived: number;
  totalOutstanding: number;
  pendingDespatchCount: number;
  pendingTransferCount: number;
  activeCustomersCount: number;
  todayOrdersCount: number;
  todayRevenue: number;
  productBreakdown: Array<{
    product_code: string;
    order_count: number;
    total_qty: number;
    total_amount: number;
  }>;
  branchBreakdown: Array<{
    branch_code: string;
    order_count: number;
    total_amount: number;
    total_bal: number;
  }>;
}

export interface DbInfo {
  dbPath: string;
  fileSizeBytes: number;
  tables: Record<string, number>;
  engine: string;
}
