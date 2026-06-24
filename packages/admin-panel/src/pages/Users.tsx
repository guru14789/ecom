import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Wallet,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'buyer' | 'vendor' | 'admin';
type UserStatus = 'active' | 'suspended';

interface UserRecord {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  createdAt: string;
}

interface UsersApiResponse {
  users: UserRecord[];
  total: number;
  page: number;
  totalPages: number;
}

type RoleFilter = 'all' | 'buyer' | 'vendor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const ROLE_COLORS: Record<UserRole, string> = {
  buyer: 'bg-blue-100 text-blue-700',
  vendor: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
};

// ─── Wallet Modal ─────────────────────────────────────────────────────────────

interface WalletModalProps {
  user: UserRecord;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ user, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-artz text-xl text-navy">Wallet Balance</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center">
          <Wallet size={28} className="text-teal" />
        </div>
        <p className="text-gray-600 text-sm">{user.name}</p>
        <p className="font-artz text-3xl text-navy">{formatCurrency(user.walletBalance)}</p>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 rounded-xl bg-navy text-white font-inter text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [walletUser, setWalletUser] = useState<UserRecord | null>(null);

  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get<UsersApiResponse>('/admin/users', { params });
      setUsers(res.data.users ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, searchQuery]);

  const handleToggleStatus = async (user: UserRecord) => {
    setSuspendingId(user._id);
    const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/admin/users/${user._id}/status`, { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'unsuspended' : 'suspended'} successfully`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
      );
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setSuspendingId(null);
    }
  };

  const roleTabs: { label: string; value: RoleFilter; count?: number }[] = [
    { label: 'All Users', value: 'all' },
    { label: 'Buyers', value: 'buyer' },
    { label: 'Vendors', value: 'vendor' },
  ];

  return (
    <div className="min-h-screen bg-[#F5FEFE] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-artz text-2xl text-navy leading-tight">User Management</h1>
            <p className="text-sm text-gray-500 font-inter">
              {total.toLocaleString()} users registered on the platform
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Role Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium font-inter transition-all duration-200 ${
                  roleFilter === tab.value
                    ? 'bg-white text-navy shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Refresh */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={28} className="text-teal animate-spin" />
            <p className="text-gray-400 font-inter text-sm">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Users size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-inter text-sm">No users found</p>
            <button onClick={fetchUsers} className="text-teal text-sm font-medium hover:underline">
              Refresh
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    User
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    Contact
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    Role
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    Wallet
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr
                    key={user._id}
                    className={`border-b border-gray-50 hover:bg-[#F5FEFE] transition-colors ${
                      idx % 2 === 0 ? '' : 'bg-gray-50/30'
                    }`}
                  >
                    {/* Name + Avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 font-inter">{user.name}</p>
                          <p className="text-xs text-gray-400 font-inter">{user._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-inter">
                          <Phone size={11} className="text-gray-400" />
                          {user.phone}
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-inter">
                            <Mail size={11} className="text-gray-300" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                        <Shield size={10} />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setWalletUser(user)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-teal/80 transition-colors font-inter group"
                      >
                        {formatCurrency(user.walletBalance)}
                        <Wallet size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-sm text-gray-500 font-inter whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={suspendingId === user._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-inter disabled:opacity-50 ${
                            user.status === 'active'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {suspendingId === user._id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : user.status === 'active' ? (
                            <Ban size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {user.status === 'active' ? 'Suspend' : 'Unsuspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-inter">
              Page {page} of {totalPages} &mdash; {total.toLocaleString()} users total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} className="text-gray-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      {walletUser && <WalletModal user={walletUser} onClose={() => setWalletUser(null)} />}
    </div>
  );
};

export default UsersPage;
