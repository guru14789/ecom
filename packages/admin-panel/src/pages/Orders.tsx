import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Order {
  _id: string;
  user?: { name?: string; email?: string };
  items?: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  createdAt: string;
}

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/orders?${params}`);
      setOrders(res.data.data);
      setTotalPages(res.data.pagination.pages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const filtered = orders.filter((o) =>
    o._id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Order Management</h1>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-teal font-semibold hover:underline">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-4 px-4 font-semibold text-slate-600">Order ID</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-600">Customer</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-600">Items</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-600">Total</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-600">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-slate-600">Date</th>
                <th className="text-right py-4 px-4 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-4 px-4 font-mono text-xs text-navy font-medium">#{order._id?.slice(-8)}</td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-slate-800">{order.user?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{order.user?.email}</p>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{order.items?.length || 0} items</td>
                  <td className="py-4 px-4 font-semibold">₹{order.total?.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                      order.status === 'confirmed' ? 'bg-teal/10 text-teal' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="relative group inline-block">
                      <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy px-3 py-1.5 rounded-lg hover:bg-slate-50">
                        Update <ChevronDown size={12} />
                      </button>
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        {statuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order._id, s)}
                            disabled={s === order.status}
                            className="block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-slate-600 hover:text-navy disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm text-slate-600 hover:text-navy disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
