import React, { useState } from 'react';
import { useCart } from '../../store/useCart';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, MapPin, Wallet } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

// Add Razorpay to window object types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const { items, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getTotal();
  const handlingFee = 5;
  const deliveryFee = subtotal > 500 ? 0 : 25;
  const total = subtotal + handlingFee + deliveryFee;

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // 0. Verify Delivery Pincode with Delhivery
      toast.loading('Checking delivery serviceability...', { id: 'payment' });
      const checkPincodeFn = httpsCallable(functions, 'checkPincodeServiceability');
      const pincodeResponse = await checkPincodeFn({ pincode: '560102' });
      const { isServiceable } = pincodeResponse.data as any;

      if (!isServiceable) {
        toast.error('Sorry, we do not deliver to this pincode yet.', { id: 'payment' });
        setIsProcessing(false);
        return;
      }
      
      const vendorId = items[0].product.vendorId;
      
      // 1. Call backend to create Razorpay Order
      toast.loading('Initializing secure payment...', { id: 'payment' });
      const createOrderFn = httpsCallable(functions, 'createRazorpayOrder');
      const response = await createOrderFn({
        items,
        vendorId,
        totalAmount: total,
        deliveryAddress: '123, Sector 4, Main Road, HSR Layout, Bangalore - 560102'
      });
      
      const { razorpayOrderId, amount, currency, firestoreOrderId } = response.data as any;

      // 2. Load Razorpay Script dynamically if not present
      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // 3. Initialize Razorpay UI
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key',
        amount: amount,
        currency: currency,
        name: 'shopsyy',
        description: 'Grocery Delivery',
        order_id: razorpayOrderId,
        handler: async function (paymentResponse: any) {
          try {
            toast.loading('Verifying payment...', { id: 'payment' });
            
            // 4. Verify Payment on Backend
            const verifyFn = httpsCallable(functions, 'verifyRazorpayPayment');
            await verifyFn({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              firestoreOrderId: firestoreOrderId
            });

            toast.success('Payment successful!', { id: 'payment' });
            clearCart();
            navigate(`/order-success/${firestoreOrderId}`);
          } catch (error) {
            toast.error('Payment verification failed. Contact support.', { id: 'payment' });
          }
        },
        prefill: {
          name: 'Demo User',
          email: 'demo@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#01B4BA'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      
      rzp.open();
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Unable to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">Return to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column - Delivery & Payment */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="text-primary h-5 w-5" /> Delivery Address
            </h2>
            <button className="text-sm font-medium text-primary hover:underline">Change</button>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="font-bold flex items-center gap-2">Home <CheckCircle2 className="h-4 w-4 text-primary" /></div>
            <p className="text-gray-600 text-sm mt-1">123, Sector 4, Main Road, HSR Layout, Bangalore - 560102</p>
            <p className="text-gray-600 text-sm mt-1">Phone: +91 9876543210</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Wallet className="text-primary h-5 w-5" /> Payment Method
          </h2>
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="radio" name="payment" defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
              <div className="ml-3 flex-1">
                <span className="block font-medium">Razorpay (UPI, Cards, NetBanking)</span>
                <span className="block text-xs text-gray-500">Secure payment gateway</span>
              </div>
              <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-6" />
            </label>
            <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
              <input type="radio" name="payment" disabled className="text-primary focus:ring-primary h-4 w-4" />
              <div className="ml-3">
                <span className="block font-medium">Cash on Delivery</span>
                <span className="block text-xs text-red-500">Currently unavailable for this location</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit sticky top-24">
        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
        
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
          {items.map(item => (
            <div key={item.product.id} className="flex gap-3 text-sm">
              <div className="w-12 h-12 bg-gray-50 rounded border shrink-0 p-1 flex items-center justify-center">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <span className="line-clamp-1">{item.product.name}</span>
                <span className="text-gray-500">
                  {item.selectedVariant ? item.selectedVariant.name : item.product.unit} × {item.quantity}
                </span>
              </div>
              <div className="font-medium self-center">
                ₹{(item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-dashed">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Item Total</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Handling Charge</span>
            <span>₹{handlingFee}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span>
            {deliveryFee === 0 ? (
              <span className="text-primary font-medium">FREE</span>
            ) : (
              <span>₹{deliveryFee}</span>
            )}
          </div>
          <div className="pt-3 border-t flex justify-between font-bold text-lg">
            <span>To Pay</span>
            <span>₹{total}</span>
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full mt-6 bg-primary text-primary-foreground rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>Pay ₹{total} <ChevronRight className="h-5 w-5" /></>
          )}
        </button>
        <p className="text-center text-xs text-gray-500 mt-4 flex justify-center items-center gap-1">
          🔒 Secure payments via Razorpay
        </p>
      </div>
    </div>
  );
};
