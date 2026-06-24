import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Heart, AlertTriangle, ShoppingBag, Lock, ChevronDown, ChevronUp, X, Truck, BadgePercent } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { removeItem, updateQuantity, clearCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import { addToast, setLoginModalOpen } from '../store/slices/uiSlice';
import { api } from '../api/client';

const GST_RATE = 0.18;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const [priceAlerts, setPriceAlerts] = useState<Record<string, { oldPrice: number; newPrice: number }>>({});
  const [stockAlerts, setStockAlerts] = useState<Record<string, boolean>>({});
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);

  useEffect(() => {
    items.forEach((item) => {
      const productId = item.product?.id;
      if (productId) {
        api.get(`/products/${productId}`).then((res) => {
          const current = res.data?.data;
          if (current) {
            const currentPrice = current.price || current.groupPrice || 0;
            const cartPrice = item.product?.price || 0;
            if (Math.abs(currentPrice - cartPrice) > 0.01) {
              setPriceAlerts((prev) => ({ ...prev, [String(productId)]: { oldPrice: cartPrice, newPrice: currentPrice } }));
            }
            if (current.stock !== undefined && current.stock <= 0) {
              setStockAlerts((prev) => ({ ...prev, [String(productId)]: true }));
            }
          }
        }).catch(() => {});
      }
    });
  }, [items]);

  const subtotal = useMemo(() =>
    items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
  [items]);

  const discount = useMemo(() =>
    items.reduce((sum, item) => {
      const p = item.product?.price || 0;
      const m = item.product?.mrp || p;
      return sum + (m - p) * item.quantity;
    }, 0),
  [items]);

  const deliveryFee = subtotal >= 499 ? 0 : 49;
  const gst = subtotal * GST_RATE;
  const couponDiscount = appliedCoupon?.discount || 0;
  const totalPayable = subtotal - couponDiscount + deliveryFee + gst;

  const hasOutOfStock = Object.keys(stockAlerts).length > 0;
  const hasPriceChanges = Object.keys(priceAlerts).length > 0;

  const handleSaveForLater = (item: any) => {
    if (item.product) dispatch(addToWishlist(item.product));
    dispatch(removeItem({ productId: item.product.id, isGroupBuy: item.isGroupBuy }));
    dispatch(addToast({ type: 'info', title: 'Saved for Later', message: '' }));
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const mockDiscount = subtotal * 0.1;
    setAppliedCoupon({ code: couponCode.toUpperCase(), discount: Math.round(mockDiscount), label: '10% off' });
    dispatch(addToast({ title: 'Coupon Applied!', message: `You saved ₹${Math.round(mockDiscount)}`, type: 'success' }));
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (!user) { dispatch(setLoginModalOpen(true)); return; }
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-2xl text-[#01406D]">
          My Cart <span className="text-[#6B8FA3] text-lg font-inter font-medium">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
        </h1>
        {items.length > 0 && (
          <button onClick={() => { dispatch(clearCart()); dispatch(addToast({ type: 'info', title: 'Cart Cleared', message: '' })); }}
            className="font-inter text-sm text-[#FF7A0F] hover:underline font-medium">
            Clear All
          </button>
        )}
      </div>

      {/* Alerts */}
      {hasPriceChanges && (
        <div className="mb-4 p-3.5 bg-[#FFF7ED] border border-[#FFD6B3] rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-[#FF7A0F] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#C2410C]">Price Updates</p>
            {Object.entries(priceAlerts).map(([id, a]) => (
              <p key={id} className="text-xs text-[#9A3412] mt-0.5">Item price changed: ₹{a.oldPrice} → ₹{a.newPrice}</p>
            ))}
          </div>
        </div>
      )}
      {hasOutOfStock && (
        <div className="mb-4 p-3.5 bg-[#FFF1F0] border border-[#FFC0B3] rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-[#FF7A0F] flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-[#C2410C]">Some items are out of stock. Remove them to proceed.</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto bg-[#F5FEFE] rounded-full flex items-center justify-center mb-4">
            <ShoppingBag size={36} className="text-[#01B4BA]" />
          </div>
          <h2 className="font-poppins font-bold text-lg text-[#01406D] mb-2">Your cart is empty</h2>
          <p className="font-inter text-sm text-[#6B8FA3] mb-6">Looks like you haven't added anything yet</p>
          <button onClick={() => navigate('/')} className="bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold text-sm px-6 py-3 rounded-lg transition-all">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const p = item.product || {};
              const pid = p.id || 0;
              const price = p.price || 0;
              const mrp = p.mrp || price;
              const image = p.image || 'https://via.placeholder.com/80';
              const name = p.name || 'Product';
              const outOfStock = stockAlerts[String(pid)];
              const priceAlert = priceAlerts[String(pid)];

              return (
                <div key={`${pid}-${item.isGroupBuy}`}
                  className={`bg-white border-l-4 rounded-lg p-4 transition-all ${
                    outOfStock
                      ? 'border-l-[#FF7A0F] border-[#E0EFEF] opacity-50'
                      : priceAlert
                      ? 'border-l-[#FF7A0F] border-[#FFD6B3]'
                      : 'border-l-[#01B4BA] border-[#E0EFEF]'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-white border border-[#E0EFEF] rounded-lg overflow-hidden flex-shrink-0 p-2">
                      <img src={image} alt={name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-inter text-sm font-medium ${outOfStock ? 'text-[#6B8FA3]' : 'text-[#01406D]'} line-clamp-2`}>
                            {name}
                          </p>
                          {p.brand && <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">{p.brand}</p>}
                          {item.isGroupBuy && (
                            <span className="inline-block mt-1 text-[10px] font-poppins font-bold bg-[#FF7A0F]/10 text-[#FF7A0F] px-2 py-0.5 rounded-full">Group Buy</span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-poppins font-bold text-sm text-[#01B4BA]">₹{price.toLocaleString('en-IN')}</p>
                          {mrp > price && (
                            <p className="font-inter text-xs text-[#9CA3AF] line-through">₹{mrp.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>

                      {priceAlert && (
                        <div className="mt-2 p-2 bg-[#FFF7ED] border border-[#FFD6B3] rounded text-xs text-[#C2410C] flex items-center gap-1">
                          <AlertTriangle size={12} /> Price changed from ₹{priceAlert.oldPrice} to ₹{priceAlert.newPrice}
                        </div>
                      )}
                      {outOfStock && (
                        <div className="mt-2 p-2 bg-[#FFF1F0] border border-[#FFC0B3] rounded text-xs text-[#C2410C] flex items-center gap-1">
                          <AlertTriangle size={12} /> Out of Stock — remove to continue
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E0EFEF]/50">
                        <div className="flex items-center border border-[#01406D] rounded-lg overflow-hidden">
                          <button onClick={() => dispatch(updateQuantity({ productId: pid, isGroupBuy: item.isGroupBuy, quantity: Math.max(1, item.quantity - 1) }))}
                            disabled={outOfStock}
                            className="p-1.5 hover:bg-[#F5FEFE] transition-colors disabled:opacity-30">
                            <Minus size={14} className="text-[#01406D]" />
                          </button>
                          <span className="px-3 text-sm font-inter font-medium text-[#01406D] min-w-[28px] text-center">{item.quantity}</span>
                          <button onClick={() => dispatch(updateQuantity({ productId: pid, isGroupBuy: item.isGroupBuy, quantity: item.quantity + 1 }))}
                            disabled={outOfStock}
                            className="p-1.5 hover:bg-[#F5FEFE] transition-colors disabled:opacity-30">
                            <Plus size={14} className="text-[#01406D]" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleSaveForLater(item)}
                            className="font-inter text-xs text-[#01406D] hover:text-[#01B4BA] transition-colors flex items-center gap-1">
                            <Heart size={12} /> Save for Later
                          </button>
                          <button onClick={() => dispatch(removeItem({ productId: pid, isGroupBuy: item.isGroupBuy }))}
                            className="font-inter text-xs text-[#FF7A0F] hover:text-[#e66d0e] transition-colors flex items-center gap-1">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Free delivery progress */}
            {subtotal > 0 && subtotal < 499 && (
              <div className="bg-[#F5FEFE] border border-[#E0EFEF] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={16} className="text-[#01B4BA]" />
                  <span className="font-inter text-sm text-[#01406D] font-medium">
                    Add ₹{Math.round(499 - subtotal)} more for <span className="text-[#01B4BA]">FREE</span> delivery
                  </span>
                </div>
                <div className="w-full h-2 bg-white border border-[#E0EFEF] rounded-full overflow-hidden">
                  <div className="h-full bg-[#01B4BA] rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / 499) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-[#E0EFEF] border-t-4 border-t-[#01B4BA] rounded-lg p-5 shadow-sm">
              <h2 className="font-poppins font-bold text-base text-[#01406D] mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm font-inter">
                <div className="flex justify-between text-[#6B8FA3]">
                  <span>Item Total <span className="text-[#9CA3AF]">({items.length} {items.length === 1 ? 'item' : 'items'})</span></span>
                  <span className="text-[#01406D] font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#6B8FA3]">Discount</span>
                    <span className="text-emerald-600 font-medium">−₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-[#6B8FA3]">
                      <BadgePercent size={12} className="text-[#01B4BA]" /> {appliedCoupon.code}
                    </span>
                    <span className="text-emerald-600 font-medium">−₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#6B8FA3]">Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-medium' : 'text-[#01406D]'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>

                <div>
                  <button onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                    className="flex items-center justify-between w-full text-[#6B8FA3]">
                    <span>GST (18%)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#01406D] font-medium">₹{Math.round(gst).toLocaleString('en-IN')}</span>
                      {showGstBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </button>
                  {showGstBreakdown && (
                    <div className="mt-2 pl-2 border-l-2 border-[#01B4BA] space-y-1">
                      {items.map((item, i) => {
                        const lineGst = (item.product?.price || 0) * item.quantity * GST_RATE;
                        return (
                          <div key={i} className="flex justify-between text-xs text-[#6B8FA3]">
                            <span className="truncate flex-1">{item.product?.name?.slice(0, 30)}...</span>
                            <span className="ml-2">₹{Math.round(lineGst)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <hr className="my-3 border-[#E0EFEF]" />

              <div className="flex justify-between items-baseline">
                <span className="font-inter text-sm text-[#6B8FA3]">Total Payable</span>
                <span className="font-poppins font-bold text-xl text-[#01406D]">₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
              </div>

              {/* Coupon */}
              <div className="mt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#F5FEFE] border border-[#01B4BA] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <BadgePercent size={14} className="text-[#01B4BA]" />
                      <span className="font-inter text-xs font-medium text-[#01406D]">{appliedCoupon.code}</span>
                      <span className="font-inter text-xs text-emerald-600">−₹{appliedCoupon.discount}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-[#6B8FA3] hover:text-[#FF7A0F]">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA] placeholder:text-[#6B8FA3]"
                    />
                    <button onClick={applyCoupon} disabled={!couponCode.trim()}
                      className="border border-[#01B4BA] text-[#01B4BA] hover:bg-[#01B4BA] hover:text-white font-poppins font-bold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                )}
              </div>

              <button onClick={handleCheckout} disabled={hasOutOfStock || items.length === 0}
                className="w-full mt-5 bg-[#FF7A0F] hover:bg-[#e66d0e] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white font-poppins font-bold text-sm py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                Proceed to Checkout
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#01406D] font-inter">
                <Lock size={12} className="text-[#01B4BA]" />
                <span>100% Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
