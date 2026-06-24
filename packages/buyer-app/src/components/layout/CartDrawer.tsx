import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Heart, AlertTriangle, Minus, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeItem, updateQuantity, clearCart } from '../../store/slices/cartSlice';
import { addToWishlist } from '../../store/slices/wishlistSlice';
import { addToast, setCartOpen, setLoginModalOpen } from '../../store/slices/uiSlice';
import { api } from '../../api/client';

const GST_RATE = 0.18;

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items } = useAppSelector((s) => s.cart);
  const { isCartOpen } = useAppSelector((s) => s.ui);
  const user = useAppSelector((s) => s.auth.user);
  const [priceInfo, setPriceInfo] = useState({ subtotal: 0, discount: 0, deliveryFee: 0, gst: 0, couponDiscount: 0, total: 0 });
  const [priceAlerts, setPriceAlerts] = useState<Record<string, { oldPrice: number; newPrice: number }>>({});
  const [stockAlerts, setStockAlerts] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const discount = items.reduce((sum, item) => {
      const p = item.product?.price || 0;
      const m = item.product?.mrp || p;
      return sum + (m - p) * item.quantity;
    }, 0);
    const deliveryFee = subtotal >= 499 ? 0 : 49;
    const gst = subtotal * GST_RATE;
    setPriceInfo({ subtotal, discount, deliveryFee, gst, couponDiscount: 0, total: subtotal + deliveryFee + gst });
  }, [items]);

  const handleClose = () => dispatch(setCartOpen(false));

  const handleCheckout = () => {
    handleClose();
    if (!user) { dispatch(setLoginModalOpen(true)); return; }
    navigate('/checkout');
  };

  const handleSaveForLater = (item: any) => {
    if (item.product) dispatch(addToWishlist(item.product));
    dispatch(removeItem({ productId: item.product.id, isGroupBuy: item.isGroupBuy }));
    dispatch(addToast({ type: 'info', title: 'Saved', message: 'Saved for later' }));
  };

  const hasOutOfStock = Object.keys(stockAlerts).length > 0;
  const hasPriceChanges = Object.keys(priceAlerts).length > 0;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transition-transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-teal" />
              <h2 className="font-artz font-bold text-navy">Your Cart ({items.length})</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-400" /></button>
          </div>

          {hasPriceChanges && (
            <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Price Updates</p>
              {Object.entries(priceAlerts).map(([id, a]) => (
                <p key={id} className="text-xs text-amber-600">Item price changed: ₹{a.oldPrice} → ₹{a.newPrice}</p>
              ))}
            </div>
          )}
          {hasOutOfStock && (
            <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertTriangle size={12} /> Some items are out of stock. Remove them to proceed.</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => {
                const p = item.product || {};
                const pid = p.id || 0;
                const price = p.price || 0;
                const mrp = p.mrp || price;
                const image = p.image || 'https://via.placeholder.com/80';
                const name = p.name || 'Product';
                const outOfStock = stockAlerts[String(pid)];
                const priceAlert = priceAlerts[String(pid)];

                return (
                  <div key={pid} className={`bg-white border rounded-xl p-3 ${outOfStock ? 'border-red-200 bg-red-50/30' : priceAlert ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                    <div className="flex gap-3">
                      <img src={image} alt={name} className="w-16 h-16 rounded-lg object-cover bg-slate-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-navy">₹{price}</span>
                          {mrp > price && <span className="text-xs text-slate-400 line-through">₹{mrp}</span>}
                        </div>
                        {priceAlert && <p className="text-xs text-amber-600 mt-0.5">Price changed: ₹{priceAlert.oldPrice} → ₹{priceAlert.newPrice}</p>}
                        {outOfStock && <p className="text-xs text-red-600 mt-0.5 font-semibold">Out of Stock</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <button onClick={() => dispatch(updateQuantity({ productId: pid, isGroupBuy: item.isGroupBuy, quantity: Math.max(1, item.quantity - 1) }))} disabled={outOfStock} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => dispatch(updateQuantity({ productId: pid, isGroupBuy: item.isGroupBuy, quantity: item.quantity + 1 }))} disabled={outOfStock} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><Plus size={14} /></button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSaveForLater(item)} className="p-1.5 hover:bg-teal/10 rounded-lg" title="Save for later"><Heart size={14} className="text-slate-400" /></button>
                        <button onClick={() => dispatch(removeItem({ productId: pid, isGroupBuy: item.isGroupBuy }))} className="p-1.5 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 size={14} className="text-red-400" /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-slate-100 p-4 space-y-2 bg-slate-50/50">
              <button onClick={() => { handleClose(); navigate('/cart'); }} className="w-full text-center font-inter text-xs text-[#01B4BA] hover:underline mb-1">
                View Full Cart →
              </button>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal ({items.length} items)</span><span className="font-medium">₹{Math.round(priceInfo.subtotal)}</span></div>
              {priceInfo.discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span className="font-medium text-green-600">-₹{Math.round(priceInfo.discount)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-slate-500">Delivery</span><span className="font-medium">{priceInfo.deliveryFee === 0 ? <span className="text-green-600">FREE</span> : `₹${priceInfo.deliveryFee}`}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">GST (18%)</span><span className="font-medium">₹{Math.round(priceInfo.gst)}</span></div>
              {priceInfo.subtotal < 499 && priceInfo.deliveryFee > 0 && (
                <p className="text-xs text-teal">Add ₹{Math.round(499 - priceInfo.subtotal)} more for FREE delivery</p>
              )}
              <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2"><span>Order Total</span><span className="text-teal">₹{Math.round(priceInfo.total)}</span></div>
              <button onClick={handleCheckout} disabled={hasOutOfStock} className="w-full mt-3 bg-teal text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Proceed to Checkout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;