import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Smartphone, Landmark, DollarSign, Calendar, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart } from '../store/slices/cartSlice';
import { addOrder } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import { Button } from '../components/ui/Button';
import { createRazorpayOrder, verifyPayment } from '../api/payments';
import { createOrder } from '../api/orders';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const Payment: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cartItems = useAppSelector((state) => state.cart.items);
  const addresses = useAppSelector((state) => state.auth.addresses);

  const [paymentMethod, setPaymentMethod] = useState<'wallets' | 'cards' | 'netbanking' | 'upi' | 'cash' | 'paylater'>('cash');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.isGroupBuy ? item.product.groupPrice : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const deliveryCharge = cartItems.length > 0 ? 2 : 0;
  const total = subtotal + deliveryCharge;

  const selectedAddress = addresses[0] || {
    houseNo: 'Standard Delivery Address',
    area: 'Store pickup',
    pincode: '560001',
    landmark: 'General',
  };

  const getPaymentMethodEnum = (): 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet' => {
    switch (paymentMethod) {
      case 'wallets': return 'wallet';
      case 'cards': return 'card';
      case 'netbanking': return 'netbanking';
      case 'upi': return 'upi';
      case 'cash': return 'cod';
      case 'paylater': return 'wallet';
    }
  };

  const handleRazorpayPayment = useCallback(async () => {
    if (cartItems.length === 0) {
      dispatch(addToast({ title: 'Cart is empty', message: 'Please add items to proceed', type: 'error' }));
      return;
    }

    setProcessing(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        dispatch(addToast({ title: 'Error', message: 'Failed to load payment gateway. Please try again.', type: 'error' }));
        setProcessing(false);
        return;
      }

      const addressId = (selectedAddress as any).id || (selectedAddress as any)._id || 'default';

      const orderRes = await createRazorpayOrder({
        addressId,
      });

      const { orderId, razorpayOrderId, amount, keyId } = orderRes.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        name: 'ShopYNG',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          contact: '',
        },
        theme: {
          color: '#689C37',
        },
        modal: {
          backdropclose: false,
          escape: false,
          handleback: false,
          confirm_close: true,
          ondismiss: () => {
            setProcessing(false);
            dispatch(addToast({ title: 'Payment Cancelled', message: 'You cancelled the payment', type: 'info' }));
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
            });

            if (verifyRes.success) {
              setSuccessOrderId(orderId);
              dispatch(addOrder({
                id: orderId,
                items: cartItems,
                total,
                subtotal,
                discount: 0,
                handlingFee: 5,
                deliveryFee: total >= 500 ? 0 : total >= 199 ? 15 : 25,
                status: 'confirmed',
                paymentMethod: getPaymentMethodEnum(),
                date: new Date().toISOString(),
                address: selectedAddress,
                estimatedDelivery: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
              }));
              dispatch(clearCart());
              setOrderSuccess(true);
            } else {
              dispatch(addToast({ title: 'Payment Failed', message: 'Could not verify payment', type: 'error' }));
            }
          } catch {
            dispatch(addToast({ title: 'Verification Error', message: 'Failed to verify payment. Please contact support.', type: 'error' }));
          } finally {
            setProcessing(false);
          }
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      });

      razorpay.open();
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Payment initiation failed';
      dispatch(addToast({ title: 'Error', message, type: 'error' }));
      setProcessing(false);
    }
  }, [cartItems, total, subtotal, selectedAddress, dispatch, navigate]);

  const handleCodOrder = useCallback(async () => {
    setProcessing(true);
    try {
      const addressId = (selectedAddress as any).id || (selectedAddress as any)._id || 'default';
      const orderRes = await createOrder({
        addressId,
        paymentMethod: 'cod',
      });

      const orderId = orderRes.data.id;

      setSuccessOrderId(orderId);
      dispatch(addOrder({
        id: orderId,
        items: cartItems,
        total,
        subtotal,
        discount: 0,
        handlingFee: 5,
        deliveryFee: total >= 500 ? 0 : total >= 199 ? 15 : 25,
        status: 'confirmed',
        paymentMethod: 'cod',
        date: new Date().toISOString(),
        address: selectedAddress,
        estimatedDelivery: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      }));
      dispatch(clearCart());
      setOrderSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Order creation failed';
      dispatch(addToast({ title: 'Error', message, type: 'error' }));
    } finally {
      setProcessing(false);
    }
  }, [cartItems, total, subtotal, selectedAddress, dispatch]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      dispatch(addToast({ title: 'Cart is empty', message: 'Please add items to proceed', type: 'error' }));
      return;
    }

    if (paymentMethod === 'cash') {
      handleCodOrder();
    } else {
      handleRazorpayPayment();
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6 pt-32">
        <div className="w-full max-w-[500px] bg-white border border-primary-main/15 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(1,64,109,0.1)] text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-primary-main/10 rounded-full flex items-center justify-center text-primary-main animate-pulse-slow">
            <CheckCircle size={44} />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-poppins font-extrabold text-2xl text-slate-800">Order Placed Successfully!</h1>
            <p className="font-inter text-sm text-slate-500 font-medium">Thank you for shopping at ShopYNG</p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200/80 p-5 rounded-3xl flex flex-col gap-3 font-inter text-sm text-left">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Order ID</span>
              <span className="text-slate-800 font-bold">#{successOrderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Delivery Time</span>
              <span className="text-slate-800 font-bold">25 Mins (Fast Delivery)</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2.5 mt-1 font-poppins font-bold text-slate-800">
              <span>Total {paymentMethod === 'cash' ? 'Payable' : 'Paid'}</span>
              <span className="text-primary-main">₹{total}</span>
            </div>
          </div>

          <Button onClick={() => navigate('/')} variant="primary" fullWidth className="py-4">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 min-h-screen pb-16">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 font-poppins font-bold text-sm text-primary-main hover:text-primary-dark transition-colors px-3 py-1.5 rounded-full hover:bg-primary-main/5 mb-8"
      >
        <ArrowLeft size={16} />
        Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md border border-primary-main/15 p-8 rounded-[36px] shadow-sm flex flex-col gap-6">
          <h1 className="font-poppins font-extrabold text-2xl text-slate-800">Select Payment Method</h1>

          <div className="flex flex-col gap-2">
            <label className="font-poppins font-bold text-xs text-slate-500">Choose your billing source</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {([
                { key: 'wallets', label: 'Wallets', icon: Wallet },
                { key: 'cards', label: 'Cards', icon: CreditCard },
                { key: 'netbanking', label: 'Netbanking', icon: Landmark },
                { key: 'upi', label: 'UPI', icon: Smartphone },
                { key: 'cash', label: 'Cash on Delivery', icon: DollarSign },
                { key: 'paylater', label: 'Pay Later', icon: Calendar },
              ] as const).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPaymentMethod(opt.key)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2.5 ${
                      paymentMethod === opt.key
                        ? 'bg-primary-main/10 border-primary-main text-primary-main shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-poppins font-bold text-[10px] tracking-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-2">
            {paymentMethod === 'cash' && (
              <div className="flex flex-col gap-3 p-4 bg-primary-main/5 border border-primary-main/10 rounded-3xl">
                <h3 className="font-poppins font-bold text-primary-dark text-sm">Cash on Delivery</h3>
                <p className="font-inter text-xs text-slate-500 leading-relaxed font-medium">
                  Pay in cash at your doorstep. No additional charges.
                </p>
              </div>
            )}

            {paymentMethod !== 'cash' && (
              <div className="flex flex-col gap-3 p-4 bg-primary-main/5 border border-primary-main/10 rounded-3xl">
                <h3 className="font-poppins font-bold text-primary-dark text-sm">
                  {paymentMethod === 'wallets' && 'Pay via Wallet'}
                  {paymentMethod === 'cards' && 'Pay via Credit / Debit Card'}
                  {paymentMethod === 'netbanking' && 'Pay via Netbanking'}
                  {paymentMethod === 'upi' && 'Pay via UPI'}
                  {paymentMethod === 'paylater' && 'Pay via Pay Later'}
                </h3>
                <p className="font-inter text-xs text-slate-500 leading-relaxed font-medium">
                  You will be redirected to Razorpay's secure checkout to complete your payment.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-primary-main/15 p-6.5 rounded-[36px] shadow-sm flex flex-col gap-6 self-start">
          <h2 className="font-poppins font-extrabold text-lg text-slate-800 border-b border-slate-100 pb-3">Checkout Details</h2>

          <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
            {cartItems.map((item) => {
              const activePrice = item.isGroupBuy ? item.product.groupPrice : item.product.price;
              return (
                <div key={`${item.product.id}-${item.isGroupBuy ? 'group' : 'solo'}`} className="flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-0.5 min-w-0 max-w-[160px]">
                    <span className="font-poppins font-bold text-slate-800 truncate">{item.product.name}</span>
                    <span className="font-inter text-slate-400 font-semibold">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-inter font-bold text-slate-700">₹{activePrice * item.quantity}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
            <div className="flex justify-between text-xs font-inter text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs font-inter text-slate-500">
              <span>Delivery Charge</span>
              <span className="font-semibold text-slate-700">₹{deliveryCharge}</span>
            </div>
            <div className="border-t border-slate-200/60 my-1" />
            <div className="flex justify-between items-center font-poppins text-sm font-extrabold text-slate-800">
              <span>Grand Total</span>
              <span className="text-primary-main text-base">₹{total}</span>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="w-full">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="py-4 shadow-premium"
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={18} className="animate-spin" />
                  Processing...
                </span>
              ) : paymentMethod === 'cash' ? (
                'Place Order (COD)'
              ) : (
                `Pay ₹${total} via Razorpay`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
