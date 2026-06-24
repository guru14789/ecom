import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, Search, Loader2, Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface OrderItem {
  productId: string;
  productSnapshot: { name?: string; image?: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vendorId?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  deliveryAddress: { houseNo?: string; area?: string; pincode?: string; city?: string; state?: string };
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  timeline: { status: string; timestamp: string; note?: string }[];
  trackingId?: string;
}

const Fulfillment: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/vendor/orders', { params });
      setOrders(res.data.data || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const updateStatus = async (orderId: string, status: string, trackingId?: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/vendor/orders/${orderId}/status`, { status, trackingId });
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const bulkUpdate = async (status: string) => {
    if (selectedOrders.size === 0) { toast.error('Select orders first'); return; }
    setActionLoading('bulk');
    try {
      await Promise.all([...selectedOrders].map((id) => api.put(`/vendor/orders/${id}/status`, { status })));
      toast.success(`${selectedOrders.size} orders updated to ${status}`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch { toast.error('Bulk update failed'); }
    finally { setActionLoading(null); }
  };

  const getSlaRemaining = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const sla = 24 * 60 * 60 * 1000; // 24 hours
    const remaining = sla - (Date.now() - created);
    if (remaining <= 0) return { hours: 0, minutes: 0, expired: true };
    return { hours: Math.floor(remaining / 3600000), minutes: Math.floor((remaining % 3600000) / 60000), expired: false };
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedOrders(next);
  };

  const filtered = orders.filter((o) =>
    o._id.toLowerCase().includes(search.toLowerCase())
  );

  const statusSteps = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Order Fulfillment</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length} pending</span>
          <button onClick={fetchOrders} className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
            <Package size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search by Order ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {selectedOrders.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{selectedOrders.size} selected</span>
            <button onClick={() => bulkUpdate('confirmed')} disabled={actionLoading === 'bulk'} className="px-3 py-2 bg-teal text-white rounded-xl text-xs font-semibold hover:opacity-90">Confirm</button>
            <button onClick={() => bulkUpdate('processing')} disabled={actionLoading === 'bulk'} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:opacity-90">Process</button>
            <button onClick={() => bulkUpdate('shipped')} disabled={actionLoading === 'bulk'} className="px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:opacity-90">Ship</button>
          </div>
        )}
        <button onClick={() => { /* CSV export */ }} className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"><Download size={14} /> Export</button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><Package size={40} className="mx-auto mb-3 opacity-50" /><p className="text-sm">No orders found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const sla = getSlaRemaining(order.createdAt);
            const currentStep = statusSteps.indexOf(order.status);

            return (
              <div key={order._id} className={`bg-white rounded-2xl border transition-colors ${selectedOrders.has(order._id) ? 'border-teal ring-1 ring-teal/20' : 'border-slate-100'} shadow-sm`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedOrders.has(order._id)} onChange={() => toggleSelect(order._id)} className="rounded border-slate-300 text-teal focus:ring-teal" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 font-mono">#{order._id.slice(-8)}</p>
                        <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* SLA Timer */}
                      {!sla.expired && order.status === 'pending' && (
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${sla.hours < 4 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Clock size={12} /> {sla.hours}h {sla.minutes}m left
                        </span>
                      )}
                      {sla.expired && order.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600"><AlertTriangle size={12} /> SLA Breached</span>
                      )}
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'confirmed' || order.status === 'processing' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{order.status.replace(/_/g, ' ')}</span>
                      <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)} className="p-1 hover:bg-slate-100 rounded">
                        {expandedOrder === order._id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-lg overflow-hidden">
                        <img src={item.productSnapshot?.image || 'https://via.placeholder.com/48'} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.items.length > 4 && <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 font-semibold">+{order.items.length - 4}</div>}
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-3 flex items-center gap-1">
                    {statusSteps.slice(0, 4).map((step, i) => (
                      <React.Fragment key={step}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i <= currentStep ? 'bg-teal text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {i < currentStep ? <CheckCircle size={12} /> : i === currentStep ? <Clock size={12} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                        </div>
                        {i < 3 && <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-teal' : 'bg-slate-200'}`} />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Expanded Details & Actions */}
                  {expandedOrder === order._id && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {/* Address */}
                      <div className="text-xs text-slate-500 mb-3">
                        <p className="font-semibold text-slate-700">Delivery:</p>
                        <p>{order.deliveryAddress?.houseNo}, {order.deliveryAddress?.area}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}</p>
                      </div>
                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                            <span>{item.productSnapshot?.name || item.productId} × {item.quantity}</span>
                            <span>₹{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mb-3">Total: ₹{order.total} | Payment: {order.paymentMethod?.toUpperCase()} {order.paymentStatus === 'paid' ? '✅' : '⏳'}</div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {order.status === 'pending' && (
                          <button onClick={() => updateStatus(order._id, 'confirmed')} disabled={actionLoading === order._id} className="flex items-center gap-1 px-4 py-2 bg-teal text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50">
                            {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Confirm
                          </button>
                        )}
                        {(order.status === 'confirmed' || order.status === 'processing') && (
                          <>
                            <button onClick={() => updateStatus(order._id, 'processing')} disabled={actionLoading === order._id} className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50">Process</button>
                            <button onClick={() => updateStatus(order._id, 'packed')} disabled={actionLoading === order._id} className="flex items-center gap-1 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50">Pack</button>
                          </>
                        )}
                        {order.status === 'packed' && (
                          <div className="flex items-center gap-2">
                            <input
                              id={`tracking-${order._id}`}
                              placeholder="AWB / Tracking ID"
                              className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateStatus(order._id, 'shipped', (e.target as HTMLInputElement).value);
                                }
                              }}
                            />
                            <button onClick={() => updateStatus(order._id, 'shipped')} disabled={actionLoading === order._id} className="flex items-center gap-1 px-4 py-2 bg-teal text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50">
                              {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />} Ship
                            </button>
                          </div>
                        )}
                        {order.status === 'shipped' && (
                          <button onClick={() => updateStatus(order._id, 'delivered')} disabled={actionLoading === order._id} className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50">Mark Delivered</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Fulfillment;
