import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, Download } from 'lucide-react';

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['#01B4BA', '#FF7A0F', '#6366f1', '#22c55e', '#ef4444', '#f59e0b'];

export const AdminReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [summary, setSummary] = useState({ totalGmv: 0, totalOrders: 0, activeUsers: 0, avgOrderValue: 0 });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [ordersSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'users')),
        ]);

        let gmv = 0;
        let orders = 0;
        const dailyMap: Record<string, { revenue: number; orders: number }> = {};
        const catMap: Record<string, number> = {};

        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'cancelled' || data.status === 'refunded') return;
          gmv += data.total || 0;
          orders++;

          const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          let key: string;
          if (period === 'daily') {
            key = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          } else if (period === 'weekly') {
            const weekStart = new Date(date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            key = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          } else {
            key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          }

          if (!dailyMap[key]) dailyMap[key] = { revenue: 0, orders: 0 };
          dailyMap[key].revenue += data.total || 0;
          dailyMap[key].orders += 1;

          if (data.items) {
            data.items.forEach((item: any) => {
              const cat = item.category || 'Other';
              catMap[cat] = (catMap[cat] || 0) + (item.price || 0) * (item.quantity || 1);
            });
          }
        });

        const chart = Object.entries(dailyMap)
          .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
          .slice(-14);

        const cats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }));

        const totalCatValue = cats.reduce((s, c) => s + c.value, 0);

        setChartData(chart);
        setCategoryData(cats.length > 0 ? cats : [{ name: 'Other', value: 1 }]);
        setSummary({
          totalGmv: gmv,
          totalOrders: orders,
          activeUsers: usersSnap.size,
          avgOrderValue: orders > 0 ? Math.round(gmv / orders) : 0,
        });
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [period]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Revenue', 'Orders'].join(','),
      ...chartData.map(d => [`"${d.date}"`, d.revenue, d.orders].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopsyy-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide metrics and performance insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-white border hover:bg-gray-50 px-4 py-2 rounded-xl font-medium shadow-sm transition-colors text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total GMV', value: `₹${(summary.totalGmv / 100000).toFixed(1)}L`, icon: DollarSign, trend: '+12.5%' },
          { label: 'Total Orders', value: summary.totalOrders.toLocaleString('en-IN'), icon: BarChart3, trend: '+8.2%' },
          { label: 'Active Users', value: summary.activeUsers.toLocaleString('en-IN'), icon: Users, trend: '+15.3%' },
          { label: 'Avg. Order Value', value: `₹${summary.avgOrderValue}`, icon: TrendingUp, trend: '+2.1%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {stat.trend} this period
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-primary">
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#878787', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#878787' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#01B4BA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue by Category</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`₹${Math.round(value).toLocaleString('en-IN')}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
