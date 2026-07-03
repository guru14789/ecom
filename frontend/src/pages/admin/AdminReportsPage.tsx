import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
// Note: Normally we'd import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// For this static mock, we'll build a CSS representation to avoid new dependencies if recharts isn't installed.

export const AdminReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide metrics and performance insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total GMV', value: '₹4.2M', icon: DollarSign, trend: '+12.5%' },
          { label: 'Total Orders', value: '24,593', icon: BarChart3, trend: '+8.2%' },
          { label: 'Active Users', value: '12,400', icon: Users, trend: '+15.3%' },
          { label: 'Avg. Order Value', value: '₹170', icon: TrendingUp, trend: '+2.1%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {stat.trend} this month
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-primary">
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Mock Chart Area */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview (Last 7 Days)</h2>
        <div className="h-64 w-full flex items-end justify-between gap-2 px-2">
          {/* CSS Mock Bar Chart */}
          {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
            <div key={i} className="w-full bg-gray-50 rounded-t-lg relative group flex flex-col justify-end h-full">
              <div 
                className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-lg"
                style={{ height: `${height}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                  ₹{(height * 1000).toLocaleString()}
                </div>
              </div>
              <div className="absolute -bottom-6 w-full text-center text-xs text-gray-500 font-medium">
                Day {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
