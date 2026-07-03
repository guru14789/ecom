import React from 'react';
import { PackageSearch, Filter, CheckCircle, XCircle } from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Products</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage the master catalogue across all vendors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-white border hover:bg-gray-50 px-4 py-2 rounded-xl font-medium shadow-sm transition-colors text-sm">
            <Filter className="h-4 w-4" />
            Filter Status
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Vendor</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <PackageSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block leading-tight">Test Product {i}</span>
                        <span className="text-xs text-gray-500">{i * 200}g Unit</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600 hover:underline cursor-pointer">
                    FreshMart {i}
                  </td>
                  <td className="px-6 py-4 text-gray-600">Dairy & Breakfast</td>
                  <td className="px-6 py-4 font-bold text-gray-900">₹{i * 150}</td>
                  <td className="px-6 py-4">
                    {i === 1 ? (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full">PENDING</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full">APPROVED</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {i === 1 ? (
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
