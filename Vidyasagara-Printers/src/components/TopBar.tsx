import React, { useState, useRef, useEffect } from 'react';
import { Menu, Database, Plus, Printer } from 'lucide-react';
import appIconImg from '../assets/images/vidyasagara_app_icon.jpg';
import userAvatarImg from '../assets/images/user_profile_avatar.jpg';

export type NavSection =
  | 'dashboard'
  | 'orders-customerwise'
  | 'orders-datewise'
  | 'orders-productwise'
  | 'batch-jobcards'
  | 'party-outstanding'
  | 'pending-jobs'
  | 'orders-history'
  | 'branches'
  | 'customers'
  | 'products'
  | 'users'
  | 'backup';

interface TopBarProps {
  activeNav: NavSection;
  onNavigate: (nav: NavSection) => void;
  onToggleSidebar: () => void;
  onOpenNewOrder: () => void;
}

const TOP_NAV_ITEMS: Array<{ id: NavSection; label: string; matchIds: NavSection[] }> = [
  { id: 'dashboard', label: 'Home', matchIds: ['dashboard'] },
  { id: 'branches', label: 'Branch', matchIds: ['branches'] },
  { id: 'orders-datewise', label: 'Daily', matchIds: ['orders-datewise'] },
  { id: 'orders-customerwise', label: 'Customer', matchIds: ['orders-customerwise', 'customers', 'party-outstanding'] },
  { id: 'pending-jobs', label: 'Pending Jobs', matchIds: ['pending-jobs'] },
  { id: 'orders-history', label: 'Orders History', matchIds: ['orders-history', 'orders-productwise', 'batch-jobcards'] },
  { id: 'users', label: 'Users', matchIds: ['users'] },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeNav,
  onNavigate,
  onToggleSidebar,
  onOpenNewOrder,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [iconError, setIconError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="no-print h-[52px] bg-white border-b border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Left: Hamburger + Two-tone Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Toggle Contents Sidebar"
          className="p-1.5 rounded-[3px] text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('orders-customerwise')}
          className="flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          {!iconError ? (
            <img
              src={appIconImg}
              alt="Vidyasagara Printers"
              referrerPolicy="no-referrer"
              onError={() => setIconError(true)}
              className="w-7 h-7 rounded-[4px] object-cover border border-[#E5E7EB]"
            />
          ) : (
            <span className="w-7 h-7 rounded-[4px] bg-[#F26522] text-white flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </span>
          )}
          <span className="text-[20px] font-bold tracking-tight whitespace-nowrap leading-none">
            <span className="text-[#1F2937]">Vidyasagara </span>
            <span className="text-[#F26522]">Printers</span>
          </span>
        </button>
      </div>

      {/* Right: Top Horizontal Navigation + User Avatar */}
      <div className="flex items-center h-full gap-1">
        <nav className="hidden md:flex items-center h-full">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive = item.matchIds.includes(activeNav);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`h-full px-4 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center ${
                  isActive
                    ? 'bg-[#F3F4F6] text-[#111827] border-b-2 border-[#F26522]'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Avatar & Quick Menu */}
        <div className="relative ml-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title="Account & Database Menu"
            className="w-8 h-8 rounded-full overflow-hidden border border-[#D1D5DB] hover:border-[#F26522] transition-colors cursor-pointer flex items-center justify-center bg-[#F3F4F6]"
          >
            {!imgError ? (
              <img
                src={userAvatarImg}
                alt="Vishwanath N."
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-[#374151]">VN</span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#E5E7EB] shadow-lg rounded-[3px] py-1 z-50 text-[12.5px]">
              <div className="px-3 py-2 border-b border-[#E5E7EB]">
                <div className="font-semibold text-[#1F2937]">Vishwanath N.</div>
                <div className="text-[11px] text-[#6B7280]">Vidyasagara Printers · Admin</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenNewOrder();
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#374151] hover:bg-[#FFF4EE] hover:text-[#F26522] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Job Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('backup');
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-[#374151] hover:bg-[#FFF4EE] hover:text-[#F26522] cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                SQLite Backup & Restore
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
