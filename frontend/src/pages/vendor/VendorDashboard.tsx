import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { IndianRupee, ShoppingBag, TrendingUp, Users } from 'lucide-react';

const REVENUE_DATA = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

const ORDER_DATA = [
  { name: 'Mon', orders: 40 },
  { name: 'Tue', orders: 30 },
  { name: 'Wed', orders: 20 },
  { name: 'Thu', orders: 27 },
  { name: 'Fri', orders: 18 },
  { name: 'Sat', orders: 23 },
  { name: 'Sun', orders: 34 },
];

export const VendorDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-500">Today's Revenue</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><IndianRupee className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900">₹12,450</div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +14.5% from yesterday
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-500">Today's Orders</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShoppingBag className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900">142</div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +5.2% from yesterday
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-500">Active Customers</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900">89</div>
          <p className="text-sm text-gray-500 mt-2">Unique buyers today</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-500">Avg. Order Value</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><IndianRupee className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-bold text-gray-900">₹345</div>
          <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4 rotate-180" /> -2.1% from yesterday
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#878787' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#878787' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#01B4BA" strokeWidth={3} dot={{ fill: '#01B4BA', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Orders Volume (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ORDER_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#878787' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#878787' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F8F8F8' }}
                />
                <Bar dataKey="orders" fill="#FF7A0F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
