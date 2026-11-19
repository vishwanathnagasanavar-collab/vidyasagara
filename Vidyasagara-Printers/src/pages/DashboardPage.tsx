import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import type { DashboardSummary, PrintOrder } from '../types/erp';
import { formatMoney, formatShortDate } from '../utils/format';
import { OrangeCheckbox } from '../components/OrangeCheckbox';
import type { NavSection } from '../components/TopBar';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  recentOrders: PrintOrder[];
  onNavigate: (nav: NavSection) => void;
  onOpenNewOrder: () => void;
  onSelectCustomerAndView: (customerId: number, orderId?: number) => void;
  onToggleOrderFlag: (order: PrintOrder, field: 'br_transfer' | 'br_rcvd' | 'br_despatch') => Promise<void>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  recentOrders,
  onNavigate,
  onOpenNewOrder,
  onSelectCustomerAndView,
  onToggleOrderFlag,
}) => {
  const s = summary || {
    totalOrdersCount: 0,
    totalRevenue: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    pendingDespatchCount: 0,
    pendingTransferCount: 0,
    activeCustomersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    productBreakdown: [],
    branchBreakdown: [],
  };

  return (
    <div className="p-3 space-y-3 bg-[#F8F9FA] min-h-full">
      {/* Header Bar */}
      <div className="bg-white border border-[#E5E7EB] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-bold text-[#1F2937]">
            Management Information — Dash Board
          </h1>
          <p className="text-[12px] text-[#6B7280]">
            Vidyasagara Printers production volume, despatch queue & party receivables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('orders-customerwise')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[#D1D5DB] bg-white text-[#374151] rounded-[2px] hover:border-[#F26522] hover:text-[#F26522] cursor-pointer"
          >
            Customer Orders Grid
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[#F26522] text-white font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Job Order
          </button>
        </div>
      </div>

      {/* 4-Column Clean KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E7EB] p-3.5">
          <div className="text-[11.5px] text-[#6B7280] font-medium">Total Billed Revenue</div>
          <div className="text-[22px] font-bold text-[#1F2937] tabular-nums mt-1">
            ₹{formatMoney(s.totalRevenue)}
          </div>
          <div className="text-[11.5px] text-[#6B7280] tabular-nums mt-1">
            {s.totalOrdersCount} total orders · {s.activeCustomersCount} parties
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-3.5">
          <div className="text-[11.5px] text-[#6B7280] font-medium">Total Collected</div>
          <div className="text-[22px] font-bold text-[#16A34A] tabular-nums mt-1">
            ₹{formatMoney(s.totalReceived)}
          </div>
          <div className="text-[11.5px] text-[#6B7280] tabular-nums mt-1">
            Latest day: {s.todayOrdersCount} orders (₹{formatMoney(s.todayRevenue)})
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-3.5">
          <div className="text-[11.5px] text-[#6B7280] font-medium">Party Outstanding</div>
          <div className="text-[22px] font-bold text-[#DC2626] tabular-nums mt-1">
            ₹{formatMoney(s.totalOutstanding)}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('party-outstanding')}
            className="text-[11.5px] text-[#F26522] hover:underline mt-1 cursor-pointer"
          >
            View Party Outstanding →
          </button>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-3.5">
          <div className="text-[11.5px] text-[#6B7280] font-medium">Pending Despatch</div>
          <div className="text-[22px] font-bold text-[#F26522] tabular-nums mt-1">
            {s.pendingDespatchCount}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pending-jobs')}
            className="text-[11.5px] text-[#F26522] hover:underline mt-1 cursor-pointer"
          >
            Open Pending Jobs Queue →
          </button>
        </div>
      </div>

      {/* Product & Branch Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-[12.5px] text-[#1F2937] flex items-center justify-between">
            <span>Product-Wise Volume</span>
            <button
              type="button"
              onClick={() => onNavigate('orders-productwise')}
              className="text-[11.5px] text-[#F26522] hover:underline font-normal cursor-pointer"
            >
              Details
            </button>
          </div>
          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Total Qty</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.productBreakdown.map((p) => (
                <tr key={p.product_code} className="border-b border-[#E5E7EB] hover:bg-[#FFF8F4]">
                  <td className="px-3 py-2 font-medium text-[#1F2937]">{p.product_code}</td>
                  <td className="px-3 py-2 text-right">{p.order_count}</td>
                  <td className="px-3 py-2 text-right">{p.total_qty}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(p.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-[12.5px] text-[#1F2937] flex items-center justify-between">
            <span>Branch-Wise Summary</span>
            <button
              type="button"
              onClick={() => onNavigate('branches')}
              className="text-[11.5px] text-[#F26522] hover:underline font-normal cursor-pointer"
            >
              Manage Branches
            </button>
          </div>
          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                <th className="px-3 py-2 text-left font-medium">Branch</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Billed Amt</th>
                <th className="px-3 py-2 text-right font-medium">Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {s.branchBreakdown.map((b) => (
                <tr key={b.branch_code} className="border-b border-[#E5E7EB] hover:bg-[#FFF8F4]">
                  <td className="px-3 py-2 font-medium text-[#1F2937]">{b.branch_code}</td>
                  <td className="px-3 py-2 text-right">{b.order_count}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(b.total_amount)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${b.total_bal > 0 ? 'text-[#DC2626]' : ''}`}>
                    {formatMoney(b.total_bal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Job Orders */}
      <div className="bg-white border border-[#E5E7EB]">
        <div className="px-3 py-2 border-b border-[#E5E7EB] font-semibold text-[12.5px] text-[#1F2937] flex items-center justify-between">
          <span>Recent Job Orders</span>
          <button
            type="button"
            onClick={() => onNavigate('orders-history')}
            className="text-[11.5px] text-[#F26522] hover:underline font-normal cursor-pointer"
          >
            View All Orders
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                <th className="px-3 py-2 text-right font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Ord.No.</th>
                <th className="px-3 py-2 text-left font-medium">Customer</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-2 py-2 text-center font-medium">Br.Transfer</th>
                <th className="px-2 py-2 text-center font-medium">Br.Rcvd</th>
                <th className="px-2 py-2 text-center font-medium">Br.Despatch</th>
                <th className="px-3 py-2 text-right font-medium">Bal. Amt</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 10).map((ord) => {
                const alert = ord.bal_amt > 0 || ord.br_despatch === 0;
                return (
                  <tr
                    key={ord.id}
                    onClick={() => onSelectCustomerAndView(ord.customer_id, ord.id)}
                    className={`border-b border-[#E5E7EB] cursor-pointer hover:bg-[#FFF8F4] ${
                      alert ? 'text-[#DC2626]' : 'text-[#374151]'
                    }`}
                  >
                    <td className="px-3 py-2 text-right">{ord.id}</td>
                    <td className="px-3 py-2 font-medium">{ord.ord_no}</td>
                    <td className="px-3 py-2">{ord.customer_name}</td>
                    <td className="px-3 py-2">{formatShortDate(ord.order_date)}</td>
                    <td className="px-3 py-2">{ord.product_code}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(ord.amount)}</td>
                    <td className="px-2 py-2 text-center">
                      <OrangeCheckbox
                        checked={ord.br_transfer === 1}
                        onChange={() => onToggleOrderFlag(ord, 'br_transfer')}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <OrangeCheckbox
                        checked={ord.br_rcvd === 1}
                        onChange={() => onToggleOrderFlag(ord, 'br_rcvd')}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <OrangeCheckbox
                        checked={ord.br_despatch === 1}
                        onChange={() => onToggleOrderFlag(ord, 'br_despatch')}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatMoney(ord.bal_amt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
