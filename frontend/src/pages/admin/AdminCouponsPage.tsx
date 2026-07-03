import React from 'react';
import { Tag, Plus, Settings } from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global discount codes applicable across all vendors.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-colors">
          <Plus className="h-5 w-5" />
          Create Global Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Discount Type</th>
                <th className="px-6 py-4 font-semibold">Sponsor</th>
                <th className="px-6 py-4 font-semibold">Valid Till</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <tr className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-500" />
                    <span className="font-bold text-gray-900 uppercase tracking-wide">FRESHAPP20</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700">20% off (Max ₹150)</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">PLATFORM</span>
                </td>
                <td className="px-6 py-4 text-gray-500">31 Dec, 2026</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full">ACTIVE</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                    <Settings className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
