import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Plus, Edit3, Trash2, Printer, CreditCard, Search } from 'lucide-react';
import type { Customer, PrintOrder, Product, Receipt } from '../types/erp';
import { formatMoney, formatMoneyBlankZero, formatShortDate } from '../utils/format';
import { GridPagination } from '../components/GridPagination';
import { OrangeCheckbox } from '../components/OrangeCheckbox';

interface OrdersCustomerwisePageProps {
  customers: Customer[];
  orders: PrintOrder[];
  receipts: Receipt[];
  products: Product[];
  selectedCustomerId: number | null;
  selectedOrderId: number | null;
  onSelectCustomer: (id: number) => void;
  onSelectOrder: (id: number) => void;
  onToggleOrderFlag: (order: PrintOrder, field: 'br_transfer' | 'br_rcvd' | 'br_despatch') => Promise<void>;
  onOpenNewCustomer: () => void;
  onOpenNewOrder: () => void;
  onOpenEditOrder: (order: PrintOrder) => void;
  onOpenDeleteOrder: (order: PrintOrder) => void;
  onOpenReceiptModal: (order: PrintOrder) => void;
  onOpenPrintJobCard: (order: PrintOrder) => void;
  onDeleteReceipt: (receipt: Receipt) => void;
}

function HighlightedText({
  text,
  query,
  selected,
}: {
  text: string;
  query: string;
  selected: boolean;
}) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <span
        className={
          selected
            ? 'bg-white/25 text-white px-0.5 rounded-[2px]'
            : 'bg-[#F26522] text-white px-0.5 rounded-[2px]'
        }
      >
        {match}
      </span>
      {after}
    </>
  );
}

export const OrdersCustomerwisePage: React.FC<OrdersCustomerwisePageProps> = ({
  customers,
  orders,
  receipts,
  products,
  selectedCustomerId,
  selectedOrderId,
  onSelectCustomer,
  onSelectOrder,
  onToggleOrderFlag,
  onOpenNewCustomer,
  onOpenNewOrder,
  onOpenEditOrder,
  onOpenDeleteOrder,
  onOpenReceiptModal,
  onOpenPrintJobCard,
  onDeleteReceipt,
}) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [custPage, setCustPage] = useState(1);
  const [custPageSize, setCustPageSize] = useState(10);

  const [orderSearch, setOrderSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        c.branch_code.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const pagedCustomers = useMemo(() => {
    const start = (custPage - 1) * custPageSize;
    return filteredCustomers.slice(start, start + custPageSize);
  }, [filteredCustomers, custPage, custPageSize]);

  const custTotals = useMemo(() => {
    return filteredCustomers.reduce(
      (acc, c) => {
        acc.amount += Number(c.total_amount || 0);
        acc.bal += Number(c.total_bal || 0);
        return acc;
      },
      { amount: 0, bal: 0 }
    );
  }, [filteredCustomers]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null,
    [customers, filteredCustomers, selectedCustomerId]
  );

  // Orders belonging to selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    let list = orders.filter((o) => o.customer_id === selectedCustomer.id);
    if (productFilter) {
      list = list.filter((o) => o.product_code === productFilter);
    }
    const q = orderSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.ord_no.toLowerCase().includes(q) ||
          String(o.id).includes(q) ||
          o.product_code.toLowerCase().includes(q) ||
          o.batch_no.toLowerCase().includes(q) ||
          (o.job_notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, selectedCustomer, productFilter, orderSearch]);

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return customerOrders.slice(start, start + orderPageSize);
  }, [customerOrders, orderPage, orderPageSize]);

  const orderTotals = useMemo(() => {
    return customerOrders.reduce(
      (acc, o) => {
        acc.qty += Number(o.qty || 0);
        acc.amount += Number(o.amount || 0);
        acc.rcvd += Number(o.rcvd_amt || 0);
        acc.bal += Number(o.bal_amt || 0);
        return acc;
      },
      { qty: 0, amount: 0, rcvd: 0, bal: 0 }
    );
  }, [customerOrders]);

  const selectedOrder = useMemo(
    () => customerOrders.find((o) => o.id === selectedOrderId) || pagedOrders[0] || null,
    [customerOrders, pagedOrders, selectedOrderId]
  );

  const selectedOrderReceipts = useMemo(() => {
    if (!selectedOrder) return [];
    return receipts.filter((r) => r.order_id === selectedOrder.id);
  }, [receipts, selectedOrder]);

  // Reset page when search changes
  useEffect(() => {
    setOrderPage(1);
  }, [selectedCustomerId, orderSearch, productFilter]);

  useEffect(() => {
    setCustPage(1);
  }, [customerSearch]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#F8F9FA] min-h-full">
      {/* PANEL 1: TOP CUSTOMER SUMMARY GRID */}
      <section className="bg-white border border-[#E5E7EB] rounded-[2px]">
        {/* Compact Customer Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-[#E5E7EB] bg-[#FCFCFD]">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Filter customer (e.g. VIDHYA)..."
              className="w-full h-[27px] pl-8 pr-2 text-[12px] bg-white border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewCustomer}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:border-[#F26522] hover:text-[#F26522] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Customer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <tbody>
              {pagedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#6B7280]">
                    No customers match "{customerSearch}".
                  </td>
                </tr>
              ) : (
                pagedCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => onSelectCustomer(cust.id)}
                      className={`border-b border-[#E5E7EB] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#F26522] text-white'
                          : 'bg-white text-[#374151] hover:bg-[#FFF8F4]'
                      }`}
                    >
                      <td className="px-4 py-2 w-[72px] text-right tabular-nums font-medium">
                        {cust.id}
                      </td>
                      <td className="px-4 py-2 font-medium min-w-[260px]">
                        <HighlightedText
                          text={cust.name}
                          query={customerSearch || 'VIDHYA'}
                          selected={isSelected}
                        />
                      </td>
                      <td className="px-4 py-2 tabular-nums whitespace-nowrap">
                        {cust.phone}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {cust.branch_code}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums w-[120px]">
                        {formatMoney(cust.total_amount)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums w-[90px]">
                        {formatMoney(cust.total_bal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#F9FAFB] text-[#6B7280] font-medium tabular-nums border-b border-[#E5E7EB]">
                <td colSpan={4} className="px-4 py-1.5 text-right text-[11.5px]">
                  Totals
                </td>
                <td className="px-4 py-1.5 text-right">{formatMoney(custTotals.amount)}</td>
                <td className="px-4 py-1.5 text-right">{formatMoney(custTotals.bal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <GridPagination
          page={custPage}
          pageSize={custPageSize}
          totalItems={filteredCustomers.length}
          onPageChange={setCustPage}
          onPageSizeChange={(sz) => {
            setCustPageSize(sz);
            setCustPage(1);
          }}
        />
      </section>

      {/* PANEL 2: MIDDLE CUSTOMER ORDERS GRID (Exact Reference Layout) */}
      <section className="bg-white border border-[#E5E7EB] rounded-[2px]">
        {/* Top Pagination Bar + Order Actions */}
        <GridPagination
          page={orderPage}
          pageSize={orderPageSize}
          totalItems={customerOrders.length}
          onPageChange={setOrderPage}
          onPageSizeChange={(sz) => {
            setOrderPageSize(sz);
            setOrderPage(1);
          }}
          rightSlot={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenNewOrder}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F26522] text-white text-[12px] font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Order
              </button>
              {selectedOrder && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenEditOrder(selectedOrder)}
                    title="Edit selected order"
                    className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#374151] text-[12px] rounded-[2px] hover:border-[#F26522] hover:text-[#F26522] cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenReceiptModal(selectedOrder)}
                    title="Record payment receipt"
                    className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#374151] text-[12px] rounded-[2px] hover:border-[#F26522] hover:text-[#F26522] cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPrintJobCard(selectedOrder)}
                    title="Print Job Card"
                    className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#374151] text-[12px] rounded-[2px] hover:border-[#F26522] hover:text-[#F26522] cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    JobCard
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDeleteOrder(selectedOrder)}
                    title="Delete selected order"
                    className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] bg-white text-[#DC2626] text-[12px] rounded-[2px] hover:bg-[#FEF2F2] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          }
        />

        {/* Full-Width Search Input: "Enter text to search..." */}
        <div className="p-2 border-b border-[#E5E7EB] bg-white">
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Enter text to search..."
            className="w-full h-[32px] px-3 text-[12.5px] text-[#374151] placeholder-[#9CA3AF] bg-white border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
          />
        </div>

        {/* Centered Customer Orders Header Title */}
        <div className="py-2 px-4 text-center text-[13.5px] font-medium text-[#6B7280] border-b border-[#E5E7EB] bg-white">
          {selectedCustomer
            ? `${selectedCustomer.name} - Orders - ${selectedCustomer.id} - ${selectedCustomer.order_prefix || 'JPB'}`
            : 'Customer Orders'}
          {productFilter && (
            <button
              type="button"
              onClick={() => setProductFilter('')}
              className="ml-2 text-[11px] text-[#F26522] underline cursor-pointer"
            >
              (Filter: {productFilter} ×)
            </button>
          )}
        </div>

        {/* 13-Column Orders Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-white border-b border-[#E5E7EB] text-[#6B7280] font-medium text-[12px] select-none">
                <th className="px-3 py-2.5 text-right w-[70px]">ID</th>
                <th className="px-3 py-2.5 text-left w-[96px]">Ord.No.</th>
                <th className="px-3 py-2.5 text-left w-[86px]">Date</th>
                <th className="px-3 py-2.5 text-right w-[55px]">Qty</th>
                <th className="px-3 py-2.5 text-right w-[68px]">Rate</th>
                <th className="px-3 py-2.5 text-right w-[82px]">Amount</th>
                <th className="px-3 py-2.5 text-left w-[110px] relative">
                  <div className="flex items-center justify-between gap-1" ref={filterRef}>
                    <span>Product</span>
                    <button
                      type="button"
                      onClick={() => setFilterDropdownOpen((v) => !v)}
                      title="Filter by Product"
                      className={`p-0.5 rounded-[2px] cursor-pointer ${
                        productFilter ? 'text-[#F26522]' : 'text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5 fill-current" />
                    </button>
                    {filterDropdownOpen && (
                      <div className="absolute left-0 top-full mt-0.5 w-40 bg-white border border-[#D1D5DB] shadow-md rounded-[2px] z-30 py-1 text-left font-normal">
                        <button
                          type="button"
                          onClick={() => {
                            setProductFilter('');
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-[12px] hover:bg-[#FFF4EE] cursor-pointer text-left ${
                            !productFilter ? 'font-bold text-[#F26522]' : 'text-[#374151]'
                          }`}
                        >
                          All Products
                        </button>
                        {products.map((p) => (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => {
                              setProductFilter(p.code);
                              setFilterDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 text-[12px] hover:bg-[#FFF4EE] cursor-pointer text-left ${
                              productFilter === p.code ? 'font-bold text-[#F26522]' : 'text-[#374151]'
                            }`}
                          >
                            {p.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-3 py-2.5 text-left w-[82px]">Batch</th>
                <th className="px-2 py-2.5 text-center w-[78px]">Br.Transfer</th>
                <th className="px-2 py-2.5 text-center w-[68px]">Br.Rcvd</th>
                <th className="px-2 py-2.5 text-center w-[84px]">Br.Despatch</th>
                <th className="px-3 py-2.5 text-right w-[86px]">Rcvd. Amt</th>
                <th className="px-3 py-2.5 text-right w-[78px]">Bal. Amt</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-[#6B7280]">
                    No orders found for this selection.{' '}
                    <button
                      type="button"
                      onClick={onOpenNewOrder}
                      className="text-[#F26522] font-medium underline cursor-pointer"
                    >
                      Create New Job Order
                    </button>
                  </td>
                </tr>
              ) : (
                pagedOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  const isAlertRow = !isSelected && (ord.bal_amt > 0 || ord.br_despatch === 0);
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => onSelectOrder(ord.id)}
                      onDoubleClick={() => onOpenEditOrder(ord)}
                      className={`border-b border-[#E5E7EB] cursor-pointer transition-colors tabular-nums ${
                        isSelected
                          ? 'bg-[#F26522] text-white'
                          : isAlertRow
                          ? 'bg-white text-[#DC2626] hover:bg-[#FEF2F2]'
                          : 'bg-white text-[#374151] hover:bg-[#FFF8F4]'
                      }`}
                    >
                      <td className="px-3 py-[9px] text-right">{ord.id}</td>
                      <td className="px-3 py-[9px] font-medium whitespace-nowrap">{ord.ord_no}</td>
                      <td className="px-3 py-[9px] whitespace-nowrap">{formatShortDate(ord.order_date)}</td>
                      <td className="px-3 py-[9px] text-right">{ord.qty}</td>
                      <td className="px-3 py-[9px] text-right">{formatMoney(ord.rate)}</td>
                      <td className="px-3 py-[9px] text-right">{formatMoney(ord.amount)}</td>
                      <td className="px-3 py-[9px] whitespace-nowrap">{ord.product_code}</td>
                      <td className="px-3 py-[9px] whitespace-nowrap">{ord.batch_no}</td>
                      <td className="px-2 py-[9px] text-center">
                        <OrangeCheckbox
                          checked={ord.br_transfer === 1}
                          selectedRow={isSelected}
                          onChange={() => onToggleOrderFlag(ord, 'br_transfer')}
                          title="Toggle Branch Transfer"
                        />
                      </td>
                      <td className="px-2 py-[9px] text-center">
                        <OrangeCheckbox
                          checked={ord.br_rcvd === 1}
                          selectedRow={isSelected}
                          onChange={() => onToggleOrderFlag(ord, 'br_rcvd')}
                          title="Toggle Branch Received"
                        />
                      </td>
                      <td className="px-2 py-[9px] text-center">
                        <OrangeCheckbox
                          checked={ord.br_despatch === 1}
                          selectedRow={isSelected}
                          onChange={() => onToggleOrderFlag(ord, 'br_despatch')}
                          title="Toggle Branch Despatch"
                        />
                      </td>
                      <td className="px-3 py-[9px] text-right">
                        {formatMoneyBlankZero(ord.rcvd_amt)}
                      </td>
                      <td className="px-3 py-[9px] text-right font-medium">
                        {formatMoneyBlankZero(ord.bal_amt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#F9FAFB] text-[#6B7280] font-medium tabular-nums border-b border-[#E5E7EB]">
                <td colSpan={3} className="px-3 py-2" />
                <td className="px-3 py-2 text-right">{orderTotals.qty}</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right">{formatMoney(orderTotals.amount)}</td>
                <td colSpan={5} className="px-3 py-2" />
                <td className="px-3 py-2 text-right">{formatMoney(orderTotals.rcvd)}</td>
                <td className="px-3 py-2 text-right">{formatMoney(orderTotals.bal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <GridPagination
          page={orderPage}
          pageSize={orderPageSize}
          totalItems={customerOrders.length}
          onPageChange={setOrderPage}
          onPageSizeChange={(sz) => {
            setOrderPageSize(sz);
            setOrderPage(1);
          }}
        />
      </section>

      {/* PANEL 3: BOTTOM SELECTED ORDER NOTES & PAYMENT RECEIPTS GRID */}
      <section className="bg-white border border-[#E5E7EB] rounded-[2px]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-white border-b border-[#E5E7EB] text-[#6B7280] font-medium text-[12px]">
                <th className="px-3 py-2.5 text-left min-w-[260px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-normal text-[#374151] bg-white border border-[#D1D5DB] px-2.5 py-1 rounded-[2px] max-w-[320px]">
                      {selectedOrder?.job_notes || 'Select an order to view job specification'}
                    </span>
                    {selectedOrder && (
                      <button
                        type="button"
                        onClick={() => onOpenReceiptModal(selectedOrder)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F26522] text-white text-[11.5px] font-medium rounded-[2px] hover:bg-[#DC5516] shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Record Receipt
                      </button>
                    )}
                  </div>
                </th>
                <th className="px-3 py-2.5 text-left">Ref.ID</th>
                <th className="px-3 py-2.5 text-left">Date</th>
                <th className="px-3 py-2.5 text-left">Notes</th>
                <th className="px-3 py-2.5 text-right">Total Rcpt.</th>
                <th className="px-3 py-2.5 text-right">Adjusted Amt.</th>
                <th className="px-3 py-2.5 text-left">Pay Mode</th>
                <th className="px-3 py-2.5 text-left">User</th>
                <th className="px-2 py-2.5 text-center w-[48px]" />
              </tr>
            </thead>
            <tbody>
              {!selectedOrder || selectedOrderReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-4 text-center text-[#6B7280] text-[12px]">
                    {selectedOrder
                      ? `No payment receipts recorded yet for ${selectedOrder.ord_no}.`
                      : 'No order selected.'}
                  </td>
                </tr>
              ) : (
                selectedOrderReceipts.map((r) => (
                  <tr key={r.id} className="border-b border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] tabular-nums">
                    <td className="px-3 py-2 text-[#6B7280] truncate max-w-[300px]">
                      {selectedOrder.ord_no} · {selectedOrder.product_code}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.ref_id}</td>
                    <td className="px-3 py-2">{formatShortDate(r.receipt_date)}</td>
                    <td className="px-3 py-2">{r.notes}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(r.total_rcpt)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(r.adjusted_amt)}</td>
                    <td className="px-3 py-2">{r.pay_mode}</td>
                    <td className="px-3 py-2">{r.user_name}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteReceipt(r)}
                        title="Remove Receipt"
                        className="text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
