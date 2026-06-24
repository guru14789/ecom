import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, ShoppingBag, Loader2 } from 'lucide-react';
import api from '../api/client';

const Reports: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/analytics', { params: { period } })
      .then((res: any) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-main" /></div>;

  const stats = [
    { label: 'GMV', value: `₹${(data?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Orders', value: data?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Users', value: data?.totalUsers || 0, icon: Users, color: 'text-purple-500' },
    { label: 'Avg Order', value: `₹${(data?.averageOrderValue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-orange-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-xl text-slate-800">Reports</h1>
        <div className="flex gap-1">
          {['week', 'month', 'year'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs font-poppins font-bold px-3 py-1.5 rounded-xl capitalize transition-all ${period === p ? 'bg-primary-main text-white' : 'bg-slate-100 text-slate-600'}`}
            >{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-inter text-xs text-slate-400">{s.label}</p>
              <BarChart3 size={16} className={s.color} />
            </div>
            <p className="font-poppins font-extrabold text-xl text-slate-800">{typeof s.value === 'number' ? s.value.toLocaleString('en-IN') : s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-slate-100 rounded-2xl p-4">
          <h3 className="font-poppins font-bold text-sm text-slate-700 mb-3">Top Categories</h3>
          {(data?.topCategories || []).map((c: any, i: number) => (
            <div key={c._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="font-inter text-sm text-slate-700">{c._id}</span>
              <span className="font-inter text-xs text-slate-500">{c.count} orders · ₹{c.revenue.toLocaleString('en-IN')}</span>
            </div>
          ))}
          {(!data?.topCategories || data.topCategories.length === 0) && <p className="text-center text-slate-400 py-4 text-sm">No data</p>}
        </div>

        <div className="border border-slate-100 rounded-2xl p-4">
          <h3 className="font-poppins font-bold text-sm text-slate-700 mb-3">Top Vendors</h3>
          {(data?.topVendors || []).map((v: any, i: number) => (
            <div key={v._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-inter text-xs text-slate-400 w-5">{i + 1}.</span>
                <span className="font-inter text-sm text-slate-700">{v.name}</span>
              </div>
              <span className="font-inter text-xs text-slate-500">₹{v.revenue.toLocaleString('en-IN')}</span>
            </div>
          ))}
          {(!data?.topVendors || data.topVendors.length === 0) && <p className="text-center text-slate-400 py-4 text-sm">No data</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
