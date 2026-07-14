import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Search, CreditCard, Clock, CheckCircle, XCircle, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminTransactionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await adminApi.orders.list();
      return res.data;
    }
  });

  const orders = ordersData || [];

  const handleReleasePayment = async (orderId: string) => {
    if (!confirm('Are you sure you want to release the payment to the vendor?')) return;
    try {
      await adminApi.orders.releasePayment(orderId);
      toast.success('Payment successfully released to vendor.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to release payment');
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order to the buyer? This action cannot be undone.')) return;
    try {
      await adminApi.orders.refund(orderId);
      toast.success('Payment successfully refunded to buyer.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to refund payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">PAID</span>;
      case 'pending':
        return <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full font-bold">PENDING</span>;
      case 'refunded':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full font-bold">REFUNDED</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-bold">FAILED</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full font-bold">{status?.toUpperCase() || 'UNKNOWN'}</span>;
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'pending') return matchesSearch && order.paymentStatus === 'pending';
    if (filter === 'paid') return matchesSearch && order.paymentStatus === 'paid';
    if (filter === 'refunded') return matchesSearch && order.paymentStatus === 'refunded';
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Transactions Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Resolve payment issues, issue refunds, and release payouts.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search Order ID..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
            <option value="all">All Transactions</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Settled / Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Total Amount</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold text-center">Payment Status</th>
                <th className="px-6 py-4 font-bold text-center">Order Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading transactions...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">No transactions found</h3>
                    <p className="text-gray-500">No orders match your current filters.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-950 block">{order.id}</span>
                      <span className="text-xs text-gray-500">Buyer: {order.userId.slice(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-gray-900">₹{order.total?.toLocaleString('en-IN') || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium uppercase text-xs">
                      {order.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.paymentStatus === 'pending' || order.paymentStatus === 'paid' ? (
                          <button onClick={() => handleRefund(order.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1">
                            <RefreshCcw className="w-3 h-3" /> Refund
                          </button>
                        ) : null}
                        
                        {order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' && (
                          <button onClick={() => handleReleasePayment(order.id)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Release
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
    </div>
  );
};
