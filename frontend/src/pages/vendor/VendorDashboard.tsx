import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  IndianRupee, ShoppingBag, TrendingUp, TrendingDown, Package, AlertTriangle,
  RotateCcw, Bell, Wallet, Plus, Upload, Megaphone, FileText, ChevronRight,
  BarChart2, Star, Loader2, ArrowUpRight,
} from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:           'bg-yellow-100 text-yellow-700',
  confirmed:         'bg-blue-100 text-blue-700',
  packed:            'bg-indigo-100 text-indigo-700',
  shipped:           'bg-purple-100 text-purple-700',
  out_for_delivery:  'bg-cyan-100 text-cyan-700',
  delivered:         'bg-green-100 text-green-700',
  cancelled:         'bg-red-100 text-red-700',
  return_requested:  'bg-orange-100 text-orange-700',
  returned:          'bg-gray-100 text-gray-700',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  trend?: number; to?: string;
}> = ({ title, value, sub, icon: Icon, iconBg, iconColor, trend, to }) => {
  const content = (
    <div className="bg-white p-5 rounded-[2rem] border shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2.5 ${iconBg} rounded-xl`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <div className="text-2xl font-black text-blue-950 mb-1">{value}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}% from yesterday
        </div>
      )}
      {sub && !trend && <p className="text-xs text-gray-500">{sub}</p>}
      {to && <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors absolute bottom-4 right-4" />}
    </div>
  );
  return to ? <Link to={to} className="relative block">{content}</Link> : <div className="relative">{content}</div>;
};

// ─── Quick Action ─────────────────────────────────────────────────────────────
const QuickAction: React.FC<{ to: string; icon: React.ElementType; label: string; color: string }> = ({ to, icon: Icon, label, color }) => (
  <Link to={to}
    className={`flex flex-col items-center gap-2 p-4 rounded-[2rem] border bg-white hover:shadow-md hover:border-orange-200 transition-all group text-center`}>
    <div className={`p-3 ${color} rounded-xl group-hover:scale-110 transition-transform`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <span className="text-xs font-bold text-gray-700">{label}</span>
  </Link>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () => vendorApi.dashboard(),
    refetchInterval: 60_000, // auto-refresh every minute
    staleTime: 30_000,
  });

  const d = (data as any)?.data;
  const kpis = d?.kpis;
  const chartData = d?.chartData || [];
  const recentOrders = d?.recentOrders || [];
  const topProducts = d?.topProducts || [];
  const ordersByStatus = d?.ordersByStatus || {};
  const sub = d?.subscription;

  const fmt = (n: number) => n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

  const periodRevenue = period === 'today' ? kpis?.todayRevenue : period === 'week' ? kpis?.weekRevenue : kpis?.monthRevenue;
  const periodOrders = period === 'today' ? kpis?.todayOrders : period === 'week' ? kpis?.weekOrders : kpis?.monthOrders;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <div className="text-center">
          <p className="font-bold text-gray-900">Failed to load dashboard</p>
          <p className="text-sm text-gray-500 mt-1">Please check your connection</p>
        </div>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="bg-gray-100 rounded-xl p-1 flex text-xs font-bold">
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                {p === 'today' ? 'Today' : p === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
          {/* Notification Bell */}
          <Link to="/vendor/notifications" className="relative p-2.5 bg-white border rounded-xl hover:border-primary transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            {kpis?.unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {kpis.unreadNotifications > 9 ? '9+' : kpis.unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Subscription Alert */}
      {sub && sub.tier === 'basic' && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 flex items-center justify-between text-white">
          <div>
            <p className="font-bold">You're on the Free plan</p>
            <p className="text-xs text-white/70 mt-0.5">Upgrade to Pro to list up to 100 products and unlock analytics</p>
          </div>
          <button onClick={() => navigate('/vendor/subscription')}
            className="shrink-0 bg-white text-indigo-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-white/90 transition-colors">
            Upgrade →
          </button>
        </div>
      )}

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title={`${period === 'today' ? "Today's" : period === 'week' ? '7-Day' : 'Monthly'} Revenue`}
            value={fmt(periodRevenue || 0)} trend={period === 'today' ? kpis?.revenueTrend : undefined}
            icon={IndianRupee} iconBg="bg-green-50" iconColor="text-green-600" to="/vendor/analytics" />
          <KpiCard title={`${period === 'today' ? "Today's" : period === 'week' ? '7-Day' : 'Monthly'} Orders`}
            value={periodOrders || 0}
            icon={ShoppingBag} iconBg="bg-blue-50" iconColor="text-blue-600" to="/vendor/orders" />
          <KpiCard title="Total Products" value={kpis?.totalProducts || 0}
            sub={`${kpis?.activeProducts || 0} active`}
            icon={Package} iconBg="bg-purple-50" iconColor="text-purple-600" to="/vendor/products" />
          <KpiCard title="Wallet Balance" value={fmt(kpis?.walletBalance || 0)}
            sub={`₹${kpis?.pendingPayouts || 0} pending`}
            icon={Wallet} iconBg="bg-amber-50" iconColor="text-amber-600" to="/vendor/finance" />
          <KpiCard title="Low Stock" value={kpis?.lowStockProducts || 0} sub="Products need restocking"
            icon={AlertTriangle} iconBg="bg-orange-50" iconColor="text-orange-600" to="/vendor/inventory" />
          <KpiCard title="Out of Stock" value={kpis?.outOfStockProducts || 0} sub="Items unavailable"
            icon={Package} iconBg="bg-red-50" iconColor="text-red-600" to="/vendor/inventory" />
          <KpiCard title="Total Earnings" value={fmt(kpis?.totalEarnings || 0)} sub="All-time settled"
            icon={TrendingUp} iconBg="bg-teal-50" iconColor="text-teal-600" to="/vendor/finance" />
          <KpiCard title="Notifications" value={kpis?.unreadNotifications || 0} sub="Unread messages"
            icon={Bell} iconBg="bg-indigo-50" iconColor="text-indigo-600" to="/vendor/notifications" />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-blue-950">Revenue & Orders (Last 7 days)</h3>
            <Link to="/vendor/analytics" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              Full Report <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number, name: string) => [
                    name === 'revenue' ? `₹${v.toLocaleString('en-IN')}` : v,
                    name === 'revenue' ? 'Revenue' : 'Orders',
                  ]} />
                <Line type="monotone" dataKey="revenue" stroke="#01B4BA" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#01B4BA' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="orders" stroke="#FF7A0F" strokeWidth={2}
                  dot={{ r: 3, fill: '#FF7A0F' }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <h3 className="font-black text-blue-950 mb-5">Orders by Status</h3>
          {isLoading ? <Skeleton className="h-64" /> : (
            Object.keys(ordersByStatus).length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <ShoppingBag className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(ordersByStatus).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 6).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <div className="flex items-center gap-2 flex-1 ml-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((count as number) / Object.values(ordersByStatus).reduce((a: any, b: any) => a + b, 0)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-black text-gray-700 w-6 text-right">{count as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <h3 className="font-black text-blue-950 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <QuickAction to="/vendor/products/new" icon={Plus} label="Add Product" color="bg-primary" />
          <QuickAction to="/vendor/bulk-upload" icon={Upload} label="Bulk Upload" color="bg-blue-500" />
          <QuickAction to="/vendor/inventory" icon={Package} label="Inventory" color="bg-purple-500" />
          <QuickAction to="/vendor/orders" icon={ShoppingBag} label="Orders" color="bg-orange-500" />
          <QuickAction to="/vendor/coupons" icon={BarChart2} label="Coupons" color="bg-green-500" />
          <QuickAction to="/vendor/advertising" icon={Megaphone} label="Ads" color="bg-rose-500" />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-blue-950">Recent Orders</h3>
            <Link to="/vendor/orders" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
              <p className="text-xs text-gray-300 mt-1">They'll appear here once buyers place orders</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order: any) => (
                <Link key={order.id} to={`/vendor/orders`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                  <div>
                    <p className="font-bold text-sm text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{order.itemCount} items</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-xs font-black text-gray-900 mt-1">₹{order.total?.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-blue-950">Top Products</h3>
            <Link to="/vendor/products" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              All Products <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : topProducts.length === 0 ? (
            <div className="py-10 text-center">
              <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No sales data yet</p>
              <Link to="/vendor/products/new" className="text-xs text-primary font-bold mt-1 hover:underline block">
                Add your first product →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl">
                  <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-black text-gray-500">
                    {i + 1}
                  </div>
                  {p.image && <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                  </div>
                  <p className="text-sm font-black text-gray-900">{fmt(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
