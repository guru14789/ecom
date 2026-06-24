import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';

const ReportsDashboard: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [salesData, setSalesData] = useState<any>({ labels: [], revenue: [], orders: [] });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesRes, catRes, finRes] = await Promise.all([
        api.get('/admin/reports/sales', { params: { period } }),
        api.get('/admin/reports/top-categories'),
        api.get('/admin/reports/financial'),
      ]);
      setSalesData(salesRes.data.data || { labels: [], revenue: [], orders: [] });
      setCategoryData(catRes.data.data || []);
      setFinancialData(finRes.data.data || null);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [period]);

  const COLORS = ['#01B4BA', '#01406D', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#F97316'];

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Reports Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20">
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Financial Summary */}
      {financialData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-slate-500 uppercase">GMV</span><DollarSign size={16} className="text-teal" /></div>
            <p className="text-xl font-bold text-slate-800">₹{financialData.gmv?.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-slate-500 uppercase">Net Revenue</span><TrendingUp size={16} className="text-green-500" /></div>
            <p className="text-xl font-bold text-green-600">₹{financialData.netRevenue?.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-slate-500 uppercase">Commission</span><BarChart3 size={16} className="text-blue-500" /></div>
            <p className="text-xl font-bold text-blue-600">₹{financialData.commission?.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-slate-500 uppercase">PG Costs</span><ShoppingCart size={16} className="text-amber-500" /></div>
            <p className="text-xl font-bold text-amber-600">₹{financialData.pgCosts?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-artz font-bold text-navy mb-4">Sales Trend</h3>
          {salesData.labels?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData.labels.map((l: string, i: number) => ({ name: l, revenue: salesData.revenue[i], orders: salesData.orders[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#01B4BA" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="orders" stroke="#01406D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No data for this period</p>}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-artz font-bold text-navy mb-4">Revenue by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData.slice(0, 6)} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {categoryData.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-8">No category data</p>}
          <div className="mt-3 space-y-1">
            {categoryData.slice(0, 6).map((cat: any, i: number) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{cat.name}</div>
                <span className="font-semibold">₹{cat.revenue?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
