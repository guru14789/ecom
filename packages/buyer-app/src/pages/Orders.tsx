import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ArrowLeft, ChevronDown, ChevronUp, Truck, CheckCircle,
  XCircle, RotateCcw, Clock, MapPin, FileText, Phone, Star,
  Loader2, Upload, CreditCard, Circle, ExternalLink, ShoppingBag
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { Order, OrderStatus } from '../types';
import { addToast } from '../store/slices/uiSlice';
import { updateOrderStatus } from '../store/slices/authSlice';
import { getOrderById } from '../api/orders';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:          { label: 'Order Pending',       color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: <Clock size={14} /> },
  confirmed:        { label: 'Order Confirmed',      color: 'text-blue-600 bg-blue-50 border-blue-200',          icon: <CheckCircle size={14} /> },
  processing:       { label: 'Processing',           color: 'text-indigo-600 bg-indigo-50 border-indigo-200',    icon: <Package size={14} /> },
  packed:           { label: 'Packed',               color: 'text-violet-600 bg-violet-50 border-violet-200',    icon: <Package size={14} /> },
  shipped:          { label: 'Shipped',              color: 'text-cyan-600 bg-cyan-50 border-cyan-200',          icon: <Truck size={14} /> },
  out_for_delivery: { label: 'Out for Delivery',     color: 'text-orange-600 bg-orange-50 border-orange-200',    icon: <Truck size={14} /> },
  delivered:        { label: 'Delivered',            color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={14} /> },
  cancelled:        { label: 'Cancelled',            color: 'text-rose-600 bg-rose-50 border-rose-200',          icon: <XCircle size={14} /> },
  return_requested: { label: 'Return Requested',     color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: <RotateCcw size={14} /> },
  returned:         { label: 'Returned',             color: 'text-slate-600 bg-slate-50 border-slate-200',       icon: <RotateCcw size={14} /> },
};

const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'confirmed',        label: 'Order Confirmed' },
  { status: 'processing',       label: 'Processing' },
  { status: 'packed',           label: 'Packed' },
  { status: 'shipped',          label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered',        label: 'Delivered' },
];

const ORDER_STATUS_ORDER: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered',
];

function getStepIndex(status: OrderStatus): number {
  return ORDER_STATUS_ORDER.indexOf(status);
}

const downloadInvoice = async (orderId: string, dispatch: any) => {
  try {
    const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    dispatch(addToast({ title: 'Invoice Downloaded', message: 'Invoice downloaded successfully', type: 'success' }));
  } catch {
    dispatch(addToast({ title: 'Error', message: 'Failed to download invoice', type: 'error' }));
  }
};

/* ─── Order Tracking Detail View ─── */
const OrderTracking: React.FC<{ order: Order }> = ({ order }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetail, setReturnDetail] = useState('');
  const [returning, setReturning] = useState(false);

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'returned';

  const handleCancel = async () => {
    if (!cancelReason.trim()) { dispatch(addToast({ title: 'Error', message: 'Please provide a reason', type: 'error' })); return; }
    setCancelling(true);
    try {
      await api.post(`/orders/${order.id}/cancel`, { reason: cancelReason });
      dispatch(addToast({ title: 'Success', message: 'Order cancelled', type: 'success' }));
      dispatch(updateOrderStatus({ orderId: order.id, status: 'cancelled' }));
      setCancelModal(false);
    } catch (err: any) {
      dispatch(addToast({ title: 'Error', message: err.response?.data?.error?.message || 'Cancellation failed', type: 'error' }));
    }
    setCancelling(false);
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) { dispatch(addToast({ title: 'Error', message: 'Please provide a reason', type: 'error' })); return; }
    setReturning(true);
    try {
      await api.post(`/orders/${order.id}/return`, { reason: returnReason, detail: returnDetail });
      dispatch(addToast({ title: 'Success', message: 'Return request submitted', type: 'success' }));
      dispatch(updateOrderStatus({ orderId: order.id, status: 'return_requested' }));
      setReturnModal(false);
    } catch (err: any) {
      dispatch(addToast({ title: 'Error', message: err.response?.data?.error?.message || 'Return request failed', type: 'error' }));
    }
    setReturning(false);
  };

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canReturn = order.status === 'delivered';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      {/* Back + Header */}
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-sm text-[#6B8FA3] hover:text-[#01B4BA] mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-poppins font-bold text-xl text-[#01406D]">Order #{order.id}</h1>
          <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">
            Placed on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => downloadInvoice(order.id, dispatch)}
          className="flex items-center gap-1.5 text-[#01B4BA] font-poppins font-bold text-xs hover:underline">
          <FileText size={14} /> Download Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left - Timeline */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[#E0EFEF] rounded-lg p-6">
            {isCancelled ? (
              <div className="text-center py-8">
                <XCircle size={48} className="mx-auto text-rose-400 mb-3" />
                <h3 className="font-poppins font-bold text-lg text-[#01406D]">
                  {order.status === 'cancelled' ? 'Order Cancelled' : 'Order Returned'}
                </h3>
                <p className="font-inter text-sm text-[#6B8FA3] mt-1">
                  {order.status === 'cancelled' ? 'This order has been cancelled.' : 'This order has been returned.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[#E0EFEF]">
                  <div className="h-full bg-[#01B4BA] transition-all" style={{ maxHeight: `${currentStepIdx >= 0 ? ((currentStepIdx) / (TIMELINE_STEPS.length - 1)) * 100 : 0}%` }} />
                </div>

                <div className="space-y-0">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const stepOrder = getStepIndex(step.status);
                    const completed = currentStepIdx >= stepOrder;
                    const active = currentStepIdx === stepOrder;
                    return (
                      <div key={step.status} className="relative pb-8 last:pb-0">
                        <div className={`absolute left-[-16px] top-0 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center z-10 bg-white transition-all ${
                          completed ? 'border-[#01B4BA] bg-[#01B4BA]' :
                          active ? 'border-[#01406D] bg-white' :
                          'border-[#E0EFEF] bg-white'
                        }`}>
                          {completed ? (
                            <CheckCircle size={14} className="text-white stroke-[3]" />
                          ) : active ? (
                            <Circle size={10} className="text-[#01406D] fill-[#01406D]" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E0EFEF]" />
                          )}
                        </div>
                        <div className="ml-6">
                          <p className={`font-poppins font-bold text-sm ${completed || active ? 'text-[#01406D]' : 'text-[#6B8FA3]'}`}>
                            {step.label}
                          </p>
                          {active && (
                            <p className="font-inter text-xs text-[#01B4BA] mt-0.5">Current</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Courier card */}
                {order.trackingId && (
                  <div className="mt-6 bg-[#F5FEFE] border border-[#E0EFEF] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Truck size={20} className="text-[#01B4BA]" />
                      <div className="flex-1">
                        <p className="font-poppins font-bold text-sm text-[#01406D]">Courier Partner</p>
                        <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">AWB: {order.trackingId}</p>
                      </div>
                      <a href={`https://example.com/track/${order.trackingId}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#01B4BA] font-poppins font-bold text-xs hover:underline">
                        Track on Courier Site <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="bg-white border border-[#E0EFEF] rounded-lg p-4">
            <h3 className="font-poppins font-bold text-sm text-[#01406D] mb-3">Items</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white border border-[#E0EFEF] rounded-lg overflow-hidden flex-shrink-0 p-1">
                    <img src={`/${item.product.image}`} alt={item.product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-sm text-[#01406D] font-medium truncate">{item.product.name}</p>
                    <p className="font-inter text-xs text-[#6B8FA3]">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-poppins font-bold text-sm text-[#01B4BA]">
                    ₹{((item.isGroupBuy ? item.product.groupPrice : item.product.price) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
            <hr className="my-3 border-[#E0EFEF]" />
            <div className="flex justify-between font-poppins font-bold text-sm">
              <span className="text-[#01406D]">Total Paid</span>
              <span className="text-[#01B4BA]">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white border border-[#E0EFEF] rounded-lg p-4">
            <h3 className="font-poppins font-bold text-sm text-[#01406D] mb-2 flex items-center gap-1">
              <MapPin size={14} className="text-[#01B4BA]" /> Delivery Address
            </h3>
            <p className="font-inter text-xs text-[#6B8FA3] leading-relaxed">
              {order.address.houseNo}, {order.address.area}<br />
              {order.address.city && <>{order.address.city}, </>}{order.address.pincode}
            </p>
          </div>

          {/* Payment */}
          <div className="bg-white border border-[#E0EFEF] rounded-lg p-4">
            <h3 className="font-poppins font-bold text-sm text-[#01406D] mb-2 flex items-center gap-1">
              <CreditCard size={14} className="text-[#01B4BA]" /> Payment
            </h3>
            <div className="flex justify-between items-center text-sm font-inter">
              <span className="text-[#6B8FA3] capitalize">{order.paymentMethod}</span>
              <span className="font-semibold text-[#01406D]">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {canCancel && (
              <button onClick={() => setCancelModal(true)}
                className="w-full border border-[#FF7A0F] text-[#FF7A0F] hover:bg-[#FFF7ED] font-poppins font-bold text-sm py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                <XCircle size={16} /> Cancel Order
              </button>
            )}
            {canReturn && (
              <button onClick={() => setReturnModal(true)}
                className="w-full border border-[#01406D] text-[#01406D] hover:bg-[#F5FEFE] font-poppins font-bold text-sm py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Return / Exchange
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCancelModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-poppins font-bold text-lg text-[#01406D] mb-2">Cancel Order</h3>
            <p className="font-inter text-xs text-[#6B8FA3] mb-3">Why are you cancelling this order?</p>
            <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#01B4BA]">
              <option value="">Select a reason</option>
              <option value="Changed mind">Changed mind</option>
              <option value="Found cheaper elsewhere">Found cheaper elsewhere</option>
              <option value="Delivery too long">Delivery too long</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Duplicate order">Duplicate order</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setCancelModal(false)} className="flex-1 border border-[#E0EFEF] text-[#6B8FA3] font-poppins font-bold text-sm py-2.5 rounded-lg hover:bg-slate-50">Keep Order</button>
              <button onClick={handleCancel} disabled={!cancelReason.trim() || cancelling} className="flex-1 bg-[#FF7A0F] text-white font-poppins font-bold text-sm py-2.5 rounded-lg disabled:opacity-50">
                {cancelling ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setReturnModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-poppins font-bold text-lg text-[#01406D] mb-2">Return Items</h3>
            <p className="font-inter text-xs text-[#6B8FA3] mb-3">Tell us why you're returning this order</p>
            <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#01B4BA]">
              <option value="">Select a reason</option>
              <option value="Defective product">Defective product</option>
              <option value="Wrong item sent">Wrong item sent</option>
              <option value="Size/Fit issue">Size/Fit issue</option>
              <option value="Not as described">Not as described</option>
              <option value="Quality issue">Quality issue</option>
              <option value="Other">Other</option>
            </select>
            <textarea placeholder="Describe the issue in detail" value={returnDetail} onChange={(e) => setReturnDetail(e.target.value)} rows={3} className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#01B4BA] resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setReturnModal(false)} className="flex-1 border border-[#E0EFEF] text-[#6B8FA3] font-poppins font-bold text-sm py-2.5 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleReturn} disabled={!returnReason.trim() || returning} className="flex-1 bg-[#01B4BA] text-white font-poppins font-bold text-sm py-2.5 rounded-lg disabled:opacity-50">
                {returning ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Order List Card ─── */
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['confirmed'];
  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'returned';

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/orders/${order.id}`)}
      className="bg-white border border-[#E0EFEF] rounded-lg p-5 cursor-pointer hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-poppins font-bold text-base text-[#01406D]">Order #{order.id}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-poppins font-bold px-2 py-1 rounded-full border ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <span className="font-inter text-xs text-[#6B8FA3]">
            {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="font-poppins font-bold text-sm text-[#01B4BA]">₹{order.total.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex -space-x-3 flex-shrink-0">
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="w-10 h-10 rounded-lg border-2 border-white bg-[#F5FEFE] overflow-hidden shadow-sm" style={{ zIndex: 3 - i }}>
              <img src={`/${item.product.image}`} alt={item.product.name} className="w-full h-full object-contain p-0.5" />
            </div>
          ))}
        </div>
      </div>

      {!isCancelled && currentStepIdx >= 0 && (
        <div className="mt-4 flex items-center gap-1">
          {['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].slice(0, 4).map((s, idx) => {
            const si = getStepIndex(s as OrderStatus);
            const comp = currentStepIdx >= si;
            return (
              <React.Fragment key={s}>
                <div className={`w-2 h-2 rounded-full ${comp ? 'bg-[#01B4BA]' : 'bg-[#E0EFEF]'}`} />
                {idx < 3 && <div className={`flex-1 h-0.5 ${currentStepIdx > si ? 'bg-[#01B4BA]' : 'bg-[#E0EFEF]'}`} />}
              </React.Fragment>
            );
          })}
          <span className="font-inter text-[10px] text-[#6B8FA3] ml-2">{TIMELINE_STEPS[Math.min(currentStepIdx, TIMELINE_STEPS.length - 1)]?.label}</span>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Main Orders Export ─── */
type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

export const Orders: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.auth.orders);
  const user = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [fetchedOrder, setFetchedOrder] = useState<Order | null | undefined>(
    id ? (orders.find((o) => o.id === id) as Order | undefined) ?? null : undefined
  );
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!id) return;
    const found = orders.find((o) => o.id === id) as Order | undefined;
    if (found) { setFetchedOrder(found); setFetching(false); return; }
    setFetching(true);
    getOrderById(id).then((r) => { setFetchedOrder(r.data); setFetching(false); }).catch(() => setFetching(false));
  }, [id, orders]);

  const TABS: Array<{ key: FilterTab; label: string }> = [
    { key: 'all', label: 'All Orders' },
    { key: 'active', label: 'Active' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filtered = orders.filter((order) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && !['delivered', 'cancelled', 'returned'].includes(order.status)) ||
      (activeTab === 'delivered' && order.status === 'delivered') ||
      (activeTab === 'cancelled' && (order.status === 'cancelled' || order.status === 'returned'));
    const matchesSearch = !search || order.id.includes(search);
    return matchesTab && matchesSearch;
  });

  if (id) {
    if (fetching) return <div className="flex items-center justify-center h-screen"><Loader2 size={32} className="animate-spin text-[#01B4BA]" /></div>;
    if (fetchedOrder) return <OrderTracking order={fetchedOrder} />;
    return <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 text-center"><h2 className="font-poppins font-bold text-xl text-[#01406D]">Order not found</h2></div>;
  }

  if (!user?.isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 min-h-screen flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[#F5FEFE] flex items-center justify-center">
          <Package size={40} className="text-[#01B4BA]" />
        </div>
        <div>
          <h2 className="font-poppins font-bold text-xl text-[#01406D]">Sign in to view orders</h2>
          <p className="font-inter text-sm text-[#6B8FA3] mt-1">Your order history will appear here after you sign in.</p>
        </div>
        <button onClick={() => navigate('/login')} className="bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold px-8 py-3 rounded-lg transition-all">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[#F5FEFE] transition-colors">
          <ArrowLeft size={20} className="text-[#01406D]" />
        </button>
        <div>
          <h1 className="font-poppins font-bold text-2xl text-[#01406D]">My Orders</h1>
          <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">{orders.length} total orders</p>
        </div>
      </div>

      <div className="relative mb-5">
        <input type="text" placeholder="Search by order ID..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E0EFEF] bg-white font-inter text-sm outline-none focus:border-[#01B4BA] transition-all" />
        <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8FA3]" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 font-poppins font-bold text-xs px-4 py-2 rounded-full border transition-all ${
              activeTab === tab.key ? 'bg-[#01B4BA] text-white border-[#01B4BA]' : 'bg-white text-[#6B8FA3] border-[#E0EFEF] hover:border-[#01B4BA]/40'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F5FEFE] flex items-center justify-center">
              <ShoppingBag size={36} className="text-[#01B4BA]" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-lg text-[#01406D]">No orders found</h3>
              <p className="font-inter text-sm text-[#6B8FA3] mt-1">
                {activeTab === 'all' ? 'You have not placed any orders yet.' : `No ${activeTab} orders to show.`}
              </p>
            </div>
            <button onClick={() => navigate('/')} className="bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold px-8 py-3 rounded-lg transition-all">
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <motion.div key="list" className="flex flex-col gap-4">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order as Order} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-center gap-2 text-center">
        <Phone size={14} className="text-[#01B4BA]" />
        <p className="font-inter text-xs text-[#6B8FA3]">Need help? <span className="text-[#01B4BA] font-bold cursor-pointer hover:underline">Contact Support</span></p>
      </div>
    </div>
  );
};
