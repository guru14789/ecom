import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Store, ShoppingCart, Clock, Users,
  CheckCircle, XCircle, FileText, DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../api/client';

interface PlatformStats {
  gmvToday: number;
  activeVendors: number;
  ordersToday: number;
  pendingApprovals: number;
}

interface ApprovalItem {
  id: string;
  type: 'vendor_kyc' | 'product';
  name: string;
  submittedAt: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats>({
    gmvToday: 0, activeVendors: 0, ordersToday: 0, pendingApprovals: 0,
  });
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => {
        const d = res.data.data;
        if (d.stats) setStats(d.stats);
        if (d.pendingApprovals) setApprovals(d.pendingApprovals);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (item: ApprovalItem) => {
    try {
      const endpoint = item.type === 'vendor_kyc'
        ? `/admin/vendors/${item.id}/status`
        : `/admin/products/${item.id}/approve`;
      await api.put(endpoint, { status: 'active' });
      toast.success(`${item.type === 'vendor_kyc' ? 'Vendor' : 'Product'} approved`);
      setApprovals((prev) => prev.filter((a) => a.id !== item.id));
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      const endpoint = item.type === 'vendor_kyc'
        ? `/admin/vendors/${item.id}/status`
        : `/admin/products/${item.id}/reject`;
      await api.put(endpoint, { status: 'rejected' });
      toast.success(`${item.type === 'vendor_kyc' ? 'Vendor' : 'Product'} rejected`);
      setApprovals((prev) => prev.filter((a) => a.id !== item.id));
    } catch {
      toast.error('Failed to reject');
    }
  };

  const gmvData = [
    { day: 'Mon', gmv: 45000, returns: 8 },
    { day: 'Tue', gmv: 72000, returns: 12 },
    { day: 'Wed', gmv: 38000, returns: 6 },
    { day: 'Thu', gmv: 85000, returns: 15 },
    { day: 'Fri', gmv: 120000, returns: 20 },
    { day: 'Sat', gmv: 98000, returns: 14 },
    { day: 'Sun', gmv: 62000, returns: 9 },
  ];

  const kpiCards = [
    {
      label: 'GMV Today',
      value: `₹${stats.gmvToday.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-[#01B4BA]',
      bg: 'bg-[#01B4BA]/10',
    },
    {
      label: 'Active Vendors',
      value: stats.activeVendors.toLocaleString('en-IN'),
      icon: Store,
      color: 'text-[#01406D]',
      bg: 'bg-[#01406D]/10',
    },
    {
      label: 'Orders Today',
      value: stats.ordersToday.toLocaleString('en-IN'),
      icon: ShoppingCart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals.toLocaleString('en-IN'),
      icon: Clock,
      color: 'text-[#FF7A0F]',
      bg: 'bg-[#FFF7ED]',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-[6px]" />
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="h-72 rounded-2xl skeleton col-span-2" />
          <div className="h-72 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_150ms_ease]">
      <h1 className="text-2xl font-artz font-bold text-[#01406D] mb-6">Overview</h1>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white border border-[#E0EFEF] rounded-2xl p-5 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-inter font-semibold text-[#6B8FA3] uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`w-10 h-10 ${card.bg} rounded-[6px] flex items-center justify-center`}>
                <card.icon size={18} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-artz font-bold text-[#01406D]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* GMV Trend — teal area chart */}
        <div className="lg:col-span-2 bg-white border border-[#E0EFEF] rounded-2xl p-5">
          <h3 className="font-artz font-bold text-[#01406D] text-base mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#01B4BA]" /> GMV Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={gmvData}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#01B4BA" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#01B4BA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EFEF" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B8FA3' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B8FA3' }} />
              <Tooltip
                contentStyle={{ borderRadius: 6, border: '1px solid #E0EFEF', fontSize: 12 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'GMV']}
              />
              <Area type="monotone" dataKey="gmv" stroke="#01B4BA" strokeWidth={2.5} fill="url(#gmvGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Return Rate — orange line */}
        <div className="bg-white border border-[#E0EFEF] rounded-2xl p-5">
          <h3 className="font-artz font-bold text-[#01406D] text-base mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[#FF7A0F]" /> Return Rate
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={gmvData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EFEF" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B8FA3' }} />
              <Tooltip
                contentStyle={{ borderRadius: 6, border: '1px solid #E0EFEF', fontSize: 12 }}
                formatter={(v: any) => [`${Number(v)}`, 'Returns']}
              />
              <Line
                type="monotone" dataKey="returns" stroke="#FF7A0F" strokeWidth={2.5}
                dot={{ fill: '#FF7A0F', r: 4, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-center text-xs font-inter text-[#6B8FA3] mt-2">
            Avg return rate: <span className="font-bold text-[#FF7A0F]">2.4%</span>
          </p>
        </div>
      </div>

      {/* Approval Queue */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E0EFEF]">
          <h3 className="font-artz font-bold text-[#01406D] text-base flex items-center gap-2">
            <Clock size={16} className="text-[#01B4BA]" /> Approval Queue
            {approvals.length > 0 && (
              <span className="bg-[#FF7A0F] text-white text-[10px] font-inter font-bold px-2 py-0.5 rounded-full">
                {approvals.length}
              </span>
            )}
          </h3>
        </div>

        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5FEFE] flex items-center justify-center">
              <CheckCircle size={32} className="text-[#01B4BA]" />
            </div>
            <div>
              <h3 className="font-artz font-bold text-[#01406D] text-lg">All Clear</h3>
              <p className="font-inter text-sm text-[#6B8FA3] mt-0.5">No pending approvals</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Name / ID</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Submitted</th>
                <th className="text-right px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((item, idx) => (
                <tr key={item.id} className={`border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors ${idx % 2 === 1 ? 'bg-[#F5FEFE]/30' : ''}`}>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-inter font-bold ${
                      item.type === 'vendor_kyc' ? 'bg-[#01406D]/10 text-[#01406D]' : 'bg-[#01B4BA]/10 text-[#01B4BA]'
                    }`}>
                      {item.type === 'vendor_kyc' ? 'Vendor KYC' : 'Product'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-inter text-sm font-medium text-[#01406D]">{item.name}</td>
                  <td className="px-5 py-4 font-inter text-xs text-[#6B8FA3]">
                    {new Date(item.submittedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprove(item)}
                        className="flex items-center gap-1 bg-[#01B4BA] text-white px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-[#019aa0] transition-colors duration-150"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(item)}
                        className="flex items-center gap-1 border border-[#FF7A0F] text-[#FF7A0F] px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-[#FFF7ED] transition-colors duration-150"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
