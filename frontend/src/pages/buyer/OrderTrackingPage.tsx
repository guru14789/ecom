import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MapPin, Phone, Package, CheckCircle2, ChevronLeft, Navigation2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OrderData {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  deliveryAddress: string;
  createdAt: any;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vendorOrders?: any[];
}

const STATUS_FLOW = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const CANCELLABLE_STATUSES = ['placed', 'confirmed'];

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as OrderData);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching order:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    try {
      setCancelling(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });
      toast.success('Order cancelled successfully');
      setShowCancelConfirm(false);
    } catch (err) {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'refund_requested',
        returnRequestedAt: new Date().toISOString(),
      });
      toast.success('Return request submitted');
    } catch (err) {
      toast.error('Failed to submit return request');
    }
  };

  const currentStepIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const isCancellable = order && CANCELLABLE_STATUSES.includes(order.status);
  const isDelivered = order?.status === 'delivered';
  const isCancelled = order?.status === 'cancelled' || order?.status === 'refunded';

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
        <button onClick={() => navigate('/orders')} className="text-primary hover:underline font-medium">
          View all orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-10">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Link to="/orders" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">Order #{orderId?.substring(0, 8)}</h1>
          <p className="text-xs text-gray-500 font-medium">
            {isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : `Arriving in ${order.estimatedDelivery || '10 mins'}`}
          </p>
        </div>
      </header>

      <div className="relative w-full h-64 bg-emerald-50 border-b overflow-hidden">
        <img
          src="https://placehold.co/800x400/10b981/ffffff?text=Map+View"
          alt="Map"
          className="w-full h-full object-cover mix-blend-multiply opacity-50"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping" />
            <Navigation2 className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 relative z-10 -mt-4">
        {order.driverName && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-600">
                {order.driverName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{order.driverName}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {order.driverRating && <span className="text-yellow-500">★ {order.driverRating}</span>}
                  Delivery Partner
                </p>
              </div>
            </div>
            {order.driverPhone && (
              <a href={`tel:${order.driverPhone}`} className="w-10 h-10 bg-green-50 text-primary rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                <Phone className="h-5 w-5" />
              </a>
            )}
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-4">Track Order</h3>

          <div className="space-y-0">
            {STATUS_FLOW.map((status, idx) => {
              const isComplete = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isComplete ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent && !isComplete ? 'animate-pulse' : ''}`}>
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-gray-400" />}
                    </div>
                    {idx < STATUS_FLOW.length - 1 && (
                      <div className={`w-0.5 h-8 ${isComplete && idx < currentStepIndex ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`pb-6 ${isComplete ? '' : 'opacity-50'}`}>
                    <h4 className={`font-bold text-sm ${isCurrent ? 'text-primary' : isComplete ? 'text-gray-900' : 'text-gray-500'}`}>
                      {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isComplete ? (isCurrent ? 'In progress' : 'Completed') : 'Pending'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Courier Details */}
        {order.vendorOrders?.some(vo => vo.shippingDetails) && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Courier Shipments</h3>
            <div className="space-y-3">
              {order.vendorOrders.filter(vo => vo.shippingDetails).map((vo, i) => (
                <div key={i} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800 text-sm">{vo.shippingDetails.courierName}</span>
                    <a
                      href={vo.shippingDetails.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                    >
                      Track
                    </a>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="font-medium">AWB:</span> {vo.shippingDetails.awb}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-sm border">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 mt-1">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Delivery Address</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-1 text-sm border-b border-gray-100 last:border-0 pb-2 mb-2 last:mb-0">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">{item.quantity} x {item.name || item.productSnapshot?.name || 'Product'}</span>
                  <span className="font-medium">₹{(item.totalPrice || item.price * item.quantity).toFixed(2)}</span>
                </div>
                {item.productType === 'digital' && item.digitalFileUrl && (
                  <a
                    href={item.digitalFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1 w-fit mt-1"
                  >
                    <Package className="w-3 h-3" /> Access Digital File
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
          
          <div className="border-t mt-4 pt-4">
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`http://localhost:5000/api/orders/${order.id}/invoice`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (!res.ok) throw new Error('Failed to download invoice');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `invoice-${order.id}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  toast.error('Failed to download invoice');
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl py-3 font-bold hover:bg-gray-200 transition-colors"
            >
              <Package className="h-5 w-5" />
              Download Tax Invoice
            </button>
          </div>
        </div>

        {isCancellable && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 rounded-xl py-3 font-bold hover:bg-red-50 transition-colors"
          >
            <XCircle className="h-5 w-5" />
            Cancel Order
          </button>
        )}

        {isDelivered && (
          <button
            onClick={handleRequestReturn}
            className="w-full flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-600 rounded-xl py-3 font-bold hover:bg-orange-50 transition-colors"
          >
            <Package className="h-5 w-5" />
            Request Return
          </button>
        )}
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Are you sure you want to cancel this order?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
