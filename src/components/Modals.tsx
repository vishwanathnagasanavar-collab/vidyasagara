import React, { useState, useEffect } from 'react';
import { X, Printer, AlertTriangle } from 'lucide-react';
import type { Branch, Customer, PrintOrder, Product, Receipt, StaffUser } from '../types/erp';
import { formatMoney, formatShortDate, todayIsoDate } from '../utils/format';

interface OrderModalProps {
  open: boolean;
  editingOrder: PrintOrder | null;
  defaultCustomerId?: number;
  customers: Customer[];
  products: Product[];
  branches: Branch[];
  onClose: () => void;
  onSave: (payload: Partial<PrintOrder> & { pay_mode?: string }) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  open,
  editingOrder,
  defaultCustomerId,
  customers,
  products,
  branches,
  onClose,
  onSave,
}) => {
  const [customerId, setCustomerId] = useState<number>(defaultCustomerId || 0);
  const [ordNo, setOrdNo] = useState('');
  const [orderDate, setOrderDate] = useState(todayIsoDate());
  const [productCode, setProductCode] = useState('ADS');
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(450);
  const [batchNo, setBatchNo] = useState('');
  const [branchCode, setBranchCode] = useState('JPB');
  const [rcvdAmt, setRcvdAmt] = useState(0);
  const [payMode, setPayMode] = useState('Cash');
  const [brTransfer, setBrTransfer] = useState(true);
  const [brRcvd, setBrRcvd] = useState(true);
  const [brDespatch, setBrDespatch] = useState(false);
  const [jobNotes, setJobNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingOrder) {
      setCustomerId(editingOrder.customer_id);
      setOrdNo(editingOrder.ord_no);
      setOrderDate(editingOrder.order_date.slice(0, 10));
      setProductCode(editingOrder.product_code);
      setQty(editingOrder.qty);
      setRate(editingOrder.rate);
      setBatchNo(editingOrder.batch_no);
      setBranchCode(editingOrder.branch_code);
      setRcvdAmt(editingOrder.rcvd_amt);
      setBrTransfer(editingOrder.br_transfer === 1);
      setBrRcvd(editingOrder.br_rcvd === 1);
      setBrDespatch(editingOrder.br_despatch === 1);
      setJobNotes(editingOrder.job_notes || '');
    } else {
      const cust = customers.find((c) => c.id === defaultCustomerId) || customers[0];
      setCustomerId(cust?.id || 0);
      setOrdNo('');
      setOrderDate(todayIsoDate());
      const prod = products[0];
      setProductCode(prod?.code || 'ADS');
      setQty(1);
      setRate(prod?.default_rate || 450);
      setBatchNo(String(Math.floor(41700 + Math.random() * 250)));
      setBranchCode(cust?.order_prefix || 'JPB');
      setRcvdAmt(0);
      setPayMode('Cash');
      setBrTransfer(true);
      setBrRcvd(true);
      setBrDespatch(false);
      setJobNotes('');
    }
  }, [open, editingOrder, defaultCustomerId, customers, products]);

  if (!open) return null;

  const totalAmount = Number((qty * rate).toFixed(2));

  const handleProductChange = (code: string) => {
    setProductCode(code);
    const p = products.find((x) => x.code === code);
    if (p && !editingOrder) {
      setRate(p.default_rate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        customer_id: customerId,
        ord_no: ordNo || undefined,
        order_date: orderDate,
        product_code: productCode,
        qty,
        rate,
        batch_no: batchNo,
        branch_code: branchCode,
        rcvd_amt: editingOrder ? undefined : rcvdAmt,
        pay_mode: payMode,
        br_transfer: brTransfer ? 1 : 0,
        br_rcvd: brRcvd ? 1 : 0,
        br_despatch: brDespatch ? 1 : 0,
        job_notes: jobNotes,
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D1D5DB] rounded-[3px] shadow-xl w-full max-w-[640px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h3 className="text-[14px] font-bold text-[#1F2937]">
            {editingOrder ? `Edit Job Order — ${editingOrder.ord_no}` : 'New Job Order'}
          </h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-[12.5px]">
          {error && (
            <div className="px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-[2px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#374151] mb-1">Customer / Party *</label>
              <select
                value={customerId}
                disabled={Boolean(editingOrder)}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setCustomerId(id);
                  const c = customers.find((x) => x.id === id);
                  if (c) setBranchCode(c.order_prefix || c.branch_code);
                }}
                className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white disabled:bg-[#F3F4F6] focus:outline-none focus:border-[#F26522]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#374151] mb-1">Order No. (leave blank to auto-generate)</label>
              <input
                type="text"
                value={ordNo}
                onChange={(e) => setOrdNo(e.target.value)}
                placeholder="Auto e.g. JPB-18701"
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#374151] mb-1">Order Date *</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#374151] mb-1">Product *</label>
              <select
                value={productCode}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white focus:outline-none focus:border-[#F26522]"
              >
                {products.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-[#374151] mb-1">Qty *</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] tabular-nums focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#374151] mb-1">Rate *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] tabular-nums focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#374151] mb-1">Amount</label>
                <div className="h-[32px] px-2 flex items-center bg-[#F3F4F6] border border-[#D1D5DB] rounded-[2px] font-semibold tabular-nums text-[#1F2937]">
                  {formatMoney(totalAmount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-[#374151] mb-1">Batch No.</label>
                <input
                  type="text"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  placeholder="41705"
                  className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] tabular-nums focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#374151] mb-1">Branch</label>
                <select
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white focus:outline-none focus:border-[#F26522]"
                >
                  {branches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!editingOrder && (
              <>
                <div>
                  <label className="block font-medium text-[#374151] mb-1">Advance / Received Amt</label>
                  <input
                    type="number"
                    min={0}
                    max={totalAmount}
                    step="0.01"
                    value={rcvdAmt}
                    onChange={(e) => setRcvdAmt(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] tabular-nums focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#374151] mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white focus:outline-none focus:border-[#F26522]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={brTransfer}
                onChange={(e) => setBrTransfer(e.target.checked)}
                className="accent-[#F26522] w-4 h-4"
              />
              <span>Br.Transfer</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={brRcvd}
                onChange={(e) => setBrRcvd(e.target.checked)}
                className="accent-[#F26522] w-4 h-4"
              />
              <span>Br.Rcvd</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={brDespatch}
                onChange={(e) => setBrDespatch(e.target.checked)}
                className="accent-[#F26522] w-4 h-4"
              />
              <span>Br.Despatch</span>
            </label>
          </div>

          <div>
            <label className="block font-medium text-[#374151] mb-1">Job Notes / Print Specifications</label>
            <textarea
              rows={2}
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              placeholder="e.g. 1000 PCS glossy lamination, center creasing & trim..."
              className="w-full p-2 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:bg-[#F3F4F6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-[#F26522] text-white font-medium rounded-[2px] hover:bg-[#DC5516] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editingOrder ? 'Update Order' : 'Save Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CustomerModalProps {
  open: boolean;
  editingCustomer: Customer | null;
  branches: Branch[];
  onClose: () => void;
  onSave: (payload: Partial<Customer>) => Promise<void>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  open,
  editingCustomer,
  branches,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchCode, setBranchCode] = useState('JUSTPRINT');
  const [orderPrefix, setOrderPrefix] = useState('JPB');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setBranchCode(editingCustomer.branch_code);
      setOrderPrefix(editingCustomer.order_prefix);
      setCity(editingCustomer.city || '');
      setGstin(editingCustomer.gstin || '');
      setCreditLimit(editingCustomer.credit_limit || 50000);
    } else {
      setName('');
      setPhone('');
      setBranchCode('JUSTPRINT');
      setOrderPrefix('JPB');
      setCity('');
      setGstin('');
      setCreditLimit(50000);
    }
  }, [open, editingCustomer]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name,
        phone,
        branch_code: branchCode,
        order_prefix: orderPrefix,
        city,
        gstin,
        credit_limit: creditLimit,
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D1D5DB] rounded-[3px] shadow-xl w-full max-w-[500px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h3 className="text-[14px] font-bold text-[#1F2937]">
            {editingCustomer ? `Edit Customer #${editingCustomer.id}` : 'Add New Customer / Party'}
          </h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-[12.5px]">
          {error && (
            <div className="px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-[2px]">
              {error}
            </div>
          )}
          <div>
            <label className="block font-medium text-[#374151] mb-1">Party / Customer Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIDHYASAGAR PRINTS HUBBALLI"
              className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] uppercase focus:outline-none focus:border-[#F26522]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#374151] mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="91486 08960"
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">Branch</label>
              <select
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white focus:outline-none focus:border-[#F26522]"
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">Order Series Prefix</label>
              <input
                type="text"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value)}
                placeholder="JPB"
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] uppercase focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Belagavi"
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="29AAACV..."
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] uppercase focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">Credit Limit</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] tabular-nums focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:bg-[#F3F4F6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-[#F26522] text-white font-medium rounded-[2px] hover:bg-[#DC5516] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReceiptModalProps {
  open: boolean;
  order: PrintOrder | null;
  users: StaffUser[];
  onClose: () => void;
  onSave: (payload: Partial<Receipt>) => Promise<void>;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  open,
  order,
  users,
  onClose,
  onSave,
}) => {
  const [receiptDate, setReceiptDate] = useState(todayIsoDate());
  const [totalRcpt, setTotalRcpt] = useState(0);
  const [payMode, setPayMode] = useState<Receipt['pay_mode']>('Cash');
  const [notes, setNotes] = useState('');
  const [userName, setUserName] = useState('Vishwanath N.');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !order) return;
    setError('');
    setReceiptDate(todayIsoDate());
    setTotalRcpt(order.bal_amt > 0 ? order.bal_amt : order.amount);
    setPayMode('Cash');
    setNotes(`Payment against ${order.ord_no}`);
    setUserName(users[0]?.full_name || 'Vishwanath N.');
  }, [open, order, users]);

  if (!open || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalRcpt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        order_id: order.id,
        receipt_date: receiptDate,
        total_rcpt: totalRcpt,
        adjusted_amt: totalRcpt,
        pay_mode: payMode,
        notes,
        user_name: userName,
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D1D5DB] rounded-[3px] shadow-xl w-full max-w-[440px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h3 className="text-[14px] font-bold text-[#1F2937]">
            Record Payment Receipt — {order.ord_no}
          </h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-[12.5px]">
          {error && (
            <div className="px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-[2px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[2px] tabular-nums">
            <div>
              <div className="text-[11px] text-[#6B7280]">Order Amt</div>
              <div className="font-bold text-[#1F2937]">{formatMoney(order.amount)}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#6B7280]">Received</div>
              <div className="font-bold text-[#16A34A]">{formatMoney(order.rcvd_amt)}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#6B7280]">Balance Due</div>
              <div className="font-bold text-[#DC2626]">{formatMoney(order.bal_amt)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#374151] mb-1">Receipt Date *</label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">Amount Received *</label>
              <input
                type="number"
                required
                min={0.01}
                step="0.01"
                value={totalRcpt}
                onChange={(e) => setTotalRcpt(Number(e.target.value) || 0)}
                className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] tabular-nums focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">Pay Mode</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value as Receipt['pay_mode'])}
                className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Adj">Credit Adj</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">Collected By</label>
              <select
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full h-[32px] px-2 border border-[#D1D5DB] rounded-[2px] bg-white focus:outline-none focus:border-[#F26522]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.full_name}>
                    {u.full_name}
                  </option>
                ))}
                {!users.some((u) => u.full_name === userName) && (
                  <option value={userName}>{userName}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#374151] mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-[32px] px-2.5 border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:bg-[#F3F4F6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-[#F26522] text-white font-medium rounded-[2px] hover:bg-[#DC5516] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Recording...' : 'Save Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface JobCardPrintModalProps {
  open: boolean;
  order: PrintOrder | null;
  receipts: Receipt[];
  onClose: () => void;
}

export const JobCardPrintModal: React.FC<JobCardPrintModalProps> = ({
  open,
  order,
  receipts,
  onClose,
}) => {
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D1D5DB] rounded-[3px] shadow-xl w-full max-w-[680px] overflow-hidden">
        <div className="no-print flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <h3 className="text-[14px] font-bold text-[#1F2937]">Job Card — {order.ord_no}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F26522] text-white rounded-[2px] text-[12px] font-medium hover:bg-[#DC5516] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Job Card
            </button>
            <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 text-[13px] text-[#1F2937]">
          <div className="flex items-start justify-between border-b-2 border-[#F26522] pb-3">
            <div>
              <div className="text-[20px] font-bold">
                <span className="text-[#1F2937]">Vidyasagara </span>
                <span className="text-[#F26522]">Printers</span>
              </div>
              <div className="text-[11px] text-[#6B7280]">Commercial Offset, Digital & Packaging Press</div>
            </div>
            <div className="text-right tabular-nums">
              <div className="text-[14px] font-bold">JOB CARD: {order.ord_no}</div>
              <div className="text-[12px] text-[#6B7280]">Order ID: {order.id} · Date: {formatShortDate(order.order_date)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
            <div>
              <div className="text-[11px] text-[#6B7280]">Customer / Party</div>
              <div className="font-bold">{order.customer_name} (ID: {order.customer_id})</div>
              <div className="text-[12px] text-[#4B5563]">{order.customer_phone}</div>
            </div>
            <div className="text-right tabular-nums">
              <div className="text-[11px] text-[#6B7280]">Production Batch & Branch</div>
              <div className="font-bold">Batch #{order.batch_no} · {order.branch_code}</div>
              <div className="text-[12px] text-[#4B5563]">
                Transfer: {order.br_transfer ? 'Yes' : 'No'} | Rcvd: {order.br_rcvd ? 'Yes' : 'No'} | Despatch: {order.br_despatch ? 'Yes' : 'Pending'}
              </div>
            </div>
          </div>

          <table className="w-full border-collapse border border-[#D1D5DB] text-[12.5px] tabular-nums">
            <thead>
              <tr className="bg-[#F3F4F6] text-left">
                <th className="p-2 border border-[#D1D5DB]">Product</th>
                <th className="p-2 border border-[#D1D5DB] text-right">Qty</th>
                <th className="p-2 border border-[#D1D5DB] text-right">Rate</th>
                <th className="p-2 border border-[#D1D5DB] text-right">Amount</th>
                <th className="p-2 border border-[#D1D5DB] text-right">Received</th>
                <th className="p-2 border border-[#D1D5DB] text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-[#D1D5DB] font-semibold">{order.product_code}</td>
                <td className="p-2 border border-[#D1D5DB] text-right">{order.qty}</td>
                <td className="p-2 border border-[#D1D5DB] text-right">{formatMoney(order.rate)}</td>
                <td className="p-2 border border-[#D1D5DB] text-right font-semibold">{formatMoney(order.amount)}</td>
                <td className="p-2 border border-[#D1D5DB] text-right">{formatMoney(order.rcvd_amt)}</td>
                <td className="p-2 border border-[#D1D5DB] text-right font-bold text-[#DC2626]">{formatMoney(order.bal_amt)}</td>
              </tr>
            </tbody>
          </table>

          <div className="p-3 border border-[#E5E7EB]">
            <div className="text-[11px] font-semibold text-[#6B7280] mb-1">Job Specifications / Notes</div>
            <div className="text-[13px]">{order.job_notes || 'Standard finishing & trim.'}</div>
          </div>

          {receipts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#6B7280] mb-1">Payment Receipts</div>
              <table className="w-full border-collapse border border-[#E5E7EB] text-[12px] tabular-nums">
                <thead>
                  <tr className="bg-[#F9FAFB] text-left">
                    <th className="p-1.5 border border-[#E5E7EB]">Ref.ID</th>
                    <th className="p-1.5 border border-[#E5E7EB]">Date</th>
                    <th className="p-1.5 border border-[#E5E7EB]">Mode</th>
                    <th className="p-1.5 border border-[#E5E7EB]">Notes</th>
                    <th className="p-1.5 border border-[#E5E7EB] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id}>
                      <td className="p-1.5 border border-[#E5E7EB]">{r.ref_id}</td>
                      <td className="p-1.5 border border-[#E5E7EB]">{formatShortDate(r.receipt_date)}</td>
                      <td className="p-1.5 border border-[#E5E7EB]">{r.pay_mode}</td>
                      <td className="p-1.5 border border-[#E5E7EB]">{r.notes}</td>
                      <td className="p-1.5 border border-[#E5E7EB] text-right">{formatMoney(r.total_rcpt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}) => {
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D1D5DB] rounded-[3px] shadow-xl w-full max-w-[400px] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[14px] font-bold text-[#1F2937]">{title}</h4>
            <p className="text-[12.5px] text-[#4B5563] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-[12px] border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:bg-[#F3F4F6] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            className="px-3.5 py-1.5 text-[12px] bg-[#DC2626] text-white font-medium rounded-[2px] hover:bg-[#B91C1C] disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
