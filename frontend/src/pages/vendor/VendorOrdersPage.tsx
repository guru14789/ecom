import React, { useState } from 'react';
import { useRealtimeVendorOrders } from '../../hooks/useRealtimeVendorOrders';
import { useAuth } from '../../hooks/useAuth';
import { Clock, MapPin, Phone, Printer, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];

const COLUMNS = [
  { id: 'pending', title: 'New', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'confirmed', title: 'Confirmed', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'processing', title: 'Processing', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'packed', title: 'Packed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'shipped', title: 'Shipped', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'delivered', title: 'Delivered', color: 'bg-blue-50 text-blue-700 border-blue-200' },
];

export const VendorOrdersPage: React.FC = () => {
  const { user } = useAuth();
  
  // Real-time listener: updates instantly on any firestore orders changes
  const { orders, loading } = useRealtimeVendorOrders(user?.vendorId || user?.uid || null);

  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState({ courierName: '', trackingId: '' });
  const [shipping, setShipping] = useState(false);

  const updateOrderStatus = async (orderId: string, newStatus: string, shippingDetails?: { courierName: string, trackingId: string }) => {
    try {
      const { vendorApi } = await import('../../lib/api');
      await vendorApi.orders.updateStatus(orderId, { status: newStatus, ...shippingDetails });
      toast.success(`Order marked as ${newStatus}`);
      if (newStatus === 'shipped') setShipModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
    }
  };

  const handleShipClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShippingData({ courierName: '', trackingId: '' });
    setShipModalOpen(true);
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setShipping(true);
    await updateOrderStatus(selectedOrderId, 'shipped', shippingData);
    setShipping(false);
  };

  const getNextStatus = (current: string): string | null => {
    const idx = STATUS_ORDER.indexOf(current);
    return idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
  };

  const getPrevStatus = (current: string): string | null => {
    const idx = STATUS_ORDER.indexOf(current);
    return idx > 0 ? STATUS_ORDER[idx - 1] : null;
  };

  const formatElapsed = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-blue-950 tracking-tight">Live Orders</h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          Live Sync Active
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-max h-full pb-4">
          {COLUMNS.map(column => {
            const columnOrders = orders.filter(o => o.status === column.id);
            return (
              <div key={column.id} className="w-80 flex flex-col h-full">
                <div className={`px-4 py-3 rounded-t-xl border-x border-t font-bold flex items-center justify-between ${column.color}`}>
                  <span>{column.title}</span>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">{columnOrders.length}</span>
                </div>

                <div className="flex-1 bg-gray-100 border-x border-b rounded-b-xl p-3 space-y-3 overflow-y-auto min-h-[500px]">
                  {columnOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-gray-900">#{order.id.slice(-6)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            title="Download Commission Invoice"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`http://localhost:5000/api/vendor/orders/${order.id}/invoice`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!res.ok) throw new Error('Failed to download invoice');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `vendor-invoice-${order.id}.pdf`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                              } catch (err) {
                                toast.error('Failed to download invoice');
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatElapsed(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-gray-900">{order.userId ? `User ${order.userId.slice(0, 6)}` : 'Customer'}</div>
                        <div className="text-xs text-gray-500 flex items-start gap-1 mt-1">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {order.deliveryAddress ? (
                              typeof order.deliveryAddress === 'object' ? 
                                `${(order.deliveryAddress as any).houseNo || ''}, ${(order.deliveryAddress as any).area || ''}, ${(order.deliveryAddress as any).city || ''} - ${(order.deliveryAddress as any).pincode || ''}` : 
                                String(order.deliveryAddress)
                            ) : 'No address'}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600">
                        {order.items?.map(i => `${i.quantity}x ${i.productSnapshot?.name || i.name || 'Product'}`).join(', ')}
                      </div>

                      <div className="flex justify-between items-center text-sm border-t pt-3">
                        <span className="text-gray-600">{order.items?.length || 0} items</span>
                        <span className="font-bold text-gray-900">₹{order.total}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {getPrevStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, getPrevStatus(order.status)!)}
                            className="w-full flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium py-1.5 rounded transition-colors text-sm"
                          >
                            <XCircle className="h-4 w-4" /> Revert
                          </button>
                        )}
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => {
                              const next = getNextStatus(order.status)!;
                              if (next === 'shipped' || order.status === 'packed') {
                                handleShipClick(order.id);
                              } else {
                                updateOrderStatus(order.id, next);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium py-1.5 rounded transition-colors text-sm"
                          >
                            <CheckCircle className="h-4 w-4" /> Mark {COLUMNS.find(c => c.id === getNextStatus(order.status))?.title}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {columnOrders.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ship Order Modal */}
      {shipModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Ship Order</h2>
              <p className="text-sm text-gray-500 mt-1">Enter tracking details to notify the buyer.</p>
            </div>
            <form onSubmit={handleShipSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Courier Name</label>
                <input
                  type="text"
                  required
                  value={shippingData.courierName}
                  onChange={(e) => setShippingData(prev => ({ ...prev, courierName: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="e.g. BlueDart, Delhivery"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tracking ID / AWB</label>
                <input
                  type="text"
                  required
                  value={shippingData.trackingId}
                  onChange={(e) => setShippingData(prev => ({ ...prev, trackingId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShipModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shipping || !shippingData.courierName || !shippingData.trackingId}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {shipping ? 'Saving...' : 'Confirm Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
