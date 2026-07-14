import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Search, User, Mail, Calendar, ShieldCheck, Phone } from 'lucide-react';
import type { User as AppUser } from '../../types';

export const AdminBuyersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: buyersResponse, isLoading: loading } = useQuery({
    queryKey: ['admin-buyers'],
    queryFn: async () => {
      const res = await adminApi.users.list();
      return res.data;
    }
  });

  const buyers = (buyersResponse as AppUser[])?.filter(u => u.role === 'buyer') || [];

  const filtered = buyers.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      b.displayName?.toLowerCase().includes(term) ||
      b.email?.toLowerCase().includes(term) ||
      b.phone?.includes(term)
    );
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Buyers Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage registered users on the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email or phone..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-none rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm" />
          </div>
          <div className="text-sm text-gray-500 font-bold bg-white px-3 py-1 rounded-lg border shadow-sm">{filtered.length} buyers</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Contact Info</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading buyers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No buyers found</td></tr>
              ) : (
                filtered.map((buyer) => (
                  <tr key={buyer.uid} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold overflow-hidden shrink-0">
                          {buyer.photoURL ? (
                            <img src={buyer.photoURL} className="w-full h-full object-cover" />
                          ) : (
                            buyer.displayName?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{buyer.displayName || 'Anonymous User'}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">ID: {buyer.uid?.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        {buyer.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {buyer.email}</div>}
                        {buyer.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {buyer.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                        <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(buyer.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
