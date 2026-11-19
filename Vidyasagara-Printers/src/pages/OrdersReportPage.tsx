import React, { useState, useMemo } from 'react';
import { Plus, Download, Printer, CreditCard, Edit3, Trash2 } from 'lucide-react';
import type { Customer, PrintOrder, Product } from '../types/erp';
import { formatMoney, formatMoneyBlankZero, formatShortDate } from '../utils/format';
import { GridPagination } from '../components/GridPagination';
import { OrangeCheckbox } from '../components/OrangeCheckbox';

export type ReportMode =
  | 'orders-datewise'
  | 'orders-productwise'
  | 'batch-jobcards'
  | 'party-outstanding'
  | 'pending-jobs'
  | 'orders-history';

interface OrdersReportPageProps {
  mode: ReportMode;
  orders: PrintOrder[];
  customers: Customer[];
  products: Product[];
  onToggleOrderFlag: (order: PrintOrder, field: 'br_transfer' | 'br_rcvd' | 'br_despatch') => Promise<void>;
  onOpenNewOrder: () => void;
  onOpenEditOrder: (order: PrintOrder) => void;
  onOpenDeleteOrder: (order: PrintOrder) => void;
  onOpenReceiptModal: (order: PrintOrder) => void;
  onOpenPrintJobCard: (order: PrintOrder) => void;
  onSelectCustomerAndView: (customerId: number, orderId?: number) => void;
}

const MODE_TITLES: Record<ReportMode, string> = {
  'orders-datewise': 'Orders - Datewise (Daily Register)',
  'orders-productwise': 'Orders - Productwise Analysis',
  'batch-jobcards': 'Batch - JobCards & Production Batches',
  'party-outstanding': 'Party Outstanding & Credit Ledger',
  'pending-jobs': 'Pending Jobs (Undispatched / Balance Due)',
  'orders-history': 'Complete Orders History',
};

export const OrdersReportPage: React.FC<OrdersReportPageProps> = ({
  mode,
  orders,
  customers,
  products,
  onToggleOrderFlag,
  onOpenNewOrder,
  onOpenEditOrder,
  onOpenDeleteOrder,
  onOpenReceiptModal,
  onOpenPrintJobCard,
  onSelectCustomerAndView,
}) => {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [productCode, setProductCode] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Batch summary for batch-jobcards mode
  const batches = useMemo(() => {
    const map = new Map<
      string,
      { batch_no: string; count: number; qty: number; amount: number; pending_despatch: number }
    >();
    for (const o of orders) {
      const cur = map.get(o.batch_no) || {
        batch_no: o.batch_no,
        count: 0,
        qty: 0,
        amount: 0,
        pending_despatch: 0,
      };
      cur.count += 1;
      cur.qty += o.qty;
      cur.amount += o.amount;
      if (o.br_despatch === 0) cur.pending_despatch += 1;
      map.set(o.batch_no, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.batch_no.localeCompare(a.batch_no));
  }, [orders]);

  // Filtered orders for order-based modes
  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (mode === 'pending-jobs') {
      list = list.filter((o) => o.br_despatch === 0 || o.bal_amt > 0);
    }
    if (fromDate) {
      list = list.filter((o) => o.order_date >= fromDate);
    }
    if (toDate) {
      list = list.filter((o) => o.order_date <= toDate);
    }
    if (productCode) {
      list = list.filter((o) => o.product_code === productCode);
    }
    if (mode === 'batch-jobcards' && selectedBatch) {
      list = list.filter((o) => o.batch_no === selectedBatch);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.ord_no.toLowerCase().includes(q) ||
          (o.customer_name || '').toLowerCase().includes(q) ||
          String(o.id).includes(q) ||
          o.product_code.toLowerCase().includes(q) ||
          o.batch_no.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, mode, fromDate, toDate, productCode, selectedBatch, search]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const orderTotals = useMemo(() => {
    return filteredOrders.reduce(
      (acc, o) => {
        acc.qty += o.qty;
        acc.amount += o.amount;
        acc.rcvd += o.rcvd_amt;
        acc.bal += o.bal_amt;
        return acc;
      },
      { qty: 0, amount: 0, rcvd: 0, bal: 0 }
    );
  }, [filteredOrders]);

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) || pagedOrders[0] || null;

  const exportCsv = () => {
    const headers = ['ID', 'Ord.No.', 'Customer', 'Date', 'Qty', 'Rate', 'Amount', 'Product', 'Batch', 'Rcvd. Amt', 'Bal. Amt'];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.ord_no,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      o.order_date,
      o.qty,
      o.rate,
      o.amount,
      o.product_code,
      o.batch_no,
      o.rcvd_amt,
      o.bal_amt,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidyasagara-${mode}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // PARTY OUTSTANDING VIEW
  if (mode === 'party-outstanding') {
    const filteredParties = customers.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });
    const totAmt = filteredParties.reduce((s, c) => s + Number(c.total_amount || 0), 0);
    const totRcvd = filteredParties.reduce((s, c) => s + Number(c.total_rcvd || 0), 0);
    const totBal = filteredParties.reduce((s, c) => s + Number(c.total_bal || 0), 0);

    return (
      <div className="p-3 space-y-3 bg-[#F8F9FA] min-h-full">
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-[#1F2937]">{MODE_TITLES[mode]}</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search party name or phone..."
              className="w-64 h-[28px] px-2.5 text-[12px] border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                  <th className="px-3 py-2 text-right font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Customer / Party</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Branch</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Total Billed</th>
                  <th className="px-3 py-2 text-right font-medium">Received</th>
                  <th className="px-3 py-2 text-right font-medium">Outstanding Bal.</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.map((c) => {
                  const hasDue = Number(c.total_bal || 0) > 0;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-[#E5E7EB] hover:bg-[#FFF8F4] ${
                        hasDue ? 'text-[#DC2626]' : 'text-[#374151]'
                      }`}
                    >
                      <td className="px-3 py-2 text-right">{c.id}</td>
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2">{c.branch_code}</td>
                      <td className="px-3 py-2 text-right">{c.total_orders || 0}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(c.total_amount)}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(c.total_rcvd)}</td>
                      <td className="px-3 py-2 text-right font-bold">{formatMoney(c.total_bal)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectCustomerAndView(c.id)}
                          className="px-2.5 py-1 text-[11.5px] bg-[#F26522] text-white rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
                        >
                          Open Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F9FAFB] font-semibold text-[#1F2937] border-t border-[#E5E7EB]">
                  <td colSpan={5} className="px-3 py-2 text-right">Totals</td>
                  <td className="px-3 py-2 text-right">{formatMoney(totAmt)}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(totRcvd)}</td>
                  <td className="px-3 py-2 text-right text-[#DC2626]">{formatMoney(totBal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 bg-[#F8F9FA] min-h-full">
      {/* Batch Cards Strip when in Batch - JobCards mode */}
      {mode === 'batch-jobcards' && (
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-2 border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="font-bold text-[13px] text-[#1F2937]">Production Batches</span>
            {selectedBatch && (
              <button
                type="button"
                onClick={() => setSelectedBatch('')}
                className="text-[12px] text-[#F26522] underline cursor-pointer"
              >
                Show All Batches
              </button>
            )}
          </div>
          <div className="overflow-x-auto max-h-[210px]">
            <table className="w-full border-collapse text-[12.5px] tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                  <th className="px-3 py-1.5 text-left font-medium">Batch #</th>
                  <th className="px-3 py-1.5 text-right font-medium">Job Count</th>
                  <th className="px-3 py-1.5 text-right font-medium">Total Qty</th>
                  <th className="px-3 py-1.5 text-right font-medium">Batch Value</th>
                  <th className="px-3 py-1.5 text-right font-medium">Pending Despatch</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const active = selectedBatch === b.batch_no;
                  return (
                    <tr
                      key={b.batch_no}
                      onClick={() => setSelectedBatch(active ? '' : b.batch_no)}
                      className={`border-b border-[#E5E7EB] cursor-pointer ${
                        active ? 'bg-[#F26522] text-white' : 'hover:bg-[#FFF8F4]'
                      }`}
                    >
                      <td className="px-3 py-1.5 font-medium">{b.batch_no}</td>
                      <td className="px-3 py-1.5 text-right">{b.count}</td>
                      <td className="px-3 py-1.5 text-right">{b.qty}</td>
                      <td className="px-3 py-1.5 text-right">{formatMoney(b.amount)}</td>
                      <td className="px-3 py-1.5 text-right">{b.pending_despatch}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Orders Grid */}
      <div className="bg-white border border-[#E5E7EB]">
        <div className="px-3 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-[#1F2937]">{MODE_TITLES[mode]}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:border-[#F26522] hover:text-[#F26522] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] bg-[#F26522] text-white font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Job Order
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-2 border-b border-[#E5E7EB] flex flex-wrap items-center gap-2 bg-[#FCFCFD]">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Enter text to search (Order No, Customer, Batch, Product)..."
            className="flex-1 min-w-[220px] h-[30px] px-3 text-[12.5px] bg-white border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
          />

          <select
            value={productCode}
            onChange={(e) => {
              setProductCode(e.target.value);
              setPage(1);
            }}
            className="h-[30px] px-2 text-[12px] bg-white border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            title="From Date"
            className="h-[30px] px-2 text-[12px] bg-white border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            title="To Date"
            className="h-[30px] px-2 text-[12px] bg-white border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
          />
          {(fromDate || toDate || productCode || search) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setProductCode('');
                setSearch('');
                setPage(1);
              }}
              className="h-[30px] px-2.5 text-[12px] border border-[#D1D5DB] bg-white text-[#6B7280] hover:text-[#1F2937] rounded-[2px] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <GridPagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setPage(1);
          }}
          rightSlot={
            selectedOrder ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenEditOrder(selectedOrder)}
                  className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#374151] text-[12px] rounded-[2px] hover:border-[#F26522] cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReceiptModal(selectedOrder)}
                  className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#374151] text-[12px] rounded-[2px] hover:border-[#F26522] cursor-pointer"
                >
                  <CreditCard className="w-3 h-3" />
                  Receipt
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPrintJobCard(selectedOrder)}
                  className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#374151] text-[12px] rounded-[2px] hover:border-[#F26522] cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  JobCard
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDeleteOrder(selectedOrder)}
                  className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#DC2626] text-[12px] rounded-[2px] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : null
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="bg-white border-b border-[#E5E7EB] text-[#6B7280] font-medium text-[12px]">
                <th className="px-3 py-2 text-right">ID</th>
                <th className="px-3 py-2 text-left">Ord.No.</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Batch</th>
                <th className="px-2 py-2 text-center">Br.Transfer</th>
                <th className="px-2 py-2 text-center">Br.Rcvd</th>
                <th className="px-2 py-2 text-center">Br.Despatch</th>
                <th className="px-3 py-2 text-right">Rcvd. Amt</th>
                <th className="px-3 py-2 text-right">Bal. Amt</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-[#6B7280]">
                    No orders match the current criteria.
                  </td>
                </tr>
              ) : (
                pagedOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  const isAlert = !isSelected && (ord.bal_amt > 0 || ord.br_despatch === 0);
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrderId(ord.id)}
                      onDoubleClick={() => onSelectCustomerAndView(ord.customer_id, ord.id)}
                      className={`border-b border-[#E5E7EB] cursor-pointer ${
                        isSelected
                          ? 'bg-[#F26522] text-white'
                          : isAlert
                          ? 'bg-white text-[#DC2626] hover:bg-[#FEF2F2]'
                          : 'bg-white text-[#374151] hover:bg-[#FFF8F4]'
                      }`}
                    >
                      <td className="px-3 py-2 text-right">{ord.id}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{ord.ord_no}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{ord.customer_name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatShortDate(ord.order_date)}</td>
                      <td className="px-3 py-2 text-right">{ord.qty}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(ord.rate)}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(ord.amount)}</td>
                      <td className="px-3 py-2">{ord.product_code}</td>
                      <td className="px-3 py-2">{ord.batch_no}</td>
                      <td className="px-2 py-2 text-center">
                        <OrangeCheckbox
                          checked={ord.br_transfer === 1}
                          selectedRow={isSelected}
                          onChange={() => onToggleOrderFlag(ord, 'br_transfer')}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <OrangeCheckbox
                          checked={ord.br_rcvd === 1}
                          selectedRow={isSelected}
                          onChange={() => onToggleOrderFlag(ord, 'br_rcvd')}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <OrangeCheckbox
                          checked={ord.br_despatch === 1}
                          selectedRow={isSelected}
                          onChange={() => onToggleOrderFlag(ord, 'br_despatch')}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">{formatMoneyBlankZero(ord.rcvd_amt)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatMoneyBlankZero(ord.bal_amt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#F9FAFB] text-[#6B7280] font-medium border-b border-[#E5E7EB]">
                <td colSpan={4} className="px-3 py-2 text-right">Totals</td>
                <td className="px-3 py-2 text-right">{orderTotals.qty}</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right">{formatMoney(orderTotals.amount)}</td>
                <td colSpan={5} />
                <td className="px-3 py-2 text-right">{formatMoney(orderTotals.rcvd)}</td>
                <td className="px-3 py-2 text-right">{formatMoney(orderTotals.bal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <GridPagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};
