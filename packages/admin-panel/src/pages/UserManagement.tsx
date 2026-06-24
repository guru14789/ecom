import React, { useEffect, useState } from 'react';
import { Search, Users, UserCheck, UserX, Wallet, RotateCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface AppUser {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  walletBalance: number;
  orderCount?: number;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [walletModal, setWalletModal] = useState<{ user: AppUser; open: boolean }>({ user: null as any, open: false });
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page, limit: 20, search } });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`${currentStatus ? 'Suspend' : 'Activate'} this user?`)) return;
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${currentStatus ? 'suspended' : 'activated'}`);
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleWalletAction = async (type: 'credit' | 'debit') => {
    if (!walletAmount || parseFloat(walletAmount) <= 0) { toast.error('Enter valid amount'); return; }
    setActionLoading(walletModal.user._id);
    try {
      await api.post(`/admin/users/${walletModal.user._id}/wallet`, { amount: parseFloat(walletAmount), type, reason: walletReason });
      toast.success(`₹${walletAmount} ${type}ed to wallet`);
      setWalletModal({ user: null as any, open: false });
      setWalletAmount('');
      setWalletReason('');
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">User Management</h1>
        <button onClick={fetchUsers} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
          <RotateCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
          </div>
          <span className="text-xs text-slate-400">{users.length} users</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><Users size={40} className="mx-auto mb-3 opacity-50" /><p className="text-sm">No users found</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Wallet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.fullName || 'No Name'}</p>
                      <p className="text-xs text-slate-400">{u.email || u.phoneNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-sm font-semibold">₹{u.walletBalance || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setWalletModal({ user: u, open: true }); setWalletAmount(''); setWalletReason(''); }} className="p-2 hover:bg-teal/10 rounded-lg" title="Wallet"><Wallet size={14} className="text-teal" /></button>
                      <button onClick={() => toggleStatus(u._id, u.isActive)} disabled={actionLoading === u._id} className="p-2 hover:bg-red-50 rounded-lg" title={u.isActive ? 'Suspend' : 'Activate'}>
                        {actionLoading === u._id ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <UserX size={14} className="text-red-400" /> : <UserCheck size={14} className="text-green-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-slate-500 hover:text-navy disabled:opacity-30">Previous</button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm text-slate-500 hover:text-navy disabled:opacity-30">Next</button>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      {walletModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setWalletModal({ user: null as any, open: false })}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-artz font-bold text-navy mb-2">Wallet Adjustment</h3>
            <p className="text-sm text-slate-500 mb-4">{walletModal.user.fullName || walletModal.user.phoneNumber} — Current: ₹{walletModal.user.walletBalance || 0}</p>
            <input type="number" placeholder="Amount" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <input type="text" placeholder="Reason" value={walletReason} onChange={(e) => setWalletReason(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal/20" />
            <div className="flex gap-2">
              <button onClick={() => setWalletModal({ user: null as any, open: false })} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={() => handleWalletAction('debit')} disabled={actionLoading === walletModal.user._id} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100">Debit</button>
              <button onClick={() => handleWalletAction('credit')} disabled={actionLoading === walletModal.user._id} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-600 hover:bg-green-100">Credit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
