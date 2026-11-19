import React, { useState } from 'react';
import type { NavSection } from './TopBar';

interface SidebarProps {
  collapsed: boolean;
  activeNav: NavSection;
  onNavigate: (nav: NavSection) => void;
  onOpenNewOrder: () => void;
  onOpenNewPayment: () => void;
}

interface TreeGroup {
  id: string;
  label: string;
  items: Array<{
    id: string;
    label: string;
    nav?: NavSection;
    action?: 'new-order' | 'new-payment';
  }>;
}

const TREE_GROUPS: TreeGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { id: 'overview', label: 'Overview', nav: 'dashboard' },
      { id: 'backup', label: 'Database Backup', nav: 'backup' },
    ],
  },
  {
    id: 'master',
    label: 'Master',
    items: [
      { id: 'customers', label: 'Customers / Parties', nav: 'customers' },
      { id: 'products', label: 'Products & Rates', nav: 'products' },
      { id: 'branches', label: 'Branches', nav: 'branches' },
      { id: 'users', label: 'Users', nav: 'users' },
    ],
  },
  {
    id: 'transaction',
    label: 'Transaction',
    items: [
      { id: 'new-order', label: 'New Job Order', action: 'new-order' },
      { id: 'new-payment', label: 'Payment Receipt', action: 'new-payment' },
      { id: 'pending-jobs', label: 'Pending Despatch', nav: 'pending-jobs' },
    ],
  },
  {
    id: 'mis',
    label: 'Management Information',
    items: [
      { id: 'dashboard', label: 'Dash Board', nav: 'dashboard' },
      { id: 'orders-customerwise', label: 'Orders - Customerwise', nav: 'orders-customerwise' },
      { id: 'orders-datewise', label: 'Orders - Datewise', nav: 'orders-datewise' },
      { id: 'orders-productwise', label: 'Orders - Productwise', nav: 'orders-productwise' },
      { id: 'batch-jobcards', label: 'Batch - JobCards', nav: 'batch-jobcards' },
      { id: 'party-outstanding', label: 'Party Outstanding', nav: 'party-outstanding' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  activeNav,
  onNavigate,
  onOpenNewOrder,
  onOpenNewPayment,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    home: false,
    master: false,
    transaction: false,
    mis: true,
  });

  if (collapsed) return null;

  const toggleGroup = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="no-print w-[216px] bg-white border-r border-[#E5E7EB] shrink-0 flex flex-col select-none overflow-y-auto">
      <div className="px-4 pt-4 pb-2.5 text-[14px] font-bold text-[#1F2937]">
        Contents
      </div>

      <nav className="flex-1 pb-6">
        {TREE_GROUPS.map((group) => {
          const isOpen = Boolean(expanded[group.id]);
          return (
            <div key={group.id} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-[#374151] hover:bg-[#F9FAFB] cursor-pointer"
              >
                <span className="text-[10px] text-[#6B7280] w-3 inline-flex justify-center">
                  {isOpen ? '▼' : '▶'}
                </span>
                <span className="truncate">{group.label}</span>
              </button>

              {isOpen && (
                <div className="flex flex-col">
                  {group.items.map((item) => {
                    const isActive = item.nav === activeNav;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.action === 'new-order') onOpenNewOrder();
                          else if (item.action === 'new-payment') onOpenNewPayment();
                          else if (item.nav) onNavigate(item.nav);
                        }}
                        className={`w-full text-left pl-8 pr-3 py-[8px] text-[12.5px] transition-colors cursor-pointer truncate ${
                          isActive
                            ? 'bg-[#F26522] text-white font-medium'
                            : 'text-[#4B5563] hover:bg-[#FFF4EE] hover:text-[#F26522]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
