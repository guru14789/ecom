import React, { useState, useEffect } from 'react';
import { useCart } from '../../store/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronRight, MapPin, Wallet, Plus, Edit3, Trash2, Sparkles
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import type { Address } from '../../types';
import { buyerApi } from '../../lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [usePoints, setUsePoints] = useState(false);

  const [addressForm, setAddressForm] = useState({
    houseNo: '',
    area: '',
    pincode: '',
    landmark: '',
    city: '',
    state: '',
    tag: 'home' as 'home' | 'work' | 'other',
  });

  const isDigitalOnly = items.length > 0 && items.every(i => i.product.productType === 'digital');

  useEffect(() => {
    if (user?.addresses) {
      setSavedAddresses(user.addresses);
      if (user.addresses.length > 0) {
        setSelectedAddress(user.addresses[0]);
      }
    }
  }, [user]);

  const subtotal = getTotal();
  const handlingFee = 5;
  const deliveryFee = isDigitalOnly ? 0 : (subtotal > 500 ? 0 : 25);
  const subtotalWithFees = subtotal + handlingFee + deliveryFee;

  const pointsAvailable = user?.pointsBalance || 0;
  const pointsValue = pointsAvailable / 10;
  const pointsDiscount = usePoints ? Math.min(pointsValue, subtotalWithFees) : 0;
  const pointsUsed = usePoints ? pointsDiscount * 10 : 0;
  const total = subtotalWithFees - pointsDiscount;

  const handleSaveAddress = async () => {
    if (!user || !user.uid) return toast.error('Please login first');

    const newAddress: Address = {
      ...addressForm,
      id: editingAddress?.id || Date.now().toString(),
    };

    try {
      const userRef = doc(db, 'users', user.uid);
      const existingAddresses = savedAddresses.filter(a => a.id !== editingAddress?.id);
      const updatedAddresses = [...existingAddresses, newAddress];
      await updateDoc(userRef, { addresses: updatedAddresses });

      setSavedAddresses(updatedAddresses);
      setSelectedAddress(newAddress);
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({ houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'home' });
      toast.success('Address saved!');
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addr: Address) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedAddresses = savedAddresses.filter(a => a.id !== addr.id);
      await updateDoc(userRef, { addresses: updatedAddresses });
      setSavedAddresses(updatedAddresses);
      if (selectedAddress?.id === addr.id) setSelectedAddress(updatedAddresses[0] || null);
      toast.success('Address removed');
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }
    if (!isDigitalOnly && !selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    if (items.length === 0) return;

    try {
      setIsProcessing(true);
      toast.loading('Initializing secure payment...', { id: 'payment' });

      // Sync the frontend cart state to the backend database first to prevent empty cart validation errors
      const cartItemsPayload = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        isGroupBuy: false,
        variantId: item.selectedVariant?.id || '',
      }));
      await buyerApi.cart.sync(cartItemsPayload);

      // Create backend order first via buyerApi.payments.createOrder API
      const resOrder = await buyerApi.payments.createOrder({
        addressId: selectedAddress?.id || 'digital',
      });

      const { orderId, razorpayOrderId, amount, currency, keyId } = resOrder.data;

      // Handle COD directly
      if (paymentMethod === 'cod') {
        // Confirm the COD transaction route or handle manual update
        toast.success('Order placed successfully!', { id: 'payment' });
        clearCart();
        navigate(`/orders/${orderId}`);
        return;
      }

      // Dynamically load Razorpay SDK if not present
      if (!window.Razorpay) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Shopsyy',
        description: `Order #${orderId.slice(-6)}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        handler: async (paymentResponse: any) => {
          try {
            toast.loading('Verifying payment...', { id: 'payment' });
            await buyerApi.payments.verify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              order_id: orderId,
            });
            toast.success('Payment successful!', { id: 'payment' });
            clearCart();
            navigate(`/orders/${orderId}`);
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed.', { id: 'payment' });
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.dismiss('payment');
          },
        },
        theme: { color: '#f97316' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`, { id: 'payment' });
      });
      rzp.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Unable to initiate payment', { id: 'payment' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 px-4">
      <div className="md:col-span-2 space-y-6">
        {!isDigitalOnly && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="text-primary h-5 w-5" /> Delivery Address
              </h2>
              {showAddressForm && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!navigator.geolocation) {
                      toast.error('Geolocation is not supported by your browser');
                      return;
                    }
                    toast.loading('Fetching live location...', { id: 'loc' });
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const { latitude, longitude } = pos.coords;
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                          if (!res.ok) throw new Error();
                          const data = await res.json();
                          const addr = data.address || {};
                          
                          setAddressForm({
                            houseNo: addr.suburb || addr.neighbourhood || addr.road || 'Live Location',
                            area: addr.suburb || addr.county || addr.state_district || '',
                            city: addr.city || addr.town || addr.village || '',
                            state: addr.state || '',
                            pincode: addr.postcode || '',
                            landmark: addr.amenity || addr.shop || '',
                            tag: 'home',
                          });
                          toast.success('Location detected!', { id: 'loc' });
                        } catch {
                          toast.error('Failed to resolve address details. Please input manually.', { id: 'loc' });
                        }
                      },
                      () => {
                        toast.error('Permission denied. Unable to fetch coordinates.', { id: 'loc' });
                      }
                    );
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  📍 Use Live Location
                </button>
              )}
            </div>

            {savedAddresses.length > 0 && !showAddressForm ? (
              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddress?.id === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                          {addr.tag}
                        </span>
                        {selectedAddress?.id === addr.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddress(addr);
                            setAddressForm(addr);
                            setShowAddressForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary rounded"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-900 font-medium">{addr.houseNo}, {addr.area}</p>
                    <p className="text-gray-500 text-sm">{addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>
                ))}
                <button
                  onClick={() => { setEditingAddress(null); setAddressForm({ houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'home' }); setShowAddressForm(true); }}
                  className="flex items-center gap-2 text-primary font-medium text-sm hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add New Address
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House / Flat No.</label>
                    <input
                      type="text"
                      value={addressForm.houseNo}
                      onChange={(e) => setAddressForm(p => ({ ...p, houseNo: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="123, Sector 4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality</label>
                    <input
                      type="text"
                      value={addressForm.area}
                      onChange={(e) => setAddressForm(p => ({ ...p, area: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="HSR Layout"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm(p => ({ ...p, state: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm(p => ({ ...p, pincode: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                    <select
                      value={addressForm.tag}
                      onChange={(e) => setAddressForm(p => ({ ...p, tag: e.target.value as any }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (optional)</label>
                    <input
                      type="text"
                      value={addressForm.landmark || ''}
                      onChange={(e) => setAddressForm(p => ({ ...p, landmark: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="Near City Mall"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveAddress}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
                  >
                    Save Address
                  </button>
                  <button
                    onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Wallet className="text-primary h-5 w-5" /> Payment Method
          </h2>
          <div className="space-y-3">
            <label
              onClick={() => setPaymentMethod('razorpay')}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'razorpay'}
                readOnly
                className="text-primary focus:ring-primary h-4 w-4"
              />
              <div className="ml-3 flex-1">
                <span className="block font-medium">Razorpay (UPI, Cards, NetBanking)</span>
                <span className="block text-xs text-gray-500">Secure payment gateway</span>
              </div>
              <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-6" />
            </label>
            <label
              onClick={() => setPaymentMethod('cod')}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                readOnly
                className="text-primary focus:ring-primary h-4 w-4"
              />
              <div className="ml-3">
                <span className="block font-medium">Cash on Delivery</span>
                <span className="block text-xs text-gray-500">Pay when you receive</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit sticky top-24">
        <h2 className="text-lg font-bold mb-4">Order Summary</h2>

        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
          {items.map(item => (
            <div key={item.product.id + (item.selectedVariant?.id || '')} className="flex gap-3 text-sm">
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
          
          {pointsAvailable > 0 && (
            <div className="pt-4 mt-2 border-t border-dashed">
              <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Use shopyng Points</p>
                    <p className="text-xs text-gray-500">Balance: {pointsAvailable} (₹{pointsValue})</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
              
              {usePoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-purple-600 font-medium mt-3 px-2">
                  <span>Points Applied (-{pointsUsed})</span>
                  <span>-₹{pointsDiscount}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t flex justify-between font-bold text-lg">
            <span>To Pay</span>
            <span>₹{total}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing || items.length === 0}
          className="w-full mt-6 bg-primary text-primary-foreground rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>{paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${total}`} <ChevronRight className="h-5 w-5" /></>
          )}
        </button>
        <p className="text-center text-xs text-gray-500 mt-4 flex justify-center items-center gap-1">
          🔒 {paymentMethod === 'razorpay' ? 'Secure payments via Razorpay' : 'Pay when you receive'}
        </p>
      </div>
    </div>
  );
};
