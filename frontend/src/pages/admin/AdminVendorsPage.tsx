import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Search, MoreVertical, CheckCircle, XCircle, Store, Eye, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Vendor } from '../../types';

export const AdminVendorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const queryClient = useQueryClient();

  const { data: vendorsResponse, isLoading: loading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const res = await adminApi.vendors.list();
      return res.data as Vendor[];
    }
  });

  const vendors = vendorsResponse || [];

  const handleApprove = async (vendorId: string) => {
    try {
      await adminApi.vendors.approve(vendorId);
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendor approved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve vendor');
    }
  };

  const handleReject = async (vendorId: string) => {
    try {
      await adminApi.vendors.reject(vendorId);
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendor rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject vendor');
    }
  };

  const handleToggleActive = async (vendor: Vendor) => {
    try {
      await adminApi.vendors.toggleActive(vendor.id, !vendor.isActive);
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success(`Vendor ${vendor.isActive ? 'suspended' : 'activated'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vendor');
    }
  };

  const getTrustScoreColor = (score = 0) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.storeSlug?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'pending') return matchesSearch && !v.isApproved;
    if (statusFilter === 'active') return matchesSearch && v.isApproved && v.isActive;
    if (statusFilter === 'suspended') return matchesSearch && v.isApproved && !v.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-blue-950 tracking-tight">Vendors Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and approve platform sellers.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3 relative z-10">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by store name..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Store</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Location</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-center">Trust Score</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading vendors...</td></tr>
              ) : filteredVendors.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No vendors found</td></tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                          {vendor.logo ? <img src={vendor.logo} className="w-full h-full object-cover rounded" /> : <Store className="h-5 w-5 text-gray-400" />}
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-medium text-gray-900 truncate">{vendor.storeName}</p>
                          <p className="text-gray-500 text-xs truncate">@{vendor.storeSlug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vendor.category}</td>
                    <td className="px-6 py-4 text-gray-600">{vendor.address?.formatted}</td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border ${getTrustScoreColor(vendor.trustScore)}`}>
                        {vendor.trustScore || 0} / 100
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {!vendor.isApproved ? (
                        <span className="bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold shadow-sm">Pending Review</span>
                      ) : vendor.isActive ? (
                        <span className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold shadow-sm">Active</span>
                      ) : (
                        <span className="bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border border-rose-200 text-xs px-3 py-1 rounded-full font-bold shadow-sm">Suspended</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedVendor(vendor)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        {!vendor.isApproved ? (
                          <>
                            <button onClick={() => handleApprove(vendor.id)}
                              className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors" title="Approve">
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleReject(vendor.id)}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Reject">
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleToggleActive(vendor)}
                            className={`p-1.5 rounded transition-colors ${vendor.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={vendor.isActive ? 'Suspend' : 'Activate'}>
                            {vendor.isActive ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVendor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVendor(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {selectedVendor.logo ? <img src={selectedVendor.logo} className="w-full h-full object-cover" /> : <Store className="h-8 w-8 text-gray-400" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-blue-950">{selectedVendor.storeName}</h3>
                <p className="text-sm text-gray-500">@{selectedVendor.storeSlug}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">Category:</span> <span className="font-medium">{selectedVendor.category}</span></div>
                <div><span className="text-gray-500">Trust Score:</span> <span className="font-medium">{selectedVendor.trustScore || 0}/100</span></div>
                <div><span className="text-gray-500">Total Orders:</span> <span className="font-medium">{selectedVendor.totalOrders || 0}</span></div>
                <div><span className="text-gray-500">Revenue:</span> <span className="font-medium">₹{(selectedVendor.totalRevenue || 0).toLocaleString('en-IN')}</span></div>
              </div>
              <div className="pt-4 border-t mt-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /> Verification Status</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedVendor.mobileVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    <span className={selectedVendor.mobileVerified ? 'text-gray-900' : 'text-gray-400'}>Mobile Auth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedVendor.gstVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    <span className={selectedVendor.gstVerified ? 'text-gray-900' : 'text-gray-400'}>GST Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedVendor.panVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    <span className={selectedVendor.panVerified ? 'text-gray-900' : 'text-gray-400'}>PAN Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedVendor.bankVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    <span className={selectedVendor.bankVerified ? 'text-gray-900' : 'text-gray-400'}>Penny Drop</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    {selectedVendor.digilockerVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    <span className={selectedVendor.digilockerVerified ? 'text-gray-900' : 'text-gray-400'}>DigiLocker OAuth (Govt.)</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t">
                <span className="text-gray-500">Description:</span>
                <p className="text-gray-700 mt-1">{selectedVendor.description || 'No description'}</p>
              </div>
              <div>
                <span className="text-gray-500">Address:</span>
                <p className="text-gray-700">{selectedVendor.address?.formatted || 'N/A'}</p>
              </div>
            </div>
            <button onClick={() => setSelectedVendor(null)}
              className="mt-6 w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
