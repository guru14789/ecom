import React, { useState } from 'react';
import { Search, MoreVertical, CheckCircle, XCircle, Store } from 'lucide-react';
import type { Vendor } from '../../types';

const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    userId: 'u2',
    storeName: 'FreshMart Super Store',
    storeSlug: 'freshmart-super-store',
    logo: '',
    banner: '',
    description: 'Fresh groceries and daily essentials.',
    category: 'Grocery',
    tags: ['grocery', 'fresh'],
    address: { lat: 0, lng: 0, formatted: 'HSR Layout, Bangalore', pincode: '560102' },
    deliveryRadiusKm: 5,
    minOrderValue: 100,
    avgDeliveryMins: 12,
    isOpen: true,
    isApproved: true,
    isActive: true,
    rating: 4.8,
    totalOrders: 1450,
    totalRevenue: 540000,
  },
  {
    id: 'v2',
    userId: 'u3',
    storeName: 'Organic Greens',
    storeSlug: 'organic-greens',
    logo: '',
    banner: '',
    description: '100% organic fruits and vegetables.',
    category: 'Fruits & Veggies',
    tags: ['organic', 'fruits', 'vegetables'],
    address: { lat: 0, lng: 0, formatted: 'Koramangala, Bangalore', pincode: '560034' },
    deliveryRadiusKm: 3,
    minOrderValue: 200,
    avgDeliveryMins: 15,
    isOpen: false,
    isApproved: false,
    isActive: false,
    rating: 0,
    totalOrders: 0,
    totalRevenue: 0,
  }
];

export const AdminVendorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Vendors Directory</h2>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by store name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <select className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Store</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-right">Orders</th>
                <th className="px-6 py-4 font-medium text-right">Revenue</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_VENDORS.map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                        <Store className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-gray-900 truncate">{vendor.storeName}</p>
                        <p className="text-gray-500 text-xs truncate">{vendor.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{vendor.address.formatted}</td>
                  <td className="px-6 py-4 text-right font-medium">{vendor.totalOrders.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-right font-medium">₹{(vendor.totalRevenue/1000).toFixed(1)}k</td>
                  <td className="px-6 py-4">
                    {!vendor.isApproved ? (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-medium">Pending Review</span>
                    ) : vendor.isActive ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Active</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">Suspended</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!vendor.isApproved ? (
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors" title="Approve">
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Reject">
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
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
