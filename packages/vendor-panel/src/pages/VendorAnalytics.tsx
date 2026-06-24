import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, RotateCcw, Loader2 } from 'lucide-react';
import api from '../api/client';

const VendorAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/vendor/analytics', { params: { period } })
      .then((res: any) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-main" /></div>;
  if (!data) return null;

  const stats = [
    { label: 'Total Sales', value: data.totalSales, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Revenue', value: `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Avg Order Value', value: `₹${(data.averageOrderValue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Return Rate', value: `${data.returnRate || 0}%`, icon: RotateCcw, color: 'bg-rose-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-xl text-slate-800">Analytics</h1>
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
            <div className={`w-10 h-10 rounded-xl ${s.color} bg-opacity-15 flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color.replace('bg-', 'text-')} />
            </div>
            <p className="font-inter text-xs text-slate-400">{s.label}</p>
            <p className="font-poppins font-extrabold text-xl text-slate-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-slate-100 rounded-2xl p-4 mb-6">
        <h3 className="font-poppins font-bold text-sm text-slate-700 mb-3">Daily Sales</h3>
        {Object.keys(data.dailySales || {}).length > 0 ? (
          <div className="flex items-end gap-2 h-32">
            {Object.entries(data.dailySales as Record<string, number>).map(([day, count]) => {
              const max = Math.max(...Object.values(data.dailySales as Record<string, number>), 1);
              const pct = (count as number) / max;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-inter text-slate-400">{count}</span>
                  <div className="w-full bg-primary-main/10 rounded-full" style={{ height: `${pct * 100}%`, minHeight: 4 }}>
                    <div className="bg-primary-main rounded-full h-full" style={{ height: `${pct * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-inter text-slate-400">{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-slate-400 text-center py-4">No sales data</p>}
      </div>

      <div className="border border-slate-100 rounded-2xl p-4">
        <h3 className="font-poppins font-bold text-sm text-slate-700 mb-3">Top Products</h3>
        {(data.topProducts || []).map((p: any, i: number) => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="font-inter text-xs text-slate-400 w-5">{i + 1}.</span>
              <span className="font-inter text-sm text-slate-700">{p.name}</span>
            </div>
            <span className="font-inter text-xs text-slate-500">{p.sales} sales · ₹{p.revenue.toLocaleString('en-IN')}</span>
          </div>
        ))}
        {(!data.topProducts || data.topProducts.length === 0) && <p className="text-sm text-slate-400 text-center py-4">No products yet</p>}
      </div>
    </div>
  );
};

export default VendorAnalytics;
