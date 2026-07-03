import React from 'react';
import { Tag, Plus, MoreVertical } from 'lucide-react';

export const VendorCouponsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage promotional codes for your store.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-colors">
          <Plus className="h-5 w-5" />
          Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Discount</th>
                <th className="px-6 py-4 font-semibold">Usage Limit</th>
                <th className="px-6 py-4 font-semibold">Valid Till</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <tr className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="font-bold text-gray-900 uppercase tracking-wide">WELCOME50</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700">50% off (Max ₹100)</td>
                <td className="px-6 py-4 text-gray-500">14 / 100 used</td>
                <td className="px-6 py-4 text-gray-500">31 Dec, 2026</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full">ACTIVE</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="font-bold text-gray-900 uppercase tracking-wide line-through text-gray-400">DIWALI20</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-400">20% off (Max ₹200)</td>
                <td className="px-6 py-4 text-gray-400">500 / 500 used</td>
                <td className="px-6 py-4 text-gray-400">12 Nov, 2025</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full">EXPIRED</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="h-4 w-4" />
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
