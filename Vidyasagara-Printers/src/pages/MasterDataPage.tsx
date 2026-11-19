import React, { useState, useRef } from 'react';
import { Plus, Edit3, Trash2, Download, Upload, RotateCcw, FolderOpen } from 'lucide-react';
import type { Branch, Customer, DbInfo, Product, StaffUser } from '../types/erp';
import { formatMoney } from '../utils/format';
import { erpClient } from '../api/client';

interface MasterDataPageProps {
  section: 'customers' | 'products' | 'branches' | 'users' | 'backup';
  customers: Customer[];
  products: Product[];
  branches: Branch[];
  users: StaffUser[];
  dbInfo: DbInfo | null;
  onRefresh: () => Promise<void>;
  onOpenNewCustomer: () => void;
  onOpenEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onSelectCustomerAndView: (customerId: number) => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export const MasterDataPage: React.FC<MasterDataPageProps> = ({
  section,
  customers,
  products,
  branches,
  users,
  dbInfo,
  onRefresh,
  onOpenNewCustomer,
  onOpenEditCustomer,
  onDeleteCustomer,
  onSelectCustomerAndView,
  onNotify,
}) => {
  const [search, setSearch] = useState('');

  // Inline Product Form State
  const [prodFormOpen, setProdFormOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pCat, setPCat] = useState('Offset Print');
  const [pRate, setPRate] = useState(0);
  const [pUnit, setPUnit] = useState('1000 Pcs');
  const [pGst, setPGst] = useState(18);

  // Inline Branch Form State
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [bCode, setBCode] = useState('');
  const [bName, setBName] = useState('');
  const [bCity, setBCity] = useState('');
  const [bPhone, setBPhone] = useState('');

  // Inline User Form State
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [uUsername, setUUsername] = useState('');
  const [uFullName, setUFullName] = useState('');
  const [uRole, setURole] = useState<StaffUser['role']>('Operator');
  const [uBranch, setUBranch] = useState('JPB');
  const [uPhone, setUPhone] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (section === 'customers') {
    const filtered = customers.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });

    return (
      <div className="p-3 bg-[#F8F9FA] min-h-full">
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-[#1F2937]">Master — Customers / Parties</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer..."
                className="w-56 h-[28px] px-2.5 text-[12px] border border-[#D1D5DB] rounded-[2px] focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="button"
                onClick={onOpenNewCustomer}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#F26522] text-white text-[12px] font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Customer
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                  <th className="px-3 py-2 text-right font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Customer Name</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Branch</th>
                  <th className="px-3 py-2 text-left font-medium">Prefix</th>
                  <th className="px-3 py-2 text-left font-medium">City</th>
                  <th className="px-3 py-2 text-right font-medium">Total Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Total Amt</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF8F4]">
                    <td className="px-3 py-2 text-right">{c.id}</td>
                    <td
                      onClick={() => onSelectCustomerAndView(c.id)}
                      className="px-3 py-2 font-medium text-[#1F2937] hover:text-[#F26522] cursor-pointer"
                    >
                      {c.name}
                    </td>
                    <td className="px-3 py-2">{c.phone}</td>
                    <td className="px-3 py-2">{c.branch_code}</td>
                    <td className="px-3 py-2">{c.order_prefix}</td>
                    <td className="px-3 py-2">{c.city || '—'}</td>
                    <td className="px-3 py-2 text-right">{c.total_orders || 0}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(c.total_amount)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenEditCustomer(c)}
                        className="p-1 text-[#4B5563] hover:text-[#F26522] cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomer(c)}
                        className="p-1 text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer ml-1"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'products') {
    const startEditProd = (p?: Product) => {
      if (p) {
        setEditingProd(p);
        setPCode(p.code);
        setPName(p.name);
        setPCat(p.category);
        setPRate(p.default_rate);
        setPUnit(p.unit);
        setPGst(p.gst_percent);
      } else {
        setEditingProd(null);
        setPCode('');
        setPName('');
        setPCat('Offset Print');
        setPRate(450);
        setPUnit('1000 Pcs');
        setPGst(18);
      }
      setProdFormOpen(true);
    };

    const saveProd = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingProd) {
          await erpClient.updateProduct(editingProd.id, {
            code: pCode,
            name: pName,
            category: pCat,
            default_rate: pRate,
            unit: pUnit,
            gst_percent: pGst,
          });
          onNotify('success', `Product ${pCode} updated.`);
        } else {
          await erpClient.createProduct({
            code: pCode,
            name: pName,
            category: pCat,
            default_rate: pRate,
            unit: pUnit,
            gst_percent: pGst,
          });
          onNotify('success', `Product ${pCode} added.`);
        }
        setProdFormOpen(false);
        await onRefresh();
      } catch (err: unknown) {
        onNotify('error', (err as Error).message);
      }
    };

    return (
      <div className="p-3 space-y-3 bg-[#F8F9FA] min-h-full">
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#1F2937]">Master — Products & Print Rate Card</h2>
            <button
              type="button"
              onClick={() => startEditProd()}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#F26522] text-white text-[12px] font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          {prodFormOpen && (
            <form onSubmit={saveProd} className="p-3 bg-[#FFF8F4] border-b border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-6 gap-2 text-[12px]">
              <input
                required
                placeholder="Code (e.g. ADS)"
                value={pCode}
                onChange={(e) => setPCode(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px] uppercase"
              />
              <input
                required
                placeholder="Product Name"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px] sm:col-span-2"
              />
              <input
                placeholder="Category"
                value={pCat}
                onChange={(e) => setPCat(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <input
                type="number"
                required
                placeholder="Rate"
                value={pRate}
                onChange={(e) => setPRate(Number(e.target.value))}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px] tabular-nums"
              />
              <div className="flex gap-1">
                <button
                  type="submit"
                  className="flex-1 h-[30px] bg-[#F26522] text-white font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setProdFormOpen(false)}
                  className="px-2 h-[30px] border border-[#D1D5DB] bg-white rounded-[2px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-left font-medium">Unit</th>
                <th className="px-3 py-2 text-right font-medium">Default Rate</th>
                <th className="px-3 py-2 text-right font-medium">GST %</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF8F4]">
                  <td className="px-3 py-2 font-semibold text-[#1F2937]">{p.code}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{p.unit}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(p.default_rate)}</td>
                  <td className="px-3 py-2 text-right">{p.gst_percent}%</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => startEditProd(p)}
                      className="p-1 text-[#4B5563] hover:text-[#F26522] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await erpClient.deleteProduct(p.id);
                        onNotify('success', `Product ${p.code} deleted.`);
                        await onRefresh();
                      }}
                      className="p-1 text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'branches') {
    const startEditBranch = (b?: Branch) => {
      if (b) {
        setEditingBranch(b);
        setBCode(b.code);
        setBName(b.name);
        setBCity(b.city);
        setBPhone(b.phone);
      } else {
        setEditingBranch(null);
        setBCode('');
        setBName('');
        setBCity('');
        setBPhone('');
      }
      setBranchFormOpen(true);
    };

    const saveBranch = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingBranch) {
          await erpClient.updateBranch(editingBranch.id, { code: bCode, name: bName, city: bCity, phone: bPhone });
          onNotify('success', `Branch ${bCode} updated.`);
        } else {
          await erpClient.createBranch({ code: bCode, name: bName, city: bCity, phone: bPhone });
          onNotify('success', `Branch ${bCode} created.`);
        }
        setBranchFormOpen(false);
        await onRefresh();
      } catch (err: unknown) {
        onNotify('error', (err as Error).message);
      }
    };

    return (
      <div className="p-3 bg-[#F8F9FA] min-h-full">
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#1F2937]">Branch Units & Printing Centers</h2>
            <button
              type="button"
              onClick={() => startEditBranch()}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#F26522] text-white text-[12px] font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Branch
            </button>
          </div>

          {branchFormOpen && (
            <form onSubmit={saveBranch} className="p-3 bg-[#FFF8F4] border-b border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-5 gap-2 text-[12px]">
              <input
                required
                placeholder="Branch Code (e.g. JPB)"
                value={bCode}
                onChange={(e) => setBCode(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px] uppercase"
              />
              <input
                required
                placeholder="Branch Name"
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <input
                placeholder="City"
                value={bCity}
                onChange={(e) => setBCity(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <input
                placeholder="Phone"
                value={bPhone}
                onChange={(e) => setBPhone(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <div className="flex gap-1">
                <button type="submit" className="flex-1 h-[30px] bg-[#F26522] text-white rounded-[2px] cursor-pointer">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFormOpen(false)}
                  className="px-2 h-[30px] border border-[#D1D5DB] bg-white rounded-[2px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Branch Name</th>
                <th className="px-3 py-2 text-left font-medium">City</th>
                <th className="px-3 py-2 text-left font-medium">Phone</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF8F4]">
                  <td className="px-3 py-2 font-semibold">{b.code}</td>
                  <td className="px-3 py-2">{b.name}</td>
                  <td className="px-3 py-2">{b.city}</td>
                  <td className="px-3 py-2">{b.phone}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => startEditBranch(b)} className="p-1 hover:text-[#F26522] cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await erpClient.deleteBranch(b.id);
                        onNotify('success', `Branch ${b.code} deleted.`);
                        await onRefresh();
                      }}
                      className="p-1 text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'users') {
    const startEditUser = (u?: StaffUser) => {
      if (u) {
        setEditingUser(u);
        setUUsername(u.username);
        setUFullName(u.full_name);
        setURole(u.role);
        setUBranch(u.branch_code);
        setUPhone(u.phone);
      } else {
        setEditingUser(null);
        setUUsername('');
        setUFullName('');
        setURole('Operator');
        setUBranch(branches[0]?.code || 'JPB');
        setUPhone('');
      }
      setUserFormOpen(true);
    };

    const saveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingUser) {
          await erpClient.updateUser(editingUser.id, {
            username: uUsername,
            full_name: uFullName,
            role: uRole,
            branch_code: uBranch,
            phone: uPhone,
          });
          onNotify('success', `User ${uFullName} updated.`);
        } else {
          await erpClient.createUser({
            username: uUsername,
            full_name: uFullName,
            role: uRole,
            branch_code: uBranch,
            phone: uPhone,
          });
          onNotify('success', `User ${uFullName} added.`);
        }
        setUserFormOpen(false);
        await onRefresh();
      } catch (err: unknown) {
        onNotify('error', (err as Error).message);
      }
    };

    return (
      <div className="p-3 bg-[#F8F9FA] min-h-full">
        <div className="bg-white border border-[#E5E7EB]">
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#1F2937]">Staff Users & Desk Operators</h2>
            <button
              type="button"
              onClick={() => startEditUser()}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#F26522] text-white text-[12px] font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          {userFormOpen && (
            <form onSubmit={saveUser} className="p-3 bg-[#FFF8F4] border-b border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-6 gap-2 text-[12px]">
              <input
                required
                placeholder="Username"
                value={uUsername}
                onChange={(e) => setUUsername(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <input
                required
                placeholder="Full Name"
                value={uFullName}
                onChange={(e) => setUFullName(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <select
                value={uRole}
                onChange={(e) => setURole(e.target.value as StaffUser['role'])}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              >
                <option value="Admin">Admin</option>
                <option value="Accounts">Accounts</option>
                <option value="Operator">Operator</option>
                <option value="Despatch">Despatch</option>
              </select>
              <select
                value={uBranch}
                onChange={(e) => setUBranch(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>{b.code}</option>
                ))}
              </select>
              <input
                placeholder="Phone"
                value={uPhone}
                onChange={(e) => setUPhone(e.target.value)}
                className="h-[30px] px-2 bg-white border border-[#D1D5DB] rounded-[2px]"
              />
              <div className="flex gap-1">
                <button type="submit" className="flex-1 h-[30px] bg-[#F26522] text-white rounded-[2px] cursor-pointer">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setUserFormOpen(false)}
                  className="px-2 h-[30px] border border-[#D1D5DB] bg-white rounded-[2px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <table className="w-full border-collapse text-[12.5px] tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#FCFCFD]">
                <th className="px-3 py-2 text-left font-medium">Username</th>
                <th className="px-3 py-2 text-left font-medium">Full Name</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
                <th className="px-3 py-2 text-left font-medium">Branch</th>
                <th className="px-3 py-2 text-left font-medium">Phone</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#E5E7EB] hover:bg-[#FFF8F4]">
                  <td className="px-3 py-2 font-medium">{u.username}</td>
                  <td className="px-3 py-2">{u.full_name}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.branch_code}</td>
                  <td className="px-3 py-2">{u.phone}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => startEditUser(u)} className="p-1 hover:text-[#F26522] cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await erpClient.deleteUser(u.id);
                        onNotify('success', `User ${u.full_name} deleted.`);
                        await onRefresh();
                      }}
                      className="p-1 text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // DATABASE BACKUP & RESTORE
  const handleExport = async () => {
    try {
      const res = await erpClient.exportBackup();
      if (!res.canceled) {
        onNotify('success', res.filePath ? `Backup saved to ${res.filePath}` : 'SQLite backup exported.');
      }
    } catch (err: unknown) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleElectronRestore = async () => {
    try {
      const res = await erpClient.restoreBackup();
      if (!res.canceled && res.ok) {
        await onRefresh();
        onNotify('success', 'SQLite database restored successfully.');
      }
    } catch (err: unknown) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleBrowserRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      await erpClient.restoreBackup(base64);
      await onRefresh();
      onNotify('success', `Database restored from ${file.name}.`);
    } catch (err: unknown) {
      onNotify('error', (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="p-3 bg-[#F8F9FA] min-h-full">
      <div className="bg-white border border-[#E5E7EB] p-4 space-y-4 max-w-[820px]">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h2 className="text-[15px] font-bold text-[#1F2937]">SQLite Database Storage & Backup</h2>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            All customers, job orders, branch flags, and payment receipts are stored permanently in a local SQLite database file outside the program directory.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-[11px] text-[#6B7280]">Database File Path</div>
            <div className="font-mono-num text-[11.5px] text-[#1F2937] break-all mt-1">
              {dbInfo?.dbPath || 'Loading...'}
            </div>
          </div>
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] tabular-nums">
            <div className="text-[11px] text-[#6B7280]">Engine & Size</div>
            <div className="font-semibold text-[#1F2937] mt-1">
              {dbInfo?.engine || 'SQLite 3'} · {((dbInfo?.fileSizeBytes || 0) / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        {dbInfo?.tables && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center tabular-nums">
            {Object.entries(dbInfo.tables).map(([tbl, cnt]) => (
              <div key={tbl} className="p-2 border border-[#E5E7EB] bg-white">
                <div className="text-[11px] text-[#6B7280] capitalize">{tbl}</div>
                <div className="text-[16px] font-bold text-[#1F2937]">{cnt}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F26522] text-white text-[12.5px] font-medium rounded-[2px] hover:bg-[#DC5516] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export SQLite Backup (.db)
          </button>

          {erpClient.isDesktopApp() ? (
            <>
              <button
                type="button"
                onClick={handleElectronRestore}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D1D5DB] bg-white text-[#374151] text-[12.5px] rounded-[2px] hover:border-[#F26522] cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Restore from Backup (.db)
              </button>
              <button
                type="button"
                onClick={() => erpClient.openDataFolder()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D1D5DB] bg-white text-[#374151] text-[12.5px] rounded-[2px] hover:border-[#F26522] cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                Open Data Folder
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db,.sqlite,.sqlite3"
                onChange={handleBrowserRestoreFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D1D5DB] bg-white text-[#374151] text-[12.5px] rounded-[2px] hover:border-[#F26522] cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Restore from Backup (.db)
              </button>
            </>
          )}

          <button
            type="button"
            onClick={async () => {
              await erpClient.resetDb();
              await onRefresh();
              onNotify('success', 'Sample data restored.');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D1D5DB] bg-white text-[#DC2626] text-[12.5px] rounded-[2px] hover:bg-[#FEF2F2] cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
