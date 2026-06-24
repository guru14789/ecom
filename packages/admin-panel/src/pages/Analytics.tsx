import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  Users,
  DollarSign,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface AnalyticsData {
  totalGMV: number;
  ordersToday: number;
  activeUsers: number;
  groupBuySessions: number;
  successRate: number;
  avgOrderValue: number;
  revenueTrend: { date: string; revenue: number }[];
  ordersByDay: { day: string; orders: number }[];
  orderStatus: { name: string; value: number }[];
  userRegistrations: { date: string; users: number }[];
}

// ─── Demo / Fallback Data ─────────────────────────────────────────────────────

const DEMO_DATA: AnalyticsData = {
  totalGMV: 48_72_450,
  ordersToday: 284,
  activeUsers: 12_847,
  groupBuySessions: 47,
  successRate: 78.4,
  avgOrderValue: 1_285,
  revenueTrend: [
    { date: 'May 1', revenue: 95000 },
    { date: 'May 3', revenue: 142000 },
    { date: 'May 5', revenue: 118000 },
    { date: 'May 7', revenue: 168000 },
    { date: 'May 9', revenue: 134000 },
    { date: 'May 11', revenue: 195000 },
    { date: 'May 13', revenue: 176000 },
    { date: 'May 15', revenue: 212000 },
    { date: 'May 17', revenue: 198000 },
    { date: 'May 19', revenue: 245000 },
    { date: 'May 21', revenue: 221000 },
    { date: 'May 23', revenue: 267000 },
    { date: 'May 25', revenue: 289000 },
    { date: 'May 27', revenue: 254000 },
    { date: 'May 29', revenue: 315000 },
  ],
  ordersByDay: [
    { day: 'Mon', orders: 142 },
    { day: 'Tue', orders: 198 },
    { day: 'Wed', orders: 176 },
    { day: 'Thu', orders: 221 },
    { day: 'Fri', orders: 284 },
    { day: 'Sat', orders: 312 },
    { day: 'Sun', orders: 267 },
  ],
  orderStatus: [
    { name: 'Delivered', value: 68 },
    { name: 'Pending', value: 18 },
    { name: 'Cancelled', value: 14 },
  ],
  userRegistrations: [
    { date: 'May 1', users: 42 },
    { date: 'May 5', users: 58 },
    { date: 'May 9', users: 71 },
    { date: 'May 13', users: 65 },
    { date: 'May 17', users: 89 },
    { date: 'May 21', users: 104 },
    { date: 'May 25', users: 97 },
    { date: 'May 29', users: 128 },
  ],
};

const PIE_COLORS = ['#01B4BA', '#01406D', '#f97316'];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
  prefix = '',
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
  prefix?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-sm font-inter">
      {label && <p className="text-gray-500 mb-1 text-xs">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-navy font-semibold">
          {prefix}
          {typeof entry.value === 'number' && prefix === '₹'
            ? entry.value.toLocaleString('en-IN')
            : entry.value}
          {entry.name && entry.name !== 'value' ? <span className="text-gray-400 font-normal ml-1">({entry.name})</span> : null}
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCardItem: React.FC<StatCard> = ({ label, value, change, positive, icon, color, bgColor }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
        <span className={color}>{icon}</span>
      </div>
      {change && (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          <ArrowUpRight size={12} className={positive ? '' : 'rotate-180'} />
          {change}
        </span>
      )}
    </div>
    <p className="font-artz text-2xl text-navy mb-0.5">{value}</p>
    <p className="text-xs text-gray-500 font-inter">{label}</p>
  </div>
);

// ─── Chart Card ───────────────────────────────────────────────────────────────

const ChartCard: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  icon,
  children,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[#F5FEFE] flex items-center justify-center text-teal">{icon}</div>
      <div>
        <h3 className="font-artz text-base text-navy">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 font-inter">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>(DEMO_DATA);
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      const d = res.data?.data ?? res.data;
      if (d?.labels && d?.orderCounts) {
        // Map backend real data into AnalyticsData shape
        const mapped: AnalyticsData = {
          totalGMV: d.summary?.totalRevenue ?? DEMO_DATA.totalGMV,
          ordersToday: d.orderCounts?.[d.orderCounts.length - 1] ?? DEMO_DATA.ordersToday,
          activeUsers: d.summary?.newUsersLast30Days ?? DEMO_DATA.activeUsers,
          groupBuySessions: DEMO_DATA.groupBuySessions,
          successRate: DEMO_DATA.successRate,
          avgOrderValue: d.summary?.totalOrders > 0 ? Math.round((d.summary?.totalRevenue ?? 0) / d.summary.totalOrders) : DEMO_DATA.avgOrderValue,
          revenueTrend: d.labels.map((label: string, i: number) => ({ date: label, revenue: d.revenues[i] ?? 0 })),
          ordersByDay: d.labels.map((label: string, i: number) => ({ day: label, orders: d.orderCounts[i] ?? 0 })),
          orderStatus: DEMO_DATA.orderStatus,
          userRegistrations: DEMO_DATA.userRegistrations,
        };
        setData(mapped);
        setUsingDemo(false);
      } else {
        setData(DEMO_DATA);
        setUsingDemo(true);
      }
    } catch {
      setData(DEMO_DATA);
      setUsingDemo(true);
      toast('Showing demo data — API unavailable', { icon: '📊' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statCards: StatCard[] = [
    {
      label: 'Total GMV',
      value: formatCurrency(data.totalGMV),
      change: '+12.4%',
      positive: true,
      icon: <DollarSign size={20} />,
      color: 'text-teal',
      bgColor: 'bg-teal/10',
    },
    {
      label: 'Orders Today',
      value: data.ordersToday.toLocaleString(),
      change: '+8.1%',
      positive: true,
      icon: <BarChart2 size={20} />,
      color: 'text-navy',
      bgColor: 'bg-navy/10',
    },
    {
      label: 'Active Users',
      value: data.activeUsers.toLocaleString(),
      change: '+5.3%',
      positive: true,
      icon: <Users size={20} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Group Buy Sessions',
      value: data.groupBuySessions.toLocaleString(),
      change: '+18.2%',
      positive: true,
      icon: <Activity size={20} />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Success Rate',
      value: `${data.successRate.toFixed(1)}%`,
      change: '+2.1%',
      positive: true,
      icon: <TrendingUp size={20} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(data.avgOrderValue),
      change: '+3.7%',
      positive: true,
      icon: <PieChartIcon size={20} />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5FEFE] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-artz text-2xl text-navy leading-tight">Platform Analytics</h1>
            <p className="text-sm text-gray-500 font-inter">
              {usingDemo && (
                <span className="text-orange-500 font-medium mr-1">Demo data •</span>
              )}
              Real-time platform performance metrics
            </p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-inter shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCardItem key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue Area Chart — 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Trend"
            subtitle="Last 30 days"
            icon={<TrendingUp size={18} />}
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#01B4BA" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#01B4BA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Area type="monotone" dataKey="revenue" stroke="#01B4BA" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#01B4BA' }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Orders by Day Bar */}
        <ChartCard title="Orders by Day" subtitle="This week" icon={<BarChart2 size={18} />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.ordersByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="#01406D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Order Status Pie */}
        <ChartCard title="Order Status" subtitle="Distribution" icon={<PieChartIcon size={18} />}>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={data.orderStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.orderStatus.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value)}%`, '']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 flex-1">
              {data.orderStatus.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 font-inter truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 font-inter">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* User Registrations Line — 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard title="New User Registrations" subtitle="Last 30 days" icon={<Users size={18} />}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.userRegistrations} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
