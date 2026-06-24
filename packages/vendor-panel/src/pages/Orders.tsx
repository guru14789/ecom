import React, { useEffect, useState } from 'react';
import { Search, Eye, Truck, ShoppingCart, ChevronLeft, ChevronRight, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Order {
  _id: string;
  userId: string;
  items: any[];
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  deliveryAddress?: any;
  trackingId?: string;
  timeline?: any[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-600',
  processing: 'bg-amber-50 text-amber-600',
  packed: 'bg-purple-50 text-purple-600',
  shipped: 'bg-teal-50 text-teal',
  out_for_delivery: 'bg-cyan-50 text-cyan-600',
  delivered: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-red-50 text-red-500',
  return_requested: 'bg-orange-50 text-orange-600',
  returned: 'bg-rose-50 text-rose-600',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/vendor/orders', { params });
      setOrders(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'shipped') {
        body.trackingId = 'TRK' + Date.now().toString(36).toUpperCase();
      }
      await api.put(`/vendor/orders/${orderId}/status`, body);
      toast.success(`Order ${newStatus}`);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter((o) =>
    o._id.toLowerCase().includes(search.toLowerCase())
  );

  const nextStatus = (status: string): string | null => {
    const flow: Record<string, string> = {
      confirmed: 'processing',
      processing: 'packed',
      packed: 'shipped',
      shipped: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    return flow[status] || null;
  };

  return (
    <div>
      <h1 className="text-2xl font-artz font-bold text-navy mb-6">Orders</h1>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === s ? 'bg-navy text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Order ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Items</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400"><ShoppingCart size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No orders found</p></td></tr>
            ) : (
              filtered.map((o) => (
                <tr key={o._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-navy">#{o._id.slice(-8)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 text-sm font-semibold">₹{o.total?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 uppercase">{o.paymentMethod || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-slate-100'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedOrder(o)} className="p-2 hover:bg-slate-100 rounded-lg"><Eye size={14} className="text-slate-400" /></button>
                    {nextStatus(o.status) && (
                      <button onClick={() => handleStatusUpdate(o._id, nextStatus(o.status)!)} disabled={updating} className="p-2 hover:bg-teal-50 rounded-lg"><Truck size={14} className="text-teal" /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-artz font-bold text-navy">Order #{selectedOrder._id.slice(-8)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[selectedOrder.status] || 'bg-slate-100'}`}>{selectedOrder.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold">₹{selectedOrder.total?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Payment</span>
                <span className="text-xs uppercase">{selectedOrder.paymentMethod || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="text-xs">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              {selectedOrder.trackingId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tracking</span>
                  <span className="text-xs font-mono">{selectedOrder.trackingId}</span>
                </div>
              )}
              {selectedOrder.deliveryAddress && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Delivery Address</p>
                  <p className="text-sm text-slate-700">
                    {selectedOrder.deliveryAddress.houseNo}, {selectedOrder.deliveryAddress.area}<br />
                    {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                  </p>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Items ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{item.productSnapshot?.name || item.productId} x{item.quantity || 1}</span>
                      <span className="font-medium">₹{item.totalPrice || item.unitPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
              {nextStatus(selectedOrder.status) && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder._id, nextStatus(selectedOrder.status)!)}
                  disabled={updating}
                  className="w-full mt-2 bg-teal text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Truck size={16} />
                  {updating ? 'Updating...' : `Mark as ${nextStatus(selectedOrder.status)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;