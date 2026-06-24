import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Heart, Share2, Star, Users, ArrowLeft, Minus, Plus,
  Truck, Shield, RefreshCcw, Zap, Check, X, Clock, HelpCircle,
  MessageSquare, ThumbsUp, Loader2, MapPin, CreditCard, ChevronDown, Store,
  Play, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getProductById } from '../api/products';
import { getProductReviews, createReview } from '../api/reviews';
import { getProductQuestions, createQuestion, createAnswer, markAnswerHelpful } from '../api/questions';
import { getDeliveryEstimate } from '../api/checkout';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToast, setLoginModalOpen } from '../store/slices/uiSlice';
import { Product, ProductVariant, DeliveryOption, ReviewItem, Question } from '../types';
import { api } from '../api/client';
import { useSocket } from '../hooks/useSocket';

const STAR_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

function calculateEMI(principal: number, rate: number, tenure: number): number {
  const mr = rate / 12 / 100;
  return Math.round((principal * mr * Math.pow(1 + mr, tenure)) / (Math.pow(1 + mr, tenure) - 1));
}

function calculateDiscount(mrp: number, price: number): number {
  return Math.round(((mrp - price) / mrp) * 100);
}

const RatingDistribution: React.FC<{ distribution: Record<number, number>; total: number; average: number }> =
  ({ distribution, total, average }) => (
    <div className="flex gap-8 items-start">
      <div className="text-center min-w-[100px]">
        <div className="text-5xl font-poppins font-extrabold text-[#01406D]">{average.toFixed(1)}</div>
        <div className="flex items-center gap-0.5 mt-2 justify-center">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={16} className={s <= Math.round(average) ? 'fill-[#FF7A0F] text-[#FF7A0F]' : 'text-slate-200'} />
          ))}
        </div>
        <div className="font-inter text-xs text-[#6B8FA3] mt-1">{total} reviews</div>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((s) => {
          const pct = total > 0 ? (distribution[s] || 0) / total * 100 : 0;
          return (
            <div key={s} className="flex items-center gap-2">
              <span className="font-inter text-xs text-slate-500 w-6">{s}</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${STAR_COLORS[s]}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="font-inter text-xs text-[#6B8FA3] w-6 text-right">{distribution[s] || 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

const ReviewCard: React.FC<{ review: ReviewItem }> = ({ review }) => (
  <div className="border border-[#E0EFEF] rounded-lg p-4 bg-white">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-full bg-[#01B4BA]/10 flex items-center justify-center text-[#01B4BA] font-poppins font-bold text-xs">
        {review.userId.slice(-2).toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={12} className={s <= review.rating ? 'fill-[#FF7A0F] text-[#FF7A0F]' : 'text-slate-200'} />
          ))}
        </div>
        <span className="font-inter text-xs text-[#6B8FA3]">{new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
      </div>
      {review.isVerifiedPurchase && (
        <span className="ml-auto flex items-center gap-1 text-[10px] text-white font-bold bg-[#01B4BA] px-2 py-0.5 rounded-full">
          <Check size={10} /> Verified
        </span>
      )}
    </div>
    {review.title && <h4 className="font-poppins font-bold text-sm text-[#01406D] mb-1">{review.title}</h4>}
    <p className="font-inter text-sm text-slate-600 leading-relaxed">{review.body}</p>
    {review.images?.length > 0 && (
      <div className="flex gap-2 mt-2">
        {review.images.map((img, i) => (
          <img key={i} src={img.url} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#E0EFEF] cursor-pointer hover:opacity-80" />
        ))}
      </div>
    )}
    <button className="flex items-center gap-1 text-xs text-[#6B8FA3] hover:text-[#01B4BA] mt-2 transition-colors">
      <ThumbsUp size={12} /> Helpful ({review.helpfulCount})
    </button>
  </div>
);

const WriteReview: React.FC<{ productId: string; onSubmitted: () => void }> = ({ productId, onSubmitted }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.isLoggedIn) { dispatch(setLoginModalOpen(true)); return; }
    if (!rating || !body.trim()) return;
    setSubmitting(true);
    try {
      await createReview({ productId, orderId: '', rating, title, body });
      dispatch(addToast({ title: 'Review Submitted', message: 'Thank you for your feedback!', type: 'success' }));
      onSubmitted();
    } catch { dispatch(addToast({ title: 'Error', message: 'Failed to submit review', type: 'error' })); }
    setSubmitting(false);
  };

  return (
    <div className="border border-[#E0EFEF] rounded-lg p-4 bg-white">
      <h4 className="font-poppins font-bold text-sm text-[#01406D] mb-3">Write a Review</h4>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
            <Star size={22} className={s <= rating ? 'fill-[#FF7A0F] text-[#FF7A0F]' : 'text-slate-200'} />
          </button>
        ))}
      </div>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 mb-2 outline-none focus:border-[#01B4BA]" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 mb-3 outline-none focus:border-[#01B4BA] resize-none" />
      <button onClick={handleSubmit} disabled={submitting || !rating || !body.trim()} className="bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold text-xs px-5 py-2.5 rounded-lg transition-all disabled:opacity-50">
        {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Submit Review'}
      </button>
    </div>
  );
};

const QASection: React.FC<{ productId: string }> = ({ productId }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQ, setNewQ] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getProductQuestions(productId);
      setQuestions(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const ask = async () => {
    if (!user?.isLoggedIn) { dispatch(setLoginModalOpen(true)); return; }
    if (!newQ.trim()) return;
    try {
      await createQuestion(productId, newQ);
      setNewQ('');
      dispatch(addToast({ title: 'Question Posted', type: 'success', message: '' }));
      load();
    } catch { dispatch(addToast({ title: 'Error', message: 'Failed to post question', type: 'error' })); }
  };

  const answer = async (qId: string) => {
    if (!answers[qId]?.trim()) return;
    try {
      await createAnswer(qId, answers[qId]);
      setAnswers((p) => ({ ...p, [qId]: '' }));
      dispatch(addToast({ title: 'Answer Posted', type: 'success', message: '' }));
      load();
    } catch { dispatch(addToast({ title: 'Error', message: 'Failed to post answer', type: 'error' })); }
  };

  if (loading) return <Loader2 size={20} className="animate-spin mx-auto my-8 text-[#01B4BA]" />;
  return (
    <div>
      <h3 className="font-poppins font-bold text-base text-[#01406D] mb-4 flex items-center gap-2">
        <HelpCircle size={16} /> Questions & Answers ({questions.length})
      </h3>
      <div className="flex gap-2 mb-6">
        <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Ask a question..." className="flex-1 font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" />
        <button onClick={ask} className="bg-[#01B4BA] text-white font-poppins font-bold text-xs px-4 py-2 rounded-lg">Ask</button>
      </div>
      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q._id} className="border border-[#E0EFEF] rounded-lg p-4 bg-white">
            <p className="font-inter text-sm text-slate-700 font-medium flex items-start gap-2">
              <MessageSquare size={14} className="text-[#01B4BA] mt-0.5 flex-shrink-0" />
              {q.body}
            </p>
            {q.answers.map((a) => (
              <div key={a._id} className="ml-6 mt-2 pl-3 border-l-2 border-[#01B4BA]/30">
                <p className="font-inter text-sm text-slate-600">{a.body}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-inter text-[#6B8FA3]">{a.userType === 'vendor' ? 'Seller' : 'Buyer'}</span>
                  <button onClick={() => markAnswerHelpful(q._id, a._id)} className="flex items-center gap-1 text-[10px] text-[#6B8FA3] hover:text-[#01B4BA]">
                    <ThumbsUp size={10} /> {a.helpfulCount}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2 ml-6">
              <input value={answers[q._id] || ''} onChange={(e) => setAnswers((p) => ({ ...p, [q._id]: e.target.value }))} placeholder="Write an answer..." className="flex-1 font-inter text-xs border border-[#E0EFEF] rounded-lg px-2 py-1.5 outline-none" />
              <button onClick={() => answer(q._id)} className="text-xs font-poppins font-bold text-[#01B4BA] px-2">Answer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RelatedProductCard: React.FC<{ product: any; onClick: (id: number) => void }> = ({ product, onClick }) => {
  const disc = product.mrp ? calculateDiscount(product.mrp, product.price) : 0;
  return (
    <div onClick={() => onClick(product.id)} className="bg-white border border-[#E0EFEF] rounded-lg overflow-hidden cursor-pointer hover:shadow-sm transition-shadow group">
      <div className="aspect-square bg-white p-4 relative">
        <img src={`/${product.image}`} alt={product.name} className="w-full h-full object-contain" />
        {disc > 0 && <span className="absolute top-2 left-2 bg-[#FF7A0F] text-white text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full">-{disc}%</span>}
      </div>
      <div className="p-3">
        <p className="font-inter text-sm text-[#01406D] font-medium line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={11} className="fill-[#FF7A0F] text-[#FF7A0F]" />
          <span className="font-inter text-xs text-slate-500">{product.rating}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-poppins font-bold text-sm text-[#01B4BA]">₹{product.price.toLocaleString('en-IN')}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="font-inter text-xs text-[#9CA3AF] line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const wishlist = useAppSelector((s) => s.wishlist.items);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'qa'>('details');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryOption[] | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [showEMI, setShowEMI] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingDist, setRatingDist] = useState<Record<number, number>>({});
  const [avgRating, setAvgRating] = useState(0);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveStock, setLiveStock] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const firebaseUid = useAppSelector((s) => s.auth.firebaseUid);
  const { subscribeProduct } = useSocket(firebaseUid || undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  const product = data?.data;

  useEffect(() => {
    if (!id) return;
    getProductReviews(id).then((r) => {
      setReviews(r.data || []);
      setRatingDist(r.ratingDistribution || {});
      setAvgRating(r.averageRating || 0);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    const p = product as any;
    if (p?.vendorId) {
      api.get(`/vendor/settings`).then((res: any) => {
        if (res?.data) setSellerInfo({ ...res.data, rating: p.rating, totalReviews: p.reviews, responseRate: 95, shippingScore: 4, fulfillmentRate: 98 });
      }).catch(() => {});
    }
  }, [product]);

  useEffect(() => {
    setLivePrice(null);
    setLiveStock(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeProduct(id, (data: any) => {
      if (data.price !== undefined) setLivePrice(data.price);
      if (data.stock !== undefined) setLiveStock(data.stock);
    });
    return unsub;
  }, [id, subscribeProduct]);

  const isWishlisted = wishlist.some((w) => w.product.id === product?.id);
  const effectivePrice = selectedVariant ? product!.price + (selectedVariant.priceModifier || 0) : product?.price || 0;
  const displayPrice = livePrice ?? effectivePrice;
  const displayStock = liveStock ?? product?.stock ?? 0;
  const disc = product?.mrp ? calculateDiscount(product.mrp, displayPrice) : 0;

  const images = useMemo(() => {
    if (!product) return [];
    return [product.image, ...(product.images || [])].slice(0, 5);
  }, [product]);

  const checkDelivery = async () => {
    if (!deliveryPincode || deliveryPincode.length !== 6) return;
    setDeliveryLoading(true);
    try {
      const res = await getDeliveryEstimate(deliveryPincode, id);
      setDeliveryEstimate(res.data.options);
    } catch {
      setDeliveryEstimate([{ type: 'standard', label: 'Standard Delivery', charge: 0, estimatedDays: '3-5 days', estimatedDate: 'Mon, 20 Apr' }]);
    }
    setDeliveryLoading(false);
  };

  const handleAddToCart = () => {
    if (!user?.isLoggedIn) { dispatch(setLoginModalOpen(true)); return; }
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      dispatch(addItem({ product, quantity: 1, isGroupBuy: false }));
    }
    dispatch(addToast({ title: 'Added to Cart', message: `${product.name} x${qty}`, type: 'success' }));
  };

  const handleBuyNow = () => {
    if (!user?.isLoggedIn) { dispatch(setLoginModalOpen(true)); return; }
    handleAddToCart();
    navigate('/checkout');
  };

  const handleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      dispatch(addToast({ title: 'Link Copied', type: 'info', message: '' }));
    }
  };

  const handleRelatedClick = (productId: number) => {
    navigate(`/product/${productId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 size={40} className="animate-spin text-[#01B4BA]" /></div>;
  if (isError || !product) return <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 text-center"><h2 className="font-poppins font-bold text-xl text-[#01406D]">Product not found</h2><button onClick={() => navigate(-1)} className="mt-4 text-[#01B4BA] underline">Go back</button></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-[#6B8FA3] hover:text-[#01B4BA] mb-4 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#01406D] mb-4">
        <Link to="/" className="hover:text-[#01B4BA]">Home</Link>
        <span className="text-[#6B8FA3]">/</span>
        <span className="text-[#6B8FA3]">{product.category}</span>
        {product.subcategory && (
          <>
            <span className="text-[#6B8FA3]">/</span>
            <span className="text-[#6B8FA3]">{product.subcategory}</span>
          </>
        )}
      </nav>

      {/* 2-Column Above Fold */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-12">
        {/* Left Column - Media (4/10 = 40%) */}
        <div className="lg:col-span-4">
          <div className="space-y-4">
            {/* Main Image */}
            <div
              ref={imageContainerRef}
              className="bg-white border border-[#E0EFEF] rounded-lg overflow-hidden aspect-square relative cursor-crosshair"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => { setIsZoomed(false); setZoomPos({ x: 50, y: 50 }); }}
              onMouseMove={(e) => {
                if (!imageContainerRef.current) return;
                const rect = imageContainerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setZoomPos({ x, y });
              }}
            >
              <div
                className="w-full h-full p-8"
                style={{
                  backgroundImage: `url(/${product.images?.[selectedImage] || product.image})`,
                  backgroundSize: isZoomed ? '250%' : 'contain',
                  backgroundPosition: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              {disc > 0 && <span className="absolute top-3 left-3 bg-[#FF7A0F] text-white text-xs font-poppins font-bold px-2.5 py-1 rounded-full">-{disc}%</span>}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all relative ${selectedImage === i ? 'border-[#01B4BA]' : 'border-[#E0EFEF]'}`}>
                  <img src={`/${img}`} alt="" className="w-full h-full object-contain p-1" />
                  {i === images.length - 1 && images.length > 1 && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play size={16} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Info (6/10 = 60%) */}
        <div className="lg:col-span-6">
          <div className="space-y-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-[#01B4BA] uppercase text-xs tracking-wider font-inter font-semibold">{product.brand}</p>
            )}

            {/* Product Title */}
            <h1 className="font-poppins font-bold text-2xl text-[#01406D] leading-tight line-clamp-3">{product.name}</h1>

            {product.sku && (
              <p className="font-inter text-xs text-[#6B8FA3]">SKU: {product.sku}</p>
            )}

            {/* Rating Row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'fill-[#FF7A0F] text-[#FF7A0F]' : 'text-slate-200'} />
                ))}
              </div>
              <span className="font-inter text-sm text-[#01B4BA] underline cursor-pointer hover:no-underline">{product.reviews.toLocaleString()} reviews</span>
              <span className="text-[#6B8FA3] text-xs">|</span>
              <span className="font-inter text-xs text-[#6B8FA3]">{product.reviews > 50 ? 'Top Rated' : 'New Arrival'}</span>
            </div>

            {/* Price Block */}
            <div className="flex items-baseline gap-3">
              <span className="font-poppins font-bold text-[28px] text-[#01B4BA]">₹{displayPrice.toLocaleString('en-IN')}</span>
              {product.mrp && product.mrp > displayPrice && (
                <span className="font-inter text-lg text-[#9CA3AF] line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
              )}
              {disc > 0 && (
                <span className="bg-[#FF7A0F] text-white font-poppins font-bold text-xs px-2.5 py-1 rounded-full">{disc}% OFF</span>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="font-poppins font-bold text-xs text-[#01406D] uppercase mb-2">
                  {product.variants[0].type}: <span className="text-[#01B4BA]">{selectedVariant?.label || 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const isOut = v.stock === 0;
                    const isColor = v.type === 'color';
                    return isColor ? (
                      <button key={v.id} disabled={isOut}
                        onClick={() => setSelectedVariant(isSelected ? null : v)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? 'border-[#01B4BA] ring-2 ring-[#01B4BA]/20' : 'border-slate-200'} ${isOut ? 'opacity-30' : ''}`}
                        style={{ backgroundColor: v.label.toLowerCase() }}
                        title={v.label}
                      />
                    ) : (
                      <button key={v.id} disabled={isOut}
                        onClick={() => setSelectedVariant(isSelected ? null : v)}
                        className={`px-4 py-1.5 rounded-lg border text-sm font-poppins font-bold transition-all ${isSelected ? 'bg-[#01B4BA] text-white border-[#01B4BA]' : isOut ? 'border-slate-200 text-slate-300 line-through cursor-not-allowed' : 'border-[#E0EFEF] text-[#01406D] hover:border-[#01B4BA]'}`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Stock */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#01406D] rounded-lg overflow-hidden focus-within:border-[#01B4BA] transition-colors">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-slate-50 transition-colors"><Minus size={16} className="text-[#01406D]" /></button>
                <span className="px-4 font-poppins font-bold text-sm min-w-[40px] text-center text-[#01406D]">{qty}</span>
                <button onClick={() => setQty(Math.min(displayStock, qty + 1))} className="p-2 hover:bg-slate-50 transition-colors"><Plus size={16} className="text-[#01406D]" /></button>
              </div>

              <div className="flex items-center gap-2">
                {displayStock > 10 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#01B4BA]" />
                    <span className="font-inter text-sm text-[#01B4BA] font-medium">In Stock</span>
                  </>
                ) : displayStock > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#FF7A0F]" />
                    <span className="font-inter text-sm text-[#FF7A0F] font-medium">Only {displayStock} left!</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                    <span className="font-inter text-sm text-[#9CA3AF] font-medium">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            {displayStock > 0 && (
              <div className="space-y-3">
                <button onClick={handleAddToCart} className="w-full bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold text-sm py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button onClick={handleBuyNow} className="w-full bg-[#FF7A0F] hover:bg-[#e66d0e] text-white font-poppins font-bold text-sm py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                  <Zap size={18} /> Buy Now
                </button>
              </div>
            )}

            {/* Wishlist + Share */}
            <div className="flex items-center gap-4">
              <button onClick={handleWishlist} className={`flex items-center gap-2 text-sm font-inter font-medium transition-all ${isWishlisted ? 'text-[#FF7A0F]' : 'text-[#01406D] hover:text-[#FF7A0F]'}`}>
                <Heart size={16} className={isWishlisted ? 'fill-[#FF7A0F]' : ''} /> {isWishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
              </button>
              <button onClick={handleShare} className="flex items-center gap-1 text-sm text-[#01406D] hover:text-[#01B4BA] transition-colors">
                <Share2 size={14} /> Share
              </button>
            </div>

            {/* Delivery Estimate */}
            <div className="border border-[#E0EFEF] rounded-lg p-4 bg-white">
              <p className="font-inter text-xs text-[#01406D] font-semibold mb-2 flex items-center gap-1">
                <Truck size={14} className="text-[#01B4BA]" /> Delivery Estimate
              </p>
              <div className="flex gap-2">
                <input value={deliveryPincode} onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter pincode" className="flex-1 font-inter text-sm border border-[#E0EFEF] rounded-lg px-3 py-2 outline-none focus:border-[#01B4BA]" maxLength={6} />
                <button onClick={checkDelivery} disabled={deliveryLoading || deliveryPincode.length !== 6} className="bg-[#01B4BA] hover:bg-[#019aa0] text-white font-poppins font-bold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1">
                  {deliveryLoading ? <Loader2 size={14} className="animate-spin" /> : 'Check'}
                </button>
              </div>
              {deliveryEstimate && deliveryEstimate.length > 0 && (
                <div className="mt-2 text-sm font-inter text-[#01406D]">
                  Delivery by {deliveryEstimate[0].estimatedDate}
                  {deliveryEstimate[0].charge === 0 && <span className="text-[#01B4BA] font-semibold ml-1">— Free</span>}
                </div>
              )}
            </div>

            {/* Return Policy Chips */}
            <div className="flex flex-wrap gap-3">
              {product.returnPolicy && (
                <div className="inline-flex items-center gap-1.5 bg-white border border-[#E0EFEF] rounded-full px-3 py-1.5 text-xs font-inter text-[#01406D]">
                  <RefreshCcw size={12} className="text-[#01B4BA]" /> {product.returnPolicy}
                </div>
              )}
              {product.warranty && (
                <div className="inline-flex items-center gap-1.5 bg-white border border-[#E0EFEF] rounded-full px-3 py-1.5 text-xs font-inter text-[#01406D]">
                  <Shield size={12} className="text-[#01B4BA]" /> {product.warranty}
                </div>
              )}
            </div>

            {/* Seller Info Card */}
            {sellerInfo && (
              <div className="bg-[#F5FEFE] border border-[#E0EFEF] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#01B4BA]/10 rounded-full flex items-center justify-center">
                      <Store size={14} className="text-[#01B4BA]" />
                    </div>
                    <div>
                      <p className="font-inter text-sm font-semibold text-[#01B4BA]">{sellerInfo.storeName || 'Vendor'}</p>
                      <div className="flex items-center gap-1 text-xs text-[#6B8FA3]">
                        <Star size={10} className="fill-[#FF7A0F] text-[#FF7A0F]" />
                        <span>{sellerInfo.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-[#E0EFEF]">|</span>
                        <span>{sellerInfo.totalReviews || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/search?vendorId=${(product as any).vendorId}`)} className="border border-[#01B4BA] text-[#01B4BA] font-poppins font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[#01B4BA] hover:text-white transition-all">
                    Visit Store
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2 border border-[#E0EFEF]">
                    <p className="text-xs font-bold text-[#01406D]">{sellerInfo.responseRate || 0}%</p>
                    <p className="text-[10px] text-[#6B8FA3]">Response</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-[#E0EFEF]">
                    <p className="text-xs font-bold text-[#01406D]">{sellerInfo.shippingScore || 0}/5</p>
                    <p className="text-[10px] text-[#6B8FA3]">Shipping</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-[#E0EFEF]">
                    <p className="text-xs font-bold text-[#01406D]">{sellerInfo.fulfillmentRate || 0}%</p>
                    <p className="text-[10px] text-[#6B8FA3]">Fulfillment</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Below Fold - Full Width */}
      <div className="mt-12">
        {/* Tab Bar */}
        <div className="flex gap-0 border-b border-[#E0EFEF]">
          {(['details', 'specs', 'reviews', 'qa'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-6 font-poppins font-bold text-sm transition-all border-b-2 capitalize ${activeTab === tab ? 'text-[#01B4BA] border-[#01B4BA]' : 'text-[#6B8FA3] border-transparent hover:text-[#01406D]'}`}
            >
              {tab === 'reviews' ? `Reviews (${product.reviews})` : tab === 'qa' ? 'Q&A' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div>
              {product.highlights && product.highlights.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-poppins font-bold text-sm text-[#01406D] mb-3">Highlights</h4>
                  <ul className="space-y-2">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 font-inter text-sm text-slate-600">
                        <Check size={14} className="text-[#01B4BA] mt-0.5 flex-shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {product.description && (
                <div>
                  <h4 className="font-poppins font-bold text-sm text-[#01406D] mb-3">Description</h4>
                  <div className="font-inter text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</div>
                </div>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <div>
              {product.specs && product.specs.length > 0 ? (
                <div className="max-w-2xl border border-[#E0EFEF] rounded-lg overflow-hidden">
                  {product.specs.map((s, i) => (
                    <div key={i} className={`flex px-4 py-3 ${i % 2 === 0 ? 'bg-[#F5FEFE]' : 'bg-white'}`}>
                      <span className="font-inter text-sm text-[#6B8FA3] w-1/3">{s.label}</span>
                      <span className="font-inter text-sm text-[#01406D] font-medium w-2/3">{s.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-sm text-[#6B8FA3]">No specifications listed.</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <RatingDistribution distribution={ratingDist} total={product.reviews} average={product.rating} />
              <div className="mt-6 space-y-4">
                {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
                {reviews.length === 0 && <p className="text-center font-inter text-sm text-[#6B8FA3] py-8">No reviews yet. Be the first!</p>}
              </div>
              <div className="mt-6">
                <WriteReview productId={id!} onSubmitted={() => getProductReviews(id!).then((r) => { setReviews(r.data || []); setRatingDist(r.ratingDistribution || {}); })} />
              </div>
            </div>
          )}

          {/* Q&A Tab */}
          {activeTab === 'qa' && <QASection productId={id!} />}
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="font-poppins font-bold text-xl text-[#01406D] mb-6">Related Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Show up to 6 related products from the same category */}
          {product.category && <RelatedProducts category={product.category} excludeId={product.id as any} onClick={handleRelatedClick} />}
        </div>
      </div>
    </div>
  );
};

const RelatedProducts: React.FC<{ category: string; excludeId: number | string; onClick: (id: number) => void }> = ({ category, excludeId, onClick }) => {
  const { data } = useQuery({
    queryKey: ['related-products', category],
    queryFn: () => api.get('/products/search', { params: { category, limit: '6' } }).then(r => r.data.data.filter((p: any) => String(p._id) !== String(excludeId)).slice(0, 6)),
    enabled: !!category,
    staleTime: 60000,
  });

  if (!data || data.length === 0) {
    return <p className="col-span-full font-inter text-sm text-[#6B8FA3]">No related products found.</p>;
  }

  return data.map((p: any) => (
    <RelatedProductCard key={p._id} product={{ ...p, id: p._id }} onClick={onClick} />
  ));
};

export default ProductDetail;
