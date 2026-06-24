import React, { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Package, Wallet, TrendingUp,
  ChevronDown, Eye, Search, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../store';
import api from '../api/client';

type RangeKey = '7d' | '30d' | '90d' | '1y';

const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '1y': 'Last Year',
};

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-[#FF7A0F]/10 text-[#FF7A0F]',
  confirmed: 'bg-[#01B4BA]/10 text-[#01B4BA]',
  processing: 'bg-[#01406D]/10 text-[#01406D]',
  shipped: 'bg-[#01406D]/10 text-[#01406D]',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
};

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const stats = useAppSelector((s) => s.vendor.stats);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<RangeKey>('30d');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    api.get('/vendor/dashboard')
      .then((res) => {
        const d = res.data.data;
        if (d.stats) dispatch({ type: 'SET_STATS', payload: d.stats });
        if (d.subscription) dispatch({ type: 'SET_SUBSCRIPTION', payload: d.subscription });
        if (d.recentOrders) setRecentOrders(d.recentOrders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  const chartData = [
    { day: 'Mon', sales: 4000, orders: 8 },
    { day: 'Tue', sales: 7000, orders: 14 },
    { day: 'Wed', sales: 3000, orders: 6 },
    { day: 'Thu', sales: 8000, orders: 17 },
    { day: 'Fri', sales: 12000, orders: 24 },
    { day: 'Sat', sales: 9000, orders: 19 },
    { day: 'Sun', sales: 5000, orders: 11 },
  ];

  const kpiCards = [
    {
      label: "Today's Sales",
      value: `₹${(stats?.totalEarnings ? Math.round(stats.totalEarnings * 0.01) : 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      delta: '+12.5%',
      deltaUp: true,
    },
    {
      label: 'Pending Orders',
      value: stats?.totalOrders ? String(Math.round(stats.totalOrders * 0.15)) : '0',
      icon: ShoppingCart,
      delta: '-3.2%',
      deltaUp: false,
    },
    {
      label: 'Low Stock Items',
      value: '8',
      icon: Package,
      delta: '+2',
      deltaUp: false,
    },
    {
      label: 'This Month Payout',
      value: `₹${(stats?.totalEarnings ? Math.round(stats.totalEarnings * 0.08) : 0).toLocaleString('en-IN')}`,
      icon: Wallet,
      delta: '+8.1%',
      deltaUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#01B4BA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-artz font-bold text-[#01406D] mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white border border-[#E0EFEF] rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-inter font-semibold text-[#6B8FA3] uppercase tracking-wider">
                {card.label}
              </span>
              <div className="w-10 h-10 bg-[#01B4BA]/10 rounded-xl flex items-center justify-center">
                <card.icon size={18} className="text-[#01B4BA]" />
              </div>
            </div>
            <p className="text-2xl font-artz font-bold text-[#01406D]">{card.value}</p>
            <span className={`inline-flex items-center gap-0.5 text-xs font-inter font-semibold mt-1.5 ${
              card.deltaUp ? 'text-emerald-600' : 'text-[#FF7A0F]'
            }`}>
              {card.deltaUp
                ? <ArrowUpRight size={12} strokeWidth={3} />
                : <ArrowDownRight size={12} strokeWidth={3} />
              }
              {card.delta} vs last period
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E0EFEF] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-artz font-bold text-[#01406D] text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-[#01B4BA]" /> Sales Overview
            </h3>
            <div className="relative">
              <button
onClick={() => setRangeOpen(!rangeOpen)}
                                                className="flex items-center gap-1.5 bg-white border border-[#E0EFEF] rounded-[6px] px-3 py-1.5 text-xs font-inter font-medium text-[#6B8FA3] hover:border-[#01B4BA]/40 transition-colors duration-150 min-h-[36px]"
              >
                {RANGE_LABELS[dateRange]} <ChevronDown size={14} />
              </button>
              {rangeOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E0EFEF] rounded-lg shadow-md z-10 min-w-[150px]">
                  {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setDateRange(key); setRangeOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs font-inter transition-colors ${
                        dateRange === key ? 'text-[#01B4BA] font-semibold' : 'text-[#6B8FA3] hover:bg-[#F5FEFE]'
                      }`}
                    >
                      {RANGE_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EFEF" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B8FA3' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B8FA3' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E0EFEF', fontSize: 12 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Sales']}
              />
              <Line
                type="monotone" dataKey="sales" stroke="#01B4BA" strokeWidth={2.5}
                dot={{ fill: '#01B4BA', r: 4, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#01B4BA' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mini Bar Chart */}
        <div className="bg-white border border-[#E0EFEF] rounded-2xl p-5">
          <h3 className="font-artz font-bold text-[#01406D] text-base mb-4 flex items-center gap-2">
            <Package size={16} className="text-[#01B4BA]" /> Orders
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EFEF" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B8FA3' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E0EFEF', fontSize: 12 }}
              />
              <Bar dataKey="orders" fill="#01406D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-xs font-inter text-[#6B8FA3] mt-2">
            Total: <span className="font-bold text-[#01406D]">99 orders</span> this period
          </p>
        </div>
      </div>

      {/* Order Queue Table */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0EFEF]">
          <h3 className="font-artz font-bold text-[#01406D] text-base">Order Queue</h3>
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8FA3]" />
            <input
              type="text" placeholder="Search orders..."
              className="w-full pl-9 pr-3 py-2 bg-[#F5FEFE] border border-[#E0EFEF] rounded-lg text-xs font-inter outline-none focus:border-[#01B4BA] transition-colors"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase tracking-wider">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase tracking-wider">Items</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase tracking-wider">Buyer PIN</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 8).map((order: any, idx: number) => (
                  <tr key={order._id || idx} className="border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-inter text-sm font-medium text-[#01406D]">
                        #{String(order._id || '').slice(-8)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-inter text-xs text-[#6B8FA3]">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-inter text-xs font-mono text-[#6B8FA3]">
                        {order.address?.pincode || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-inter text-sm font-bold text-[#01406D]">
                        ₹{(order.total || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-inter font-bold ${STATUS_PILL[order.status] || 'bg-slate-100 text-slate-500'}`}>
                        {(order.status || 'pending').replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="inline-flex items-center gap-1 text-[#01B4BA] font-inter font-bold text-xs hover:underline">
                        View <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E0EFEF]">
                    <td className="px-5 py-4" colSpan={6}>
                      <div className="h-10 skeleton rounded-lg" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {recentOrders.length > 8 && (
          <div className="px-5 py-3 border-t border-[#E0EFEF] text-center">
            <button className="text-xs font-inter font-bold text-[#01B4BA] hover:underline">
              View All Orders →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
