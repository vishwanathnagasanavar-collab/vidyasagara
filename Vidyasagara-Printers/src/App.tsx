import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import type {
  Branch,
  Customer,
  DashboardSummary,
  DbInfo,
  PrintOrder,
  Product,
  Receipt,
  StaffUser,
} from './types/erp';
import { erpClient } from './api/client';
import { TopBar, type NavSection } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { OrdersCustomerwisePage } from './pages/OrdersCustomerwisePage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersReportPage } from './pages/OrdersReportPage';
import { MasterDataPage } from './pages/MasterDataPage';
import {
  ConfirmDialog,
  CustomerModal,
  JobCardPrintModal,
  OrderModal,
  ReceiptModal,
} from './components/Modals';

interface ToastState {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('orders-customerwise');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(1729);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(166278);

  // Modals
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PrintOrder | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<PrintOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<PrintOrder | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3600);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoadError('');
      const [custs, ords, rcpts, prods, brs, usrs, dash, info] = await Promise.all([
        erpClient.listCustomers(),
        erpClient.listOrders(),
        erpClient.listReceipts(),
        erpClient.listProducts(),
        erpClient.listBranches(),
        erpClient.listUsers(),
        erpClient.getDashboard(),
        erpClient.getDbInfo(),
      ]);
      setCustomers(custs);
      setOrders(ords);
      setReceipts(rcpts);
      setProducts(prods);
      setBranches(brs);
      setUsers(usrs);
      setDashboard(dash);
      setDbInfo(info);

      setSelectedCustomerId((prev) => {
        if (prev && custs.some((c) => c.id === prev)) return prev;
        return custs[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setLoadError((err as Error).message || 'Failed to load database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSelectCustomer = (custId: number) => {
    setSelectedCustomerId(custId);
    const firstOrd = orders.find((o) => o.customer_id === custId);
    setSelectedOrderId(firstOrd?.id ?? null);
  };

  const handleToggleOrderFlag = async (
    order: PrintOrder,
    field: 'br_transfer' | 'br_rcvd' | 'br_despatch'
  ) => {
    const nextVal = order[field] === 1 ? 0 : 1;
    try {
      await erpClient.updateOrder(order.id, { [field]: nextVal });
      await loadAllData();
      notify('success', `Updated ${order.ord_no} (${field.replace('br_', 'Br.')})`);
    } catch (err: unknown) {
      notify('error', (err as Error).message);
    }
  };

  const handleSaveOrder = async (payload: Partial<PrintOrder> & { pay_mode?: string }) => {
    if (editingOrder) {
      await erpClient.updateOrder(editingOrder.id, payload);
      notify('success', `Order ${editingOrder.ord_no} updated.`);
    } else {
      const created = await erpClient.createOrder(payload);
      setSelectedCustomerId(created.customer_id);
      setSelectedOrderId(created.id);
      notify('success', `Order ${created.ord_no} created and saved to SQLite.`);
    }
    await loadAllData();
  };

  const handleSaveCustomer = async (payload: Partial<Customer>) => {
    if (editingCustomer) {
      await erpClient.updateCustomer(editingCustomer.id, payload);
      notify('success', `Customer ${payload.name} updated.`);
    } else {
      const created = await erpClient.createCustomer(payload);
      setSelectedCustomerId(created.id);
      notify('success', `Customer ${created.name} created.`);
    }
    await loadAllData();
  };

  const handleSaveReceipt = async (payload: Partial<Receipt>) => {
    await erpClient.createReceipt(payload);
    notify('success', 'Payment receipt recorded and balance updated.');
    await loadAllData();
  };

  const handleDeleteOrderRequest = (order: PrintOrder) => {
    setConfirmState({
      title: `Delete Order ${order.ord_no}?`,
      message: `This will permanently delete order ${order.ord_no} (₹${order.amount}) and its linked payment receipts.`,
      onConfirm: async () => {
        await erpClient.deleteOrder(order.id);
        setConfirmState(null);
        await loadAllData();
        notify('success', `Order ${order.ord_no} deleted.`);
      },
    });
  };

  const handleDeleteCustomerRequest = (customer: Customer) => {
    setConfirmState({
      title: `Delete Customer ${customer.name}?`,
      message: 'Customers with existing orders cannot be deleted until their orders are removed.',
      onConfirm: async () => {
        try {
          await erpClient.deleteCustomer(customer.id);
          setConfirmState(null);
          await loadAllData();
          notify('success', `Customer ${customer.name} deleted.`);
        } catch (err: unknown) {
          setConfirmState(null);
          notify('error', (err as Error).message);
        }
      },
    });
  };

  const handleDeleteReceiptRequest = (receipt: Receipt) => {
    setConfirmState({
      title: `Remove Receipt ${receipt.ref_id}?`,
      message: `Remove receipt of ₹${receipt.total_rcpt}? The order balance will automatically recalculate.`,
      onConfirm: async () => {
        await erpClient.deleteReceipt(receipt.id);
        setConfirmState(null);
        await loadAllData();
        notify('success', `Receipt ${receipt.ref_id} removed.`);
      },
    });
  };

  const openNewPaymentForCurrent = () => {
    const targetOrder =
      orders.find((o) => o.id === selectedOrderId) ||
      orders.find((o) => o.bal_amt > 0) ||
      orders[0];
    if (targetOrder) {
      setReceiptModalOrder(targetOrder);
    } else {
      notify('error', 'Create an order first before recording a receipt.');
    }
  };

  const selectCustomerAndView = (customerId: number, orderId?: number) => {
    setSelectedCustomerId(customerId);
    if (orderId) {
      setSelectedOrderId(orderId);
    } else {
      const first = orders.find((o) => o.customer_id === customerId);
      setSelectedOrderId(first?.id ?? null);
    }
    setActiveNav('orders-customerwise');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8F9FA]">
      <TopBar
        activeNav={activeNav}
        onNavigate={setActiveNav}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onOpenNewOrder={() => {
          setEditingOrder(null);
          setOrderModalOpen(true);
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeNav={activeNav}
          onNavigate={setActiveNav}
          onOpenNewOrder={() => {
            setEditingOrder(null);
            setOrderModalOpen(true);
          }}
          onOpenNewPayment={openNewPaymentForCurrent}
        />

        <main className="flex-1 min-w-0 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-10 bg-white border border-[#E5E7EB] animate-pulse" />
              <div className="h-64 bg-white border border-[#E5E7EB] animate-pulse" />
            </div>
          ) : loadError ? (
            <div className="p-6">
              <div className="bg-white border border-[#FECACA] p-4 text-[#DC2626] space-y-2">
                <div className="font-bold">Database Error</div>
                <div>{loadError}</div>
                <button
                  type="button"
                  onClick={loadAllData}
                  className="px-3 py-1 bg-[#F26522] text-white text-[12px] rounded-[2px] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : activeNav === 'orders-customerwise' ? (
            <OrdersCustomerwisePage
              customers={customers}
              orders={orders}
              receipts={receipts}
              products={products}
              selectedCustomerId={selectedCustomerId}
              selectedOrderId={selectedOrderId}
              onSelectCustomer={handleSelectCustomer}
              onSelectOrder={setSelectedOrderId}
              onToggleOrderFlag={handleToggleOrderFlag}
              onOpenNewCustomer={() => {
                setEditingCustomer(null);
                setCustomerModalOpen(true);
              }}
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setOrderModalOpen(true);
              }}
              onOpenEditOrder={(ord) => {
                setEditingOrder(ord);
                setOrderModalOpen(true);
              }}
              onOpenDeleteOrder={handleDeleteOrderRequest}
              onOpenReceiptModal={setReceiptModalOrder}
              onOpenPrintJobCard={setPrintOrder}
              onDeleteReceipt={handleDeleteReceiptRequest}
            />
          ) : activeNav === 'dashboard' ? (
            <DashboardPage
              summary={dashboard}
              recentOrders={orders}
              onNavigate={setActiveNav}
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setOrderModalOpen(true);
              }}
              onSelectCustomerAndView={selectCustomerAndView}
              onToggleOrderFlag={handleToggleOrderFlag}
            />
          ) : activeNav === 'orders-datewise' ||
            activeNav === 'orders-productwise' ||
            activeNav === 'batch-jobcards' ||
            activeNav === 'party-outstanding' ||
            activeNav === 'pending-jobs' ||
            activeNav === 'orders-history' ? (
            <OrdersReportPage
              mode={activeNav}
              orders={orders}
              customers={customers}
              products={products}
              onToggleOrderFlag={handleToggleOrderFlag}
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setOrderModalOpen(true);
              }}
              onOpenEditOrder={(ord) => {
                setEditingOrder(ord);
                setOrderModalOpen(true);
              }}
              onOpenDeleteOrder={handleDeleteOrderRequest}
              onOpenReceiptModal={setReceiptModalOrder}
              onOpenPrintJobCard={setPrintOrder}
              onSelectCustomerAndView={selectCustomerAndView}
            />
          ) : (
            <MasterDataPage
              section={activeNav}
              customers={customers}
              products={products}
              branches={branches}
              users={users}
              dbInfo={dbInfo}
              onRefresh={loadAllData}
              onOpenNewCustomer={() => {
                setEditingCustomer(null);
                setCustomerModalOpen(true);
              }}
              onOpenEditCustomer={(c) => {
                setEditingCustomer(c);
                setCustomerModalOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomerRequest}
              onSelectCustomerAndView={selectCustomerAndView}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`no-print fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-[3px] shadow-lg border text-[12.5px] font-medium ${
            toast.type === 'success'
              ? 'bg-white border-[#16A34A] text-[#16A34A]'
              : 'bg-white border-[#DC2626] text-[#DC2626]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-[#1F2937]">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#9CA3AF] hover:text-[#1F2937] ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <OrderModal
        open={orderModalOpen}
        editingOrder={editingOrder}
        defaultCustomerId={selectedCustomerId || undefined}
        customers={customers}
        products={products}
        branches={branches}
        onClose={() => setOrderModalOpen(false)}
        onSave={handleSaveOrder}
      />

      <CustomerModal
        open={customerModalOpen}
        editingCustomer={editingCustomer}
        branches={branches}
        onClose={() => setCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
      />

      <ReceiptModal
        open={Boolean(receiptModalOrder)}
        order={receiptModalOrder}
        users={users}
        onClose={() => setReceiptModalOrder(null)}
        onSave={handleSaveReceipt}
      />

      <JobCardPrintModal
        open={Boolean(printOrder)}
        order={printOrder}
        receipts={printOrder ? receipts.filter((r) => r.order_id === printOrder.id) : []}
        onClose={() => setPrintOrder(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (confirmState) await confirmState.onConfirm();
        }}
      />
    </div>
  );
}
