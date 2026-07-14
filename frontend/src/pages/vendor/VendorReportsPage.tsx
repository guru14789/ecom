import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FileDown, RefreshCw, BarChart3, TrendingUp, Landmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vendorApi } from '../../lib/api';

type ReportType = 'sales' | 'tax' | 'inventory';

export const VendorReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('sales');

  const reportOptions = [
    { id: 'sales' as ReportType, name: 'Sales Revenue Report', desc: 'Summarizes order counts, net revenue, and averages.', icon: TrendingUp },
    { id: 'tax' as ReportType, name: 'GST & Tax Report', desc: 'Prepares tax collected details and GST logs.', icon: Landmark },
    { id: 'inventory' as ReportType, name: 'Stock Performance', desc: 'Tracks sales volumes per SKU and low stock notices.', icon: BarChart3 },
  ];

  const { data: analyticsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor-analytics-reports'],
    queryFn: async () => {
      const res = await vendorApi.analytics();
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  // Map API daily sales to chart format
  const chartData = (() => {
    if (!analyticsData?.dailySales?.length) return [];

    // Group into 4 weeks
    const grouped: Record<string, { sales: number; taxes: number; itemsSold: number }> = {};
    analyticsData.dailySales.forEach((day: any, idx: number) => {
      const weekLabel = `Week ${Math.floor(idx / 7) + 1}`;
      if (!grouped[weekLabel]) grouped[weekLabel] = { sales: 0, taxes: 0, itemsSold: 0 };
      grouped[weekLabel].sales += day.sales || 0;
      grouped[weekLabel].taxes += (day.sales || 0) * 0.18; // GST 18%
      grouped[weekLabel].itemsSold += day.orders || 0;
    });

    return Object.entries(grouped).map(([date, vals]) => ({
      date,
      sales: Math.round(vals.sales),
      taxes: Math.round(vals.taxes),
      itemsSold: vals.itemsSold,
    }));
  })();

  const topProducts = analyticsData?.topProducts || [];

  const handleExport = () => {
    if (!chartData.length) {
      toast.error('No data to export');
      return;
    }

    const headers =
      reportType === 'sales' ? ['Period', 'Sales (INR)', 'Orders'] :
      reportType === 'tax' ? ['Period', 'Total Sales', 'GST Collected (18%)'] :
      ['Rank', 'Product Name', 'Units Sold', 'Revenue'];

    const rows = reportType === 'inventory'
      ? topProducts.map((p: any, i: number) => [i + 1, p.name, p.salesCount, p.revenue])
      : chartData.map(d =>
          reportType === 'sales' ? [d.date, d.sales, d.itemsSold] : [d.date, d.sales, d.taxes]
        );

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `shopsyy_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Reports & Analytics Export</h1>
          <p className="text-sm text-gray-500 mt-1">Download raw spreadsheet metrics, view sales charts, and review accounts.</p>
        </div>
        {isLoading && <RefreshCw className="w-5 h-5 text-gray-400 animate-spin relative z-10" />}
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-medium">
          Failed to load analytics. <button className="underline font-bold" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {/* Summary KPIs */}
      {analyticsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: analyticsData.totalOrders || 0, format: (v: number) => v.toString() },
            { label: 'Total Revenue', value: analyticsData.totalRevenue || 0, format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
            { label: 'Total Products', value: analyticsData.totalProducts || 0, format: (v: number) => v.toString() },
            { label: 'Avg Order Value', value: analyticsData.totalOrders ? (analyticsData.totalRevenue / analyticsData.totalOrders) : 0, format: (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}` },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white p-5 rounded-[2rem] border shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-black text-blue-950 mt-1">{kpi.format(kpi.value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Types List */}
        <div className="space-y-4">
          {reportOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = reportType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setReportType(opt.id)}
                className={`p-5 rounded-[2rem] border cursor-pointer transition-all flex items-start gap-4 ${
                  isSelected ? 'border-orange-500 bg-orange-50/10 shadow-sm' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-950 text-sm">{opt.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart and Export */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-gray-900 capitalize">{reportType} Performance Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isLoading ? 'Loading real data...' : `${chartData.length > 0 ? 'Showing last 30 days from your orders' : 'No data available yet'}`}
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={!chartData.length || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">No sales data yet</p>
                <p className="text-xs mt-1">Data will appear here once you have orders.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'tax' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Bar dataKey="taxes" fill="#f97316" radius={[4, 4, 0, 0]} name="GST Collected" />
                  </BarChart>
                ) : reportType === 'inventory' ? (
                  <BarChart data={topProducts.map((p: any) => ({ name: p.name?.slice(0, 12), units: p.salesCount }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Units Sold" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products table for inventory view */}
          {reportType === 'inventory' && topProducts.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-bold text-gray-800 mb-3">Top Products by Revenue</h4>
              <table className="w-full text-xs">
                <thead className="text-gray-500">
                  <tr>
                    <th className="text-left pb-2">Product</th>
                    <th className="text-right pb-2">Units Sold</th>
                    <th className="text-right pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 font-medium text-gray-800">{p.name}</td>
                      <td className="py-2 text-right text-gray-600">{p.salesCount}</td>
                      <td className="py-2 text-right font-bold text-orange-600">₹{p.revenue?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
