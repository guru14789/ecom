import React from 'react';
import { IndianRupee, Store, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PLATFORM_DATA = [
  { name: '1st', gmv: 45000 },
  { name: '5th', gmv: 52000 },
  { name: '10th', gmv: 48000 },
  { name: '15th', gmv: 61000 },
  { name: '20th', gmv: 59000 },
  { name: '25th', gmv: 75000 },
  { name: '30th', gmv: 82000 },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Platform KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-600">Total GMV (Month)</h3>
            <div className="p-2 bg-green-50 text-primary rounded-lg"><IndianRupee className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">₹4,22,450</div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="h-4 w-4" /> +18.2% vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-600">Active Vendors</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Store className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">124</div>
          <p className="text-sm text-gray-500 mt-2">12 pending approval</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-600">Total Buyers</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">12,845</div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="h-4 w-4" /> +432 new this week
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-600">Live Orders</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ShoppingCart className="h-5 w-5" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">42</div>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Real-time tracking
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6 text-lg">Platform GMV Trend</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PLATFORM_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'GMV']}
              />
              <Line 
                type="monotone" 
                dataKey="gmv" 
                stroke="#01B4BA" 
                strokeWidth={4} 
                dot={{ fill: '#01B4BA', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 8, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
