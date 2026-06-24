import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  Users,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = 'active' | 'completed' | 'expired' | 'cancelled';
type StatusFilter = 'all' | 'active' | 'completed' | 'expired';

interface GroupSession {
  _id: string;
  productName: string;
  productImage?: string;
  currentCount: number;
  targetCount: number;
  shareCode: string;
  status: SessionStatus;
  endsAt: string;
  startedAt: string;
  endedAt?: string;
  vendorName?: string;
  pricePerUnit: number;
  discountPercent: number;
}

interface SessionsApiResponse {
  sessions: GroupSession[];
  total: number;
  page: number;
  totalPages: number;
}

interface StatsData {
  totalActive: number;
  completedToday: number;
  expiredToday: number;
  avgCompletionRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const getTimeRemaining = (endsAt: string): string => {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const progressPercent = (current: number, target: number) =>
  Math.min(100, Math.round((current / target) * 100));

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  completed: { label: 'Completed', color: 'text-teal-700', bg: 'bg-teal/10', dot: 'bg-teal' },
  expired: { label: 'Expired', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}

const StatBox: React.FC<StatBoxProps> = ({ icon, label, value, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div>
      <p className="font-artz text-2xl text-navy">{value}</p>
      <p className="text-xs text-gray-500 font-inter">{label}</p>
    </div>
  </div>
);

interface ActiveSessionCardProps {
  session: GroupSession;
  onCancel: (id: string) => void;
  cancelling: boolean;
}

const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({ session, onCancel, cancelling }) => {
  const pct = progressPercent(session.currentCount, session.targetCount);
  const timeLeft = getTimeRemaining(session.endsAt);
  const isExpiringSoon = new Date(session.endsAt).getTime() - Date.now() < 3_600_000;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-teal flex items-center justify-center text-white text-sm font-bold shrink-0">
            {session.productName.charAt(0)}
          </div>
          <div>
            <p className="font-inter font-semibold text-navy text-sm leading-tight line-clamp-1">{session.productName}</p>
            {session.vendorName && (
              <p className="text-xs text-gray-400 font-inter">{session.vendorName}</p>
            )}
          </div>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 font-inter">
          Active
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 font-inter">
            {session.currentCount} / {session.targetCount} joined
          </span>
          <span className="text-xs font-semibold text-teal font-inter">{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 100 ? '#01B4BA' : 'linear-gradient(90deg, #01406D, #01B4BA)',
            }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-400 font-inter mb-0.5">Share Code</p>
          <p className="text-sm font-mono font-semibold text-navy">{session.shareCode}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${isExpiringSoon ? 'bg-orange-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-400 font-inter mb-0.5">Time Left</p>
          <div className="flex items-center gap-1">
            <Clock size={11} className={isExpiringSoon ? 'text-orange-500' : 'text-gray-400'} />
            <p className={`text-sm font-semibold font-inter ${isExpiringSoon ? 'text-orange-600' : 'text-navy'}`}>
              {timeLeft}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-400 font-inter mb-0.5">Price</p>
          <p className="text-sm font-semibold text-navy font-inter">{formatCurrency(session.pricePerUnit)}</p>
        </div>
        <div className="bg-teal/5 rounded-xl p-2.5">
          <p className="text-xs text-gray-400 font-inter mb-0.5">Discount</p>
          <p className="text-sm font-semibold text-teal font-inter">{session.discountPercent}% off</p>
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => onCancel(session._id)}
        disabled={cancelling}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium font-inter hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {cancelling ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
        Cancel Session
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GroupSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [stats, setStats] = useState<StatsData>({ totalActive: 0, completedToday: 0, expiredToday: 0, avgCompletionRate: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const LIMIT = 12;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get<SessionsApiResponse & { stats?: StatsData }>('/admin/group-sessions', { params });
      setSessions(res.data.sessions ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
      if (res.data.stats) setStats(res.data.stats);
    } catch {
      toast.error('Failed to fetch group sessions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Live time update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) => [...prev]); // trigger re-render for time remaining
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    if (confirmCancelId !== id) {
      setConfirmCancelId(id);
      return;
    }
    setCancellingId(id);
    setConfirmCancelId(null);
    try {
      await api.post(`/admin/group-sessions/${id}/cancel`);
      toast.success('Session cancelled successfully');
      setSessions((prev) => prev.map((s) => (s._id === id ? { ...s, status: 'cancelled' as SessionStatus } : s)));
    } catch {
      toast.error('Failed to cancel session');
    } finally {
      setCancellingId(null);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const pastSessions = sessions.filter((s) => s.status !== 'active');

  const filterTabs: { label: string; value: StatusFilter }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Expired', value: 'expired' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div className="min-h-screen bg-[#F5FEFE] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-artz text-2xl text-navy leading-tight">Group Buy Sessions</h1>
            <p className="text-sm text-gray-500 font-inter">
              {total.toLocaleString()} sessions &mdash; manage and monitor group purchases
            </p>
          </div>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-inter shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox icon={<Zap size={22} />} label="Total Active" value={stats.totalActive} iconBg="bg-green-100" iconColor="text-green-600" />
        <StatBox icon={<CheckCircle2 size={22} />} label="Completed Today" value={stats.completedToday} iconBg="bg-teal/10" iconColor="text-teal" />
        <StatBox icon={<Clock size={22} />} label="Expired Today" value={stats.expiredToday} iconBg="bg-gray-100" iconColor="text-gray-500" />
        <StatBox icon={<TrendingUp size={22} />} label="Avg Completion Rate" value={`${stats.avgCompletionRate.toFixed(1)}%`} iconBg="bg-orange-100" iconColor="text-orange-500" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium font-inter transition-all duration-200 ${
                statusFilter === tab.value
                  ? 'bg-white text-navy shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Cancel Banner */}
      {confirmCancelId && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium font-inter">Click "Cancel Session" again to confirm cancellation</span>
          </div>
          <button onClick={() => setConfirmCancelId(null)} className="text-orange-600 hover:text-orange-800 text-sm font-medium font-inter">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw size={28} className="text-teal animate-spin" />
          <p className="text-gray-400 font-inter text-sm">Loading sessions…</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Target size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-inter text-sm">No {statusFilter !== 'all' ? statusFilter : ''} sessions found</p>
          <button onClick={fetchSessions} className="text-teal text-sm font-medium hover:underline font-inter">
            Refresh
          </button>
        </div>
      ) : (
        <>
          {/* Active Sessions Grid */}
          {activeSessions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="font-artz text-lg text-navy">Live Sessions ({activeSessions.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activeSessions.map((session) => (
                  <ActiveSessionCard
                    key={session._id}
                    session={session}
                    onCancel={handleCancel}
                    cancelling={cancellingId === session._id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions Table */}
          {pastSessions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-artz text-lg text-navy">Past Sessions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      {['Product', 'Progress', 'Status', 'Share Code', 'Started', 'Ended / Expires'].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-inter whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map((session, idx) => {
                      const pct = progressPercent(session.currentCount, session.targetCount);
                      const cfg = STATUS_CONFIG[session.status];
                      return (
                        <tr key={session._id} className={`border-b border-gray-50 hover:bg-[#F5FEFE] transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy/20 to-teal/20 flex items-center justify-center text-navy text-xs font-bold shrink-0">
                                {session.productName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 font-inter line-clamp-1">{session.productName}</p>
                                {session.vendorName && <p className="text-xs text-gray-400 font-inter">{session.vendorName}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-teal rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 font-inter shrink-0">
                                {session.currentCount}/{session.targetCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-semibold text-navy bg-gray-50 px-2 py-1 rounded-lg">{session.shareCode}</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500 font-inter whitespace-nowrap">{formatDate(session.startedAt)}</td>
                          <td className="px-5 py-4 text-sm text-gray-500 font-inter whitespace-nowrap">
                            {session.endedAt ? formatDate(session.endedAt) : formatDate(session.endsAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-500 font-inter">
            Page {page} of {totalPages} &mdash; {total.toLocaleString()} sessions total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={15} className="text-gray-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={15} className="text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSessionsPage;
