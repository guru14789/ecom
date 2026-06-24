import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CreditCard, Truck, Check, ChevronRight, ChevronLeft,
  Plus, Loader2, Shield, IndianRupee, Smartphone, Landmark, Wallet,
  BadgePercent, AlertTriangle, Star, ChevronDown, Edit2, X, Circle,
  Clock, Home, Building2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { getAddresses } from '../api/users';
import { getCheckoutSummary, validateCoupon, checkCodAvailability, getDeliveryEstimate } from '../api/checkout';
import { createOrder } from '../api/orders';
import { createRazorpayOrder, verifyPayment } from '../api/payments';
import { addToast, setLoginModalOpen } from '../store/slices/uiSlice';
import { clearCart } from '../store/slices/cartSlice';
import { Address, DeliveryOption, DeliveryEstimate } from '../types';

const STEPS = ['Address', 'Payment', 'Confirm'];

const SAVED_CARDS = [
  { id: '1', last4: '4532', network: 'visa', expiry: '12/26', holderName: 'John Doe' },
  { id: '2', last4: '8910', network: 'mastercard', expiry: '08/25', holderName: 'John Doe' },
  { id: '3', last4: '2345', network: 'rupay', expiry: '03/27', holderName: 'John Doe' },
];

const BANKS = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'yes', name: 'Yes Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'canara', name: 'Canara Bank' },
  { id: 'union', name: 'Union Bank of India' },
];

const EMI_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', rates: { 3: 0, 6: 12, 9: 14, 12: 15 } },
  { id: 'icici', name: 'ICICI Bank', rates: { 3: 0, 6: 11, 9: 13, 12: 14 } },
  { id: 'axis', name: 'Axis Bank', rates: { 3: 0, 6: 12, 9: 15, 12: 16 } },
  { id: 'sbi', name: 'State Bank of India', rates: { 3: 0, 6: 10, 9: 12, 12: 13 } },
  { id: 'kotak', name: 'Kotak Mahindra Bank', rates: { 3: 0, 6: 11, 9: 14, 12: 16 } },
];

const CARD_NETWORKS: Record<string, { label: string; color: string }> = {
  visa: { label: 'Visa', color: 'bg-blue-600' },
  mastercard: { label: 'Mastercard', color: 'bg-orange-500' },
  rupay: { label: 'RuPay', color: 'bg-emerald-600' },
};

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', logo: 'https://cdn-icons-png.flaticon.com/128/6124/6124998.png' },
  { id: 'phonepe', name: 'PhonePe', logo: 'https://cdn-icons-png.flaticon.com/128/15466/15466050.png' },
  { id: 'paytm', name: 'Paytm', logo: 'https://cdn-icons-png.flaticon.com/128/10458/10458032.png' },
];

const QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=merchant@upi&pn=Shopsyy';

function calculateEMI(principal: number, rate: number, tenure: number): number {
  const mr = rate / 12 / 100;
  return Math.round((principal * mr * Math.pow(1 + mr, tenure)) / (Math.pow(1 + mr, tenure) - 1));
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Saved Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark },
  { id: 'wallet', label: 'Wallets', icon: Wallet },
  { id: 'emi', label: 'EMI', icon: IndianRupee },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const cartItems = useAppSelector((s) => s.cart.items);
  const walletBalance = useAppSelector((s) => s.auth.walletBalance);

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [codFee, setCodFee] = useState(40);
  const [codAvailable, setCodAvailable] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [emiBank, setEmiBank] = useState('');
  const [emiTenure, setEmiTenure] = useState(6);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const [newAddress, setNewAddress] = useState({
    houseNo: '', area: '', city: '', state: '', pincode: '', landmark: '', tag: 'Home' as 'Home' | 'Office' | 'Other',
  });

  useEffect(() => {
    if (!user?.isLoggedIn) { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [addrRes] = await Promise.all([getAddresses()]);
      setAddresses(addrRes.data || []);
      if (addrRes.data?.length > 0) {
        const def = addrRes.data.find((a: Address) => a.isDefault) || addrRes.data[0];
        setSelectedAddress(def.id || '');
        setPincodeInput(def.pincode);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadSummary = async () => {
    try {
      const res = await getCheckoutSummary({
        items: cartItems.map((i) => ({ productId: String(i.product.id), quantity: i.quantity, isGroupBuy: i.isGroupBuy })),
        pincode: pincodeInput,
        couponCode: appliedCoupon?.code,
      });
      setSummary(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (cartItems.length > 0) loadSummary(); }, [cartItems, appliedCoupon, pincodeInput]);

  const verifyPincode = () => {
    if (pincodeInput.length === 6) {
      setNewAddress((prev) => ({ ...prev, city: 'Mumbai', state: 'Maharashtra', pincode: pincodeInput }));
      dispatch(addToast({ title: 'Pincode Verified', message: 'City/State auto-filled', type: 'success' }));
    }
  };

  const addNewAddress = () => {
    const addr: Address = {
      id: `addr_${Date.now()}`,
      houseNo: newAddress.houseNo,
      area: newAddress.area,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
      landmark: newAddress.landmark,
      tag: newAddress.tag,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddress(addr.id!);
    setPincodeInput(addr.pincode);
    setShowAddressForm(false);
    setNewAddress({ houseNo: '', area: '', city: '', state: '', pincode: '', landmark: '', tag: 'Home' });
    dispatch(addToast({ title: 'Address Added', message: 'New address saved', type: 'success' }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const subtotal = summary?.subtotal || 0;
    const res = await validateCoupon(couponCode, subtotal);
    if (res.valid && res.data) {
      setAppliedCoupon({ code: res.data.code, discount: res.data.discount, label: `${res.data.discountType === 'percent' ? `${res.data.discountValue}%` : `₹${res.data.discountValue}`} off` });
      dispatch(addToast({ title: 'Coupon Applied!', message: `You saved ₹${res.data.discount}`, type: 'success' }));
    } else {
      dispatch(addToast({ title: 'Invalid Coupon', message: res.error || 'Coupon could not be applied', type: 'error' }));
    }
  };

  const totalPayable = useMemo(() => {
    const base = summary?.total || 0;
    if (paymentMethod === 'cod') return base + codFee;
    return base;
  }, [summary, paymentMethod, codFee]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !paymentMethod) return;
    setPlacing(true);
    try {
      if (paymentMethod === 'cod') {
        const orderRes = await createOrder({
          addressId: selectedAddress,
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code,
        });
        dispatch(clearCart());
        setPlacedOrder({ id: orderRes.data.id, estimatedDelivery: 'Mon, 20 Apr' });
        setOrderPlaced(true);
        setStep(2);
      } else if (paymentMethod === 'card' && selectedCard) {
        const orderRes = await createOrder({
          addressId: selectedAddress,
          paymentMethod: 'card',
          couponCode: appliedCoupon?.code,
        });
        const paymentRes = await createRazorpayOrder({ addressId: selectedAddress, couponCode: appliedCoupon?.code });
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderRes.data.total * 100,
          currency: 'INR',
          order_id: paymentRes.data.razorpayOrderId,
          handler: async (response: any) => {
            await verifyPayment(response);
            dispatch(clearCart());
            setPlacedOrder({ id: orderRes.data.id, estimatedDelivery: 'Mon, 20 Apr' });
            setOrderPlaced(true);
            setStep(2);
          },
          prefill: { name: user?.fullName, contact: user?.phoneNumber, email: user?.email },
          theme: { color: '#01B4BA' },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        const orderRes = await createOrder({
          addressId: selectedAddress,
          paymentMethod,
          couponCode: appliedCoupon?.code,
        });
        dispatch(clearCart());
        setPlacedOrder({ id: orderRes.data.id, estimatedDelivery: 'Mon, 20 Apr' });
        setOrderPlaced(true);
        setStep(2);
      }
    } catch (err: any) {
      dispatch(addToast({ title: 'Order Failed', message: err?.message || 'Something went wrong', type: 'error' }));
    }
    setPlacing(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 size={32} className="animate-spin text-[#01B4BA]" /></div>;
  if (cartItems.length === 0 && !orderPlaced) return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 text-center">
      <h2 className="font-poppins font-bold text-xl text-[#01406D]">Your cart is empty</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-[#01B4BA] underline">Continue Shopping</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 min-h-screen">
      {/* Progress Bar */}
      {!orderPlaced && (
        <div className="flex items-center gap-3 mb-10 max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-poppins transition-all ${
                  i < step ? 'bg-[#01B4BA] text-white' :
                  i === step ? 'border-2 border-[#01406D] text-[#01406D] bg-white' :
                  'border-2 border-[#E0EFEF] text-[#6B8FA3] bg-white'
                }`}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={`font-poppins font-bold text-sm hidden sm:block ${
                  i <= step ? 'text-[#01406D]' : 'text-[#6B8FA3]'
                }`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-[#01B4BA]' : 'bg-[#E0EFEF]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step 3 - Confirmation */}
      {orderPlaced && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto bg-[#01B4BA] rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Check size={36} className="text-white stroke-[3]" />
          </div>
          <h1 className="font-poppins font-bold text-[28px] text-[#01406D] mb-2">Order Placed!</h1>
          <p className="font-inter text-sm text-[#6B8FA3] mb-6">Your order has been placed successfully</p>

          <div className="bg-[#F5FEFE] border border-[#E0EFEF] rounded-lg p-5 mb-8 space-y-3">
            <div className="flex justify-between text-sm font-inter">
              <span className="text-[#6B8FA3]">Order ID</span>
              <span className="text-[#01406D] font-medium font-mono">#{placedOrder?.id?.slice(-8).toUpperCase() || 'ORD-001'}</span>
            </div>
            <div className="flex justify-between text-sm font-inter">
              <span className="text-[#6B8FA3]">Estimated Delivery</span>
              <span className="text-[#01B4BA] font-semibold">{placedOrder?.estimatedDelivery || 'Mon, 20 Apr'}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link to={`/orders/${placedOrder?.id}`} className="bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold text-sm px-6 py-3 rounded-lg transition-all flex items-center gap-2">
              <Truck size={16} /> Track Order
            </Link>
            <Link to="/" className="border border-[#01406D] text-[#01406D] hover:bg-[#01406D] hover:text-white font-poppins font-bold text-sm px-6 py-3 rounded-lg transition-all flex items-center gap-2">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      )}

      {/* Steps 1 & 2 */}
      {!orderPlaced && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1 - Address */}
            {step === 0 && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h2 className="font-poppins font-bold text-lg text-[#01406D] flex items-center gap-2">
                  <MapPin size={18} className="text-[#01B4BA]" /> Delivery Address
                </h2>

                {/* Saved Addresses */}
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddress === addr.id;
                    return (
                      <label key={addr.id}
                        className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected ? 'border-[#01B4BA] bg-[#F5FEFE]' : 'border-[#E0EFEF] hover:border-[#01B4BA]/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                            isSelected ? 'border-[#01B4BA]' : 'border-[#E0EFEF]'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#01B4BA]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-poppins font-bold text-sm text-[#01406D]">{addr.houseNo}, {addr.area}</p>
                                <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
                              </div>
                              <button onClick={(e) => { e.preventDefault(); dispatch(addToast({ title: 'Edit', message: 'Address edit coming soon', type: 'info' })); }}
                                className="font-inter text-xs text-[#01B4BA] hover:underline flex items-center gap-1">
                                <Edit2 size={10} /> Edit
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-poppins font-bold bg-[#F5FEFE] text-[#01B4BA] px-2 py-0.5 rounded-full border border-[#01B4BA]/20">
                                {addr.tag === 'Home' ? <Home size={10} className="inline mr-0.5" /> : <Building2 size={10} className="inline mr-0.5" />}
                                {addr.tag}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-inter text-[#6B8FA3]">Default</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Add New Address */}
                <button onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-2 border border-dashed border-[#01B4BA] text-[#01B4BA] hover:bg-[#F5FEFE] font-poppins font-bold text-sm px-4 py-3 rounded-lg transition-all w-full justify-center">
                  <Plus size={16} /> Add New Address
                </button>

                <AnimatePresence>
                  {showAddressForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="border border-[#E0EFEF] rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">House / Flat No.</label>
                            <input value={newAddress.houseNo} onChange={(e) => setNewAddress({ ...newAddress, houseNo: e.target.value })}
                              className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">Area / Street</label>
                            <input value={newAddress.area} onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                              className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
                          </div>
                          <div>
                            <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">Pincode</label>
                            <div className="flex gap-2">
                              <input value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                maxLength={6} className="flex-1 font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
                              <button onClick={verifyPincode} disabled={newAddress.pincode.length !== 6}
                                className="bg-[#01B4BA] text-white font-poppins font-bold text-xs px-3 py-2 rounded-lg disabled:opacity-50">Verify</button>
                            </div>
                          </div>
                          <div>
                            <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">Landmark</label>
                            <input value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                              className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
                          </div>
                          <div className="col-span-2 grid grid-cols-2 gap-3">
                            <div>
                              <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">City</label>
                              <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
                            </div>
                            <div>
                              <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">State</label>
                              <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="font-inter text-xs text-[#6B8FA3] mb-1 block">Address Type</label>
                            <div className="flex gap-2">
                              {(['Home', 'Office', 'Other'] as const).map((t) => (
                                <button key={t} onClick={() => setNewAddress({ ...newAddress, tag: t })}
                                  className={`px-4 py-2 rounded-lg border text-xs font-poppins font-bold transition-all ${
                                    newAddress.tag === t ? 'bg-[#01B4BA] text-white border-[#01B4BA]' : 'border-[#E0EFEF] text-[#6B8FA3] hover:border-[#01B4BA]/40'
                                  }`}>{t}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={addNewAddress} disabled={!newAddress.houseNo || !newAddress.area || !newAddress.pincode || !newAddress.city}
                            className="bg-[#01B4BA] text-white font-poppins font-bold text-sm px-5 py-2.5 rounded-lg disabled:opacity-50 transition-all">Save Address</button>
                          <button onClick={() => setShowAddressForm(false)}
                            className="border border-[#E0EFEF] text-[#6B8FA3] font-poppins font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={() => setStep(1)} disabled={!selectedAddress}
                  className="w-full sm:w-auto bg-[#01B4BA] hover:bg-[#019aa0] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white font-poppins font-bold text-sm py-3 px-8 rounded-lg transition-all">
                  Deliver Here
                </button>
              </motion.div>
            )}

            {/* Step 2 - Payment */}
            {step === 1 && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h2 className="font-poppins font-bold text-lg text-[#01406D] flex items-center gap-2">
                  <CreditCard size={18} className="text-[#01B4BA]" /> Payment Method
                </h2>

                <div className="flex gap-4">
                  {/* Left - Method List */}
                  <div className="w-44 flex-shrink-0 space-y-1">
                    {PAYMENT_METHODS.map((pm) => {
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <button key={pm.id} onClick={() => { setPaymentMethod(pm.id); if (pm.id !== 'card') setSelectedCard(''); }}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-inter transition-all ${
                            isSelected ? 'bg-white border-l-4 border-l-[#01B4BA] shadow-sm text-[#01406D] font-semibold' : 'text-[#6B8FA3] hover:text-[#01406D] hover:bg-white/50'
                          }`}>
                          <pm.icon size={16} className={isSelected ? 'text-[#01B4BA]' : 'text-[#6B8FA3]'} />
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right - Method Detail */}
                  <div className="flex-1 bg-white border border-[#E0EFEF] rounded-lg p-5 min-h-[320px]">
                    {/* Saved Card */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-3">
                        <h3 className="font-poppins font-bold text-sm text-[#01406D]">Select a Saved Card</h3>
                        {SAVED_CARDS.map((card) => {
                          const network = CARD_NETWORKS[card.network] || { label: 'Card', color: 'bg-slate-500' };
                          return (
                            <label key={card.id}
                              className={`flex items-center gap-3 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                selectedCard === card.id ? 'border-[#01B4BA] bg-[#F5FEFE]' : 'border-[#E0EFEF] hover:border-[#01B4BA]/40'
                              }`}>
                              <input type="radio" name="savedCard" checked={selectedCard === card.id}
                                onChange={() => setSelectedCard(card.id)} className="accent-[#01B4BA]" />
                              <div className={`w-12 h-8 rounded flex items-center justify-center text-[10px] font-poppins font-bold text-white ${network.color}`}>
                                {network.label}
                              </div>
                              <div className="flex-1">
                                <span className="font-inter text-sm text-[#01406D] font-medium">•••• {card.last4}</span>
                                <span className="font-inter text-xs text-[#6B8FA3] ml-2">expires {card.expiry}</span>
                              </div>
                              <Check size={16} className={selectedCard === card.id ? 'text-[#01B4BA]' : 'text-transparent'} />
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* UPI */}
                    {paymentMethod === 'upi' && (
                      <div className="space-y-4">
                        <div>
                          <label className="font-poppins font-bold text-sm text-[#01406D] block mb-2">Enter UPI ID</label>
                          <div className="flex gap-2">
                            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@upi"
                              className="flex-1 font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2.5 outline-none focus:border-[#01B4BA]" />
                            <button disabled={!upiId.includes('@')}
                              className="bg-[#01B4BA] hover:bg-[#019aa0] disabled:bg-[#9CA3AF] text-white font-poppins font-bold text-xs px-4 py-2 rounded-lg transition-all">Verify UPI</button>
                          </div>
                        </div>
                        <div>
                          <p className="font-poppins font-bold text-xs text-[#01406D] mb-2">OR pay with UPI apps</p>
                          <div className="flex gap-3">
                            {UPI_APPS.map((app) => (
                              <button key={app.id} className="flex items-center gap-2 border border-[#E0EFEF] rounded-lg px-4 py-2.5 hover:border-[#01B4BA] transition-all">
                                <img src={app.logo} alt={app.name} className="w-6 h-6" />
                                <span className="font-inter text-xs text-[#01406D]">{app.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2">
                          <p className="font-inter text-xs text-[#6B8FA3] mb-2">Scan QR code</p>
                          <img src={QR_URL} alt="UPI QR" className="w-28 h-28 border border-[#E0EFEF] rounded-lg" />
                        </div>
                      </div>
                    )}

                    {/* Net Banking */}
                    {paymentMethod === 'netbanking' && (
                      <div>
                        <label className="font-poppins font-bold text-sm text-[#01406D] block mb-2">Select Bank</label>
                        <div className="relative max-w-sm">
                          <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-4 py-3 outline-none focus:border-[#01B4BA] appearance-none bg-white pr-10">
                            <option value="">Choose a bank</option>
                            {BANKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8FA3] pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* Wallet */}
                    {paymentMethod === 'wallet' && (
                      <div className="text-center py-8">
                        <Wallet size={40} className="mx-auto text-[#01B4BA] mb-3" />
                        <p className="font-poppins font-bold text-lg text-[#01406D]">₹{walletBalance.toLocaleString('en-IN')}</p>
                        <p className="font-inter text-xs text-[#6B8FA3] mt-1">Available Balance</p>
                        {walletBalance < totalPayable && (
                          <p className="font-inter text-xs text-[#FF7A0F] mt-2">
                            Insufficient balance. Pay ₹{Math.round(totalPayable - walletBalance).toLocaleString('en-IN')} via another method.
                          </p>
                        )}
                      </div>
                    )}

                    {/* EMI */}
                    {paymentMethod === 'emi' && (
                      <div className="space-y-4">
                        <div>
                          <label className="font-poppins font-bold text-sm text-[#01406D] block mb-2">Select Bank</label>
                          <div className="relative max-w-sm">
                            <select value={emiBank} onChange={(e) => { setEmiBank(e.target.value); setEmiTenure(6); }}
                              className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-4 py-3 outline-none focus:border-[#01B4BA] appearance-none bg-white pr-10">
                              <option value="">Choose a bank</option>
                              {EMI_BANKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B8FA3] pointer-events-none" />
                          </div>
                        </div>
                        {emiBank && (
                          <div>
                            <label className="font-poppins font-bold text-xs text-[#01406D] block mb-2">Choose Tenure</label>
                            <div className="flex gap-2 mb-4">
                              {[3, 6, 9, 12].map((tenure) => {
                                const bank = EMI_BANKS.find((b) => b.id === emiBank);
                                const rate = bank?.rates[tenure as keyof typeof bank.rates] || 0;
                                return (
                                  <button key={tenure} onClick={() => setEmiTenure(tenure)}
                                    className={`flex-1 border-2 rounded-lg px-3 py-2 text-center transition-all ${
                                      emiTenure === tenure ? 'border-[#01B4BA] bg-[#F5FEFE]' : 'border-[#E0EFEF] hover:border-[#01B4BA]/40'
                                    }`}>
                                    <span className="font-poppins font-bold text-xs text-[#01406D] block">{tenure} mo</span>
                                    {rate > 0 && <span className="font-inter text-[10px] text-[#6B8FA3]">{rate}% p.a.</span>}
                                    {rate === 0 && <span className="font-inter text-[10px] text-emerald-600">No Cost</span>}
                                  </button>
                                );
                              })}
                            </div>
                            {(() => {
                              const bank = EMI_BANKS.find((b) => b.id === emiBank);
                              const rate = bank?.rates[emiTenure as keyof typeof bank.rates] || 0;
                              const monthly = calculateEMI(totalPayable, rate, emiTenure);
                              const totalPay = monthly * emiTenure;
                              const interest = totalPay - totalPayable;
                              return (
                                <div className="bg-[#F5FEFE] border border-[#E0EFEF] rounded-lg p-4">
                                  <h4 className="font-poppins font-bold text-xs text-[#01406D] mb-3">EMI Summary</h4>
                                  <table className="w-full text-sm font-inter">
                                    <tbody>
                                      <tr className="border-b border-[#E0EFEF]">
                                        <td className="py-2 text-[#6B8FA3]">Loan Amount</td>
                                        <td className="py-2 text-right font-medium text-[#01406D]">₹{totalPayable.toLocaleString('en-IN')}</td>
                                      </tr>
                                      <tr className="border-b border-[#E0EFEF]">
                                        <td className="py-2 text-[#6B8FA3]">Interest Rate</td>
                                        <td className="py-2 text-right font-medium text-[#01406D]">{rate}% p.a.</td>
                                      </tr>
                                      <tr className="border-b border-[#E0EFEF]">
                                        <td className="py-2 text-[#6B8FA3]">Tenure</td>
                                        <td className="py-2 text-right font-medium text-[#01406D]">{emiTenure} months</td>
                                      </tr>
                                      <tr className="border-b border-[#E0EFEF]">
                                        <td className="py-2 text-[#6B8FA3]">Monthly Payment</td>
                                        <td className="py-2 text-right font-bold text-[#01B4BA]">₹{monthly.toLocaleString('en-IN')}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-[#6B8FA3]">Total Interest</td>
                                        <td className="py-2 text-right font-medium text-[#FF7A0F]">₹{interest.toLocaleString('en-IN')}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* COD */}
                    {paymentMethod === 'cod' && (
                      <div className="text-center py-8">
                        <Truck size={40} className="mx-auto text-[#01B4BA] mb-3" />
                        <p className="font-poppins font-bold text-base text-[#01406D]">Cash on Delivery</p>
                        <p className="font-inter text-xs text-[#6B8FA3] mt-1">Pay when your order is delivered</p>
                        <div className="inline-flex items-center gap-1.5 mt-4 bg-[#FFF7ED] border border-[#FFD6B3] rounded-full px-4 py-1.5">
                          <AlertTriangle size={12} className="text-[#FF7A0F]" />
                          <span className="font-inter text-xs text-[#C2410C] font-medium">₹40 COD fee applies</span>
                        </div>
                      </div>
                    )}

                    {!paymentMethod && (
                      <div className="flex items-center justify-center h-full">
                        <p className="font-inter text-sm text-[#6B8FA3]">Select a payment method to continue</p>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handlePlaceOrder} disabled={placing || !paymentMethod || !selectedAddress || (paymentMethod === 'netbanking' && !selectedBank) || (paymentMethod === 'upi' && !upiId) || (paymentMethod === 'card' && !selectedCard)}
                  className="w-full sm:w-auto bg-[#FF7A0F] hover:bg-[#e66d0e] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white font-poppins font-bold text-sm py-3.5 px-10 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                  {placing ? <Loader2 size={18} className="animate-spin" /> : null}
                  {placing ? 'Processing...' : `Pay ₹${Math.round(totalPayable).toLocaleString('en-IN')}`}
                </button>
              </motion.div>
            )}
          </div>

          {/* Right - Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-[#E0EFEF] border-t-4 border-t-[#01B4BA] rounded-lg p-5 shadow-sm">
              <h3 className="font-poppins font-bold text-base text-[#01406D] mb-4">Order Summary</h3>

              <div className="space-y-2 text-sm font-inter">
                {(summary?.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-[#6B8FA3]">
                    <span className="truncate flex-1">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-[#01406D] ml-2">₹{item.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <hr className="my-3 border-[#E0EFEF]" />

              <div className="space-y-2 text-sm font-inter">
                <div className="flex justify-between">
                  <span className="text-[#6B8FA3]">Subtotal</span>
                  <span className="text-[#01406D] font-medium">₹{(summary?.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B8FA3]">Delivery</span>
                  <span className={summary?.deliveryFee === 0 ? 'text-emerald-600 font-medium' : 'text-[#01406D]'}>
                    {summary?.deliveryFee === 0 ? 'FREE' : `₹${summary?.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B8FA3]">Handling</span>
                  <span className="text-[#01406D]">₹{summary?.handlingFee || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B8FA3]">GST (18%)</span>
                  <span className="text-[#01406D]">₹{(summary?.gst || 0).toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span className="flex items-center gap-1"><BadgePercent size={12} /> {appliedCoupon.code}</span>
                    <span>-₹{appliedCoupon.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <hr className="my-3 border-[#E0EFEF]" />

              <div className="flex justify-between font-poppins font-bold text-base">
                <span className="text-[#01406D]">Total</span>
                <span className="text-[#01B4BA]">₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
              </div>

              <div className="mt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#F5FEFE] border border-[#01B4BA] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <BadgePercent size={14} className="text-[#01B4BA]" />
                      <span className="font-inter text-xs font-medium text-[#01406D]">{appliedCoupon.code}</span>
                    </div>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-[#6B8FA3] hover:text-[#FF7A0F]"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code"
                      className="flex-1 font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA] placeholder:text-[#6B8FA3]" />
                    <button onClick={applyCoupon} disabled={!couponCode.trim()}
                      className="border border-[#01B4BA] text-[#01B4BA] hover:bg-[#01B4BA] hover:text-white font-poppins font-bold text-xs px-3 py-2 rounded-lg transition-all disabled:opacity-50">Apply</button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-[#01406D] justify-center">
                <Shield size={12} className="text-[#01B4BA]" />
                <span className="font-inter">100% Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
