import React from 'react';
import { X, Plus, Minus, ShoppingBag, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { useCart } from '../../store/useCart';
import { Link, useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { isOpen, setIsOpen, items, updateQuantity, getTotal, getItemCount } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const itemTotal = getTotal();
  const deliveryFee = itemTotal > 0 ? (itemTotal > 200 ? 0 : 25) : 0;
  const handlingFee = itemTotal > 0 ? 5 : 0;
  const grandTotal = itemTotal + deliveryFee + handlingFee;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-gray-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            My Cart ({getItemCount()})
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You don't have any items in your cart</h3>
            <p className="text-gray-500 mb-8">Your favourite items are just a click away</p>
            <button 
              onClick={() => setIsOpen(false)}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 p-3">
            
            {/* Delivery Estimate Banner */}
            <div className="bg-white p-4 rounded-2xl flex items-start gap-4 border border-gray-100 shadow-sm">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight mb-0.5">Delivery in 10 minutes</h3>
                <p className="text-sm text-gray-500">Shipment of {getItemCount()} items</p>
              </div>
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl p-2 border shrink-0">
                    <img 
                      src={item.product.images?.[0] || 'https://placehold.co/100x100/e2e8f0/64748b?text=Item'} 
                      alt={item.product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 line-clamp-2 pr-4 text-sm leading-tight">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedVariant?.id, item.isSubscription)}
                          className="p-1 -mr-2 -mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.selectedVariant && (
                        <p className="text-xs text-gray-500 mt-1">
                          Variant: {item.selectedVariant.label}
                        </p>
                      )}
                      {item.isSubscription && (
                        <div className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded inline-block mt-1">
                          Subscribe & Save ({item.subscriptionFrequency?.replace('_', ' ')})
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      <div className="flex flex-col">
                        {item.product.discountPercent > 0 && !item.isSubscription && (
                          <span className="text-xs text-gray-400 line-through leading-none mb-0.5">
                            ₹{item.selectedVariant ? item.selectedVariant.mrp : item.product.mrp}
                          </span>
                        )}
                        <span className="font-black text-gray-900 leading-none">
                          ₹{item.isSubscription 
                              ? (item.selectedVariant ? item.selectedVariant.price : item.product.price) * (1 - (item.product.subscriptionDiscount || 10) / 100)
                              : (item.selectedVariant ? item.selectedVariant.price : item.product.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id, item.isSubscription)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded transition-all"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id, item.isSubscription)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded transition-all"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">Bill Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">Item total</span>
                  <span className="font-medium">₹{itemTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">Delivery fee</span>
                  <span>{deliveryFee === 0 ? <span className="text-primary font-medium text-xs bg-primary/10 px-1.5 py-0.5 rounded">FREE</span> : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">Handling charge</span>
                  <span>₹{handlingFee}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-gray-900 font-bold mt-1">
                  <span>Grand total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>
            
            {/* Cancellation Policy */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-20">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Cancellation Policy</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.</p>
            </div>
          </div>
        )}

        {/* Floating Checkout Footer */}
        {items.length > 0 && (
          <div className="bg-white border-t p-4 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
            <button 
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-4 flex items-center justify-between transition-colors shadow-lg active:scale-[0.98]"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[11px] font-medium opacity-90">₹{grandTotal}</span>
                <span className="font-extrabold text-sm uppercase tracking-wide">Total</span>
              </div>
              <div className="flex items-center gap-2 font-bold">
                Login to Proceed
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
