import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { useCart } from '../../store/useCart';
import { Minus, Plus, ChevronLeft, Star, Truck, Shield, RotateCcw, MapPin, Store } from 'lucide-react';
import type { ProductVariant, Product } from '../../types';
import { toast } from 'react-hot-toast';
import { publicApi } from '../../lib/api';
import { ProductCard } from '../../components/buyer/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(productId || '');
  const { data: allRelatedProducts } = useProducts(undefined, product?.category);
  const relatedProducts = allRelatedProducts?.filter(p => p.id !== product?.id).slice(0, 4) || [];
  const { items, addItem, updateQuantity } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<'1_week' | '2_weeks' | '1_month' | '2_months'>('1_month');

  // Pincode state
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pincodeMessage, setPincodeMessage] = useState('');

  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product?.mrp || 0;

  const cartItem = product ? items.find(item =>
    item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id
  ) : undefined;
  const quantityInCart = cartItem?.quantity || 0;

  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product]);

  const handleAddItem = () => {
    if (!product) return;
    try {
      addItem(product, 1, selectedVariant, isSubscription, subscriptionFrequency);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) return;
    setPincodeStatus('loading');
    setPincodeMessage('');
    try {
      const res = await publicApi.checkPincode(pincode);
      if (res.success && res.data.serviceable) {
        setPincodeStatus('success');
        setPincodeMessage(res.data.message || `Delivery available within ${res.data.estimatedDays || 3} days!`);
      } else {
        setPincodeStatus('error');
        setPincodeMessage(res.data?.message || 'Sorry, we do not deliver to this pin code yet.');
      }
    } catch (err: any) {
      setPincodeStatus('error');
      setPincodeMessage(err.response?.data?.error?.message || 'Failed to check pin code.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product not found</h2>
        <p className="text-gray-500 mb-6">This product may have been removed or is unavailable.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-8 flex items-center justify-center aspect-square sticky top-24">
            <img
              src={images[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
            />
            {product.discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded shadow-sm">
                {product.discountPercent}% OFF
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === idx ? 'border-primary' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">{product.category}</div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
              {product.brand && (
                <span className="block text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{product.brand}</span>
              )}
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {product.unit}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="font-bold text-gray-900">{product.rating}</span>
                <span className="text-gray-400">({product.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Purchase Options */}
          <div className="space-y-4">
            {product.isSubscriptionEligible && (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200 bg-white shadow-sm">
                <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${!isSubscription ? 'bg-primary/5' : ''}`}>
                  <input
                    type="radio"
                    name="purchaseType"
                    checked={!isSubscription}
                    onChange={() => setIsSubscription(false)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block">One-time purchase</span>
                    <span className="text-sm text-gray-500">₹{currentPrice}</span>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSubscription ? 'bg-primary/5' : ''}`}>
                  <input
                    type="radio"
                    name="purchaseType"
                    checked={isSubscription}
                    onChange={() => setIsSubscription(true)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">Subscribe & Save</span>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shadow-sm">
                        Save {product.subscriptionDiscount || 10}%
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 line-through mr-2">₹{currentPrice}</span>
                    <span className="text-sm font-bold text-primary">₹{(currentPrice * (1 - (product.subscriptionDiscount || 10) / 100)).toFixed(2)}</span>
                  </div>
                </label>
                {isSubscription && (
                  <div className="p-4 bg-gray-50/50">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Frequency</label>
                    <select
                      value={subscriptionFrequency}
                      onChange={(e) => setSubscriptionFrequency(e.target.value as any)}
                      className="w-full text-sm border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white shadow-sm"
                    >
                      <option value="1_week">Every 1 Week</option>
                      <option value="2_weeks">Every 2 Weeks</option>
                      <option value="1_month">Every 1 Month</option>
                      <option value="2_months">Every 2 Months</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                {product.discountPercent > 0 && !isSubscription && (
                  <span className="text-sm text-gray-400 line-through">MRP ₹{currentMrp}</span>
                )}
                <span className="text-3xl font-black text-gray-900">
                  ₹{isSubscription ? (currentPrice * (1 - (product.subscriptionDiscount || 10) / 100)).toFixed(2) : currentPrice}
                </span>
                <span className="text-xs text-gray-500 mt-1">Inclusive of all taxes</span>
              </div>
              <div className="w-32 h-12">
                {quantityInCart === 0 ? (
                  <button
                    onClick={handleAddItem}
                    className="w-full h-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                  >
                    {addedToCart ? '✓ Added' : 'ADD'}
                  </button>
                ) : (
                  <div className="flex items-center bg-primary text-primary-foreground rounded-xl h-full shadow-sm overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, quantityInCart - 1, selectedVariant?.id, isSubscription)}
                      className="flex-1 flex items-center justify-center h-full hover:bg-primary/90 transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-base font-bold w-10 text-center">{quantityInCart}</span>
                    <button
                      onClick={() => addItem(product, 1, selectedVariant, isSubscription, subscriptionFrequency)}
                      className="flex-1 flex items-center justify-center h-full hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
              <span className="text-xs font-bold text-gray-700">10 min delivery</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
              <span className="text-xs font-bold text-gray-700">100% genuine</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <RotateCcw className="h-5 w-5 mx-auto mb-1 text-primary" />
              <span className="text-xs font-bold text-gray-700">Easy returns</span>
            </div>
          </div>

          {/* Pincode Checker */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Check Delivery Option
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              />
              <button
                onClick={handleCheckPincode}
                disabled={pincode.length !== 6 || pincodeStatus === 'loading'}
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {pincodeStatus === 'loading' ? 'Checking...' : 'Check'}
              </button>
            </div>
            {pincodeStatus === 'success' && <p className="text-sm text-green-600 mt-2 font-medium">{pincodeMessage}</p>}
            {pincodeStatus === 'error' && <p className="text-sm text-red-500 mt-2 font-medium">{pincodeMessage}</p>}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Select Variant</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant: ProductVariant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`px-4 py-2 border rounded-xl text-sm font-medium transition-all ${
                      selectedVariantId === variant.id
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-primary'
                    } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                    disabled={variant.stock === 0}
                  >
                    {variant.name}
                    {variant.stock === 0 && ' (Out of Stock)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Specifications</h3>
              <div className="border rounded-xl divide-y text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 p-3">
                    <div className="font-medium text-gray-600">{key}</div>
                    <div className="col-span-2 text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full h-px bg-gray-100" />

          <div>
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          </div>

          {product.vendorId && (
            <div className="mt-6 pt-6 border-t">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border text-gray-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Sold by Verified Vendor</h4>
                    <p className="text-xs text-gray-500">View their complete catalog</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/seller/${product.vendorId}`)}
                  className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                >
                  Visit Store
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map(rp => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
