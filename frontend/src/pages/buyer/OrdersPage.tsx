import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeBuyerOrders } from '../../hooks/useRealtimeBuyerOrders';
import { Package, Clock, ChevronRight, CheckCircle2, XCircle, Truck, ArrowLeft } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  placed: { label: 'Placed', color: 'bg-blue-100 text-blue-700', icon: <Package className="h-3 w-3" /> },
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-700', icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  preparing: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  packed: { label: 'Packed', color: 'bg-amber-100 text-amber-700', icon: <Package className="h-3 w-3" /> },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: <Truck className="h-3 w-3" /> },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-100 text-blue-700', icon: <Truck className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: <CheckCircle2 className="h-3 w-3" /> },
};

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real-time listener hook using Firestore onSnapshot
  const { orders, loading } = useRealtimeBuyerOrders(user?.uid || null);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const activeStatuses = ['placed', 'pending', 'confirmed', 'processing', 'preparing', 'packed', 'shipped', 'out_for_delivery'];
  const pastStatuses = ['delivered', 'cancelled', 'refunded'];

  const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
  const pastOrders = orders.filter(o => pastStatuses.includes(o.status));
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Please login to view orders</h2>
        <button
          onClick={() => navigate('/profile')}
          className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 -ml-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-orange-500 hover:border-orange-200 hover:shadow-sm hover:bg-orange-50 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black text-blue-950 m-0 tracking-tight">My Orders</h1>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Past Orders ({pastOrders.length})
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            Loading orders...
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found in this category.</p>
          </div>
        ) : (
          displayOrders.map(order => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">Order #{order.id.slice(-5)}</span>
                      <span className={`${statusCfg.color} text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1`}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="font-bold text-lg">₹{order.total}</div>
                </div>

                <div className="border-t pt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600 line-clamp-1">
                    {order.items?.map((i: any) => `${i.quantity} x ${i.productSnapshot?.name || i.name || 'Product'}`).join(', ')}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
