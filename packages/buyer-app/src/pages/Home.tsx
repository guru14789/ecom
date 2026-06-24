import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, ShoppingBag, Star, Share2, ArrowLeft, Timer, MapPin, ChevronLeft, ChevronRight, Check, Truck, Leaf, Flame, SlidersHorizontal, ArrowDownAZ, Unlock, Sparkles, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem } from '../store/slices/cartSlice';
import { toggleLike } from '../store/slices/likesSlice';
import { joinGroupSession, joinGroupSession as startGroupSession } from '../store/slices/authSlice';
import { addToast, setLoginModalOpen, setPendingAction } from '../store/slices/uiSlice';
import { PRODUCTS, CATEGORIES, SUB_CATEGORIES } from '../utils/constants';
import { Product } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';
import { getActiveFlashSales } from '../api/flashSales';
import { FlashSaleItem } from '../types';
import { api } from '../api/client';

// Interactive Group Deal Slide
const GroupDealCard: React.FC<{ product: Product; index: number; onSelect: (id: number) => void }> = ({
  product,
  index,
  onSelect,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const joinedCountMap = useAppSelector((state) => state.auth.joinedGroups);

  const activeJoined = joinedCountMap[product.id] !== undefined
    ? joinedCountMap[product.id]
    : product.joinedCount;

  const isJoined = joinedCountMap[product.id] !== undefined;

  // Countdown timer starting at 2h 45m 10s (approx 9910 seconds)
  const { formattedTime } = useCountdown(9910 - index * 1800);

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.isLoggedIn) {
      dispatch(addToast({
        title: 'Login Required',
        message: 'Please log in to join this group deal',
        type: 'info',
      }));
      dispatch(setPendingAction({ type: 'joinGroup', productId: product.id }));
      dispatch(setLoginModalOpen(true));
      return;
    }

    if (!isJoined) {
      dispatch(joinGroupSession({ productId: product.id, initialCount: product.joinedCount }));
      dispatch(addItem({ product, quantity: 1, isGroupBuy: true }));
      dispatch(addToast({
        title: 'Group Joined',
        message: 'You have successfully joined the group deal!',
        type: 'success',
      }));
    }
  };

  const progress = Math.min(100, Math.round((activeJoined / product.targetCount) * 100));

  return (
    <div
      onClick={() => onSelect(product.id)}
      className="group-deal-card cursor-pointer"
    >
      <div className="deal-timer">
        {formattedTime}
      </div>

      <div className="deal-img">
        <img
          src={`/${product.image}`}
          alt={product.name}
          style={{ width: '100px', height: '100px', objectFit: 'contain' }}
        />
      </div>

      <div className="deal-info">
        <h4>{product.name}</h4>
        <div className="deal-prices">
          <span className="deal-old">₹{product.price}</span>
          <span className="deal-new">₹{product.groupPrice}</span>
        </div>

        {/* Progress Bar */}
        <div className="deal-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{activeJoined}/{product.targetCount} joined</span>
        </div>

        {isJoined ? (
          <button
            className="btn-join"
            style={{ background: 'rgba(1,64,109,0.1)', color: 'var(--primary-main)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            onClick={(e) => e.stopPropagation()}
          >
            Joined <Check size={14} className="stroke-[3]" />
          </button>
        ) : (
          <button
            onClick={handleJoin}
            className="btn-join"
          >
            Join Group
          </button>
        )}
      </div>
    </div>
  );
};

const FlashSaleTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return <span className="font-mono text-lg font-bold text-red-500">{timeLeft}</span>;
};

const fallbackBanners = [
  { id: 'f1', image: '', title: 'Big Savings Day', subtitle: 'Up to 70% off on fresh groceries & essentials', link: '#promo-strip', active: true },
  { id: 'f2', image: '', title: 'Group Deals Live', subtitle: 'Join group buying & unlock the lowest prices together', link: '', active: true },
  { id: 'f3', image: '', title: 'Free Delivery', subtitle: 'On your first 5 orders this month. No minimum!', link: '', active: true },
];

const HeroBannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchBanners = async () => {
      try {
        const res = await api.get('/admin/banners');
        const data = res.data?.data || [];
        if (!cancelled) {
          if (data.length === 0) {
            setBanners(fallbackBanners);
          } else {
            setBanners(data.filter((b: any) => b.active !== false));
          }
        }
      } catch {
        if (!cancelled) setBanners(fallbackBanners);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBanners();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  return (
    <section className="hero-banner-carousel">
      <div className="banner-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="banner-slide"
            style={{
              background: banners[current].image
                ? `url(${banners[current].image}) center/cover no-repeat`
                : `linear-gradient(135deg, #01406D, #01B4BA)`,
            }}
            onClick={() => {
              if (banners[current].link) {
                const el = document.querySelector(banners[current].link);
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <div className="banner-overlay">
              {banners[current].title && <h2 className="banner-title">{banners[current].title}</h2>}
              {banners[current].subtitle && <p className="banner-subtitle">{banners[current].subtitle}</p>}
              {banners[current].link && <button className="btn-white">Shop Now →</button>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {banners.length > 1 && (
        <div className="banner-dots">
          {banners.map((_: any, i: number) => (
            <button
              key={i}
              className={`dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Route URL queries (for deep-linked product details / searches)
  const initialProductId = searchParams.get('product');
  const initialSearchQuery = searchParams.get('search') || '';

  const likedIds = useAppSelector((state) => state.likes.likedProductIds);
  const user = useAppSelector((state) => state.auth.user);
  const joinedCountMap = useAppSelector((state) => state.auth.joinedGroups);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    initialProductId ? parseInt(initialProductId) : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [checkedSubcategories, setCheckedSubcategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'price' | 'review' | 'offer' | 'none'>('none');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const catAdsCarouselRef = useRef<HTMLDivElement>(null);

  const hotDeals = [1, 2, 3, 33, 34]
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  // Sync details state with URL params
  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(parseInt(initialProductId));
    } else {
      setSelectedProductId(null);
    }
  }, [initialProductId]);

  // Track recently viewed (from URL param or product clicks)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productParam = params.get('product');
    if (productParam) {
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]') as string[];
      const updated = [productParam, ...recent.filter(id => id !== productParam)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [location.search]);

  const handleSelectProduct = (id: number) => {
    setSelectedProductId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/?product=${id}`, { replace: true });
  };

  const handleBackToCatalog = () => {
    setSelectedProductId(null);
    navigate('/', { replace: true });
  };

  // Scroll Group deals carousel
  const scrollDeals = (direction: number) => {
    if (carouselRef.current) {
      const scrollAmt = 340 * direction;
      carouselRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  // Scroll Category Ads carousel
  const scrollCatAds = (direction: number) => {
    if (catAdsCarouselRef.current) {
      const scrollAmt = 370 * direction;
      catAdsCarouselRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user?.isLoggedIn) {
      dispatch(addToast({
        title: 'Login Required',
        message: 'Please log in to add items to your cart',
        type: 'info',
      }));
      dispatch(setPendingAction({ type: 'cart', productId: product.id }));
      dispatch(setLoginModalOpen(true));
      return;
    }

    dispatch(addItem({ product, quantity: 1, isGroupBuy: false }));
    dispatch(addToast({
      title: 'Added to Basket',
      message: `${product.name} has been added`,
      type: 'success',
    }));
  };

  const handleToggleLike = (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    dispatch(toggleLike(productId));
    const wasLiked = likedIds.includes(productId);
    dispatch(addToast({
      title: wasLiked ? 'Removed Favorite' : 'Added Favorite',
      message: wasLiked ? 'Product removed from favorites' : 'Product added to favorites',
      type: 'success',
    }));
  };

  // Group Session Actions inside Product details
  const handleDetailJoinGroup = (product: Product, start = false) => {
    if (!user?.isLoggedIn) {
      dispatch(addToast({
        title: 'Login Required',
        message: `Please log in to ${start ? 'start' : 'join'} this group deal`,
        type: 'info',
      }));
      dispatch(setPendingAction({ type: start ? 'startGroup' : 'joinGroup', productId: product.id }));
      dispatch(setLoginModalOpen(true));
      return;
    }

    if (start) {
      dispatch(startGroupSession({ productId: product.id, initialCount: 0 }));
      dispatch(addItem({ product, quantity: 1, isGroupBuy: true }));
      dispatch(addToast({
        title: 'Group Started',
        message: 'Group slot initialized! Share to complete target.',
        type: 'success',
      }));
    } else {
      dispatch(joinGroupSession({ productId: product.id, initialCount: product.joinedCount }));
      dispatch(addItem({ product, quantity: 1, isGroupBuy: true }));
      dispatch(addToast({
        title: 'Group Joined',
        message: 'You have successfully joined the group deal!',
        type: 'success',
      }));
    }
  };

  const handleShareProduct = (product: Product) => {
    const shareUrl = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      dispatch(addToast({
        title: 'Link Copied!',
        message: 'Share this link with your friends to join the group!',
        type: 'success',
      }));
    });
  };

  // Fetch real catalog from API via react-query
  const { data: apiProductsData } = useQuery({
    queryKey: ['products', selectedCategory, initialSearchQuery],
    queryFn: () => getProducts({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      q: initialSearchQuery || undefined,
    }),
  });

  const { data: flashSalesData } = useQuery({
    queryKey: ['flashSales'],
    queryFn: () => getActiveFlashSales().then(r => r.data),
    staleTime: 30000,
  });

  // Product Database Filtering
  let filteredProducts = apiProductsData?.data && apiProductsData.data.length > 0
    ? apiProductsData.data
    : PRODUCTS;

  // Search filter
  if (initialSearchQuery) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(initialSearchQuery.toLowerCase())
    );
  }

  // Category filter
  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter((p) => p.category === selectedCategory);
  }

  // Subcategory checkbox filter
  if (checkedSubcategories.length > 0) {
    filteredProducts = filteredProducts.filter((p) => {
      // Find subcategories mapping or default check
      const tags = SUB_CATEGORIES[p.category] || SUB_CATEGORIES.default;
      return checkedSubcategories.some((sub) => tags.includes(sub));
    });
  }

  // Price checkboxes filter
  if (selectedPriceRanges.length > 0) {
    filteredProducts = filteredProducts.filter((p) => {
      return selectedPriceRanges.some((range) => {
        if (range === 'under-500') return p.price < 500;
        if (range === '500-2000') return p.price >= 500 && p.price <= 2000;
        if (range === 'above-2000') return p.price > 2000;
        return true;
      });
    });
  }

  // Sorting logic
  if (sortOption === 'price') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortOption === 'review') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.reviews - a.reviews);
  } else if (sortOption === 'offer') {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const discountA = a.price - a.groupPrice;
      const discountB = b.price - b.groupPrice;
      return discountB - discountA;
    });
  }

  const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 min-h-screen">
      <AnimatePresence mode="wait">
        {!selectedProduct ? (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-10"
          >
            {selectedCategory === 'all' ? (
              /* --- HOME LANDING VIEW --- */
              <>
                {/* HERO HERO SECTION */}
                <section className="hero-section" id="hero-banner">
                  <div className="hero-content">
                    <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={14} /> Fast Delivery
                    </div>
                    <h1 className="hero-title">
                      Welcome to <span className="hero-highlight">ShopYNG.</span>
                    </h1>
                    <p className="hero-subtitle">
                      ShopYNG brings people together to unlock better prices through smart group buying.
                    </p>
                    <div className="hero-cta">
                      <button
                        className="btn-primary"
                        onClick={() => {
                          const el = document.getElementById('categories');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Shop Now
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => navigate('/workflows')}
                      >
                        System Architecture →
                      </button>
                    </div>
                    <div className="hero-stats">
                      <div className="stat">
                        <span className="stat-num">10K+</span>
                        <span className="stat-label">Products</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat">
                        <span className="stat-num">25min</span>
                        <span className="stat-label">Avg Delivery</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat">
                        <span className="stat-num">4.8★</span>
                        <span className="stat-label">Rating</span>
                      </div>
                    </div>
                  </div>
                  <div className="hero-visual hidden md:flex">
                    <div className="hero-circle hero-circle-1"></div>
                    <div className="hero-circle hero-circle-2"></div>
                    <div className="hero-emoji-art">
                      <div className="veggie" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Leaf size={112} className="text-white opacity-90 stroke-[1.5]" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* HERO BANNER CAROUSEL */}
                <HeroBannerCarousel />

                {/* HOT DEALS CAROUSEL */}
                <section className="flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame className="text-[var(--accent-orange)]" size={24} /> Hot Group Deals
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => scrollDeals(-1)}
                        className="nav-arrow"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => scrollDeals(1)}
                        className="nav-arrow"
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div
                    ref={carouselRef}
                    className="group-deals-carousel"
                  >
                    {hotDeals.map((product, idx) => (
                      <GroupDealCard
                        key={product.id}
                        product={product}
                        index={idx}
                        onSelect={handleSelectProduct}
                      />
                    ))}
                  </div>
                </section>

                {/* FLASH SALE SECTION */}
                {flashSalesData && flashSalesData.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Zap size={20} className="text-red-500" />
                        <h2 className="text-xl font-artz font-bold text-navy">Flash Sale</h2>
                      </div>
                      {flashSalesData[0]?.endDate && <FlashSaleTimer endDate={flashSalesData[0].endDate} />}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {(flashSalesData[0]?.products || []).slice(0, 6).map((item: any) => (
                        <div key={item.productId} className="flex-shrink-0 w-36 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
                          <div className="w-full h-24 bg-slate-50 rounded-xl mb-2 overflow-hidden">
                            <img src={item.image || 'https://via.placeholder.com/200'} alt="" className="w-full h-full object-cover" />
                          </div>
                          {item.salePrice && <p className="text-sm font-bold text-red-500">₹{item.salePrice}</p>}
                          {item.originalPrice && <p className="text-xs text-slate-400 line-through">₹{item.originalPrice}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-color), transparent)', margin: '60px 0' }} />

                {/* CIRCULAR CATEGORY GRID */}
                <section className="categories-section" id="categories">
                  <div className="categories-grid-wrap">
                    <div className="cat-item" onClick={() => { setSelectedCategory('fashion'); setCheckedSubcategories([]); setSelectedPriceRanges([]); }}><div className="cat-icon-circle"><img src="/fashion.jpeg" alt="Fashion" /></div><span>Fashion</span></div>
                    <div className="cat-item" onClick={() => { setSelectedCategory('mobiles'); setCheckedSubcategories([]); setSelectedPriceRanges([]); }}><div className="cat-icon-circle"><img src="/mobile.jpeg" alt="Mobiles" /></div><span>Mobiles</span></div>
                    <div className="cat-item" onClick={() => { setSelectedCategory('beauty'); setCheckedSubcategories([]); setSelectedPriceRanges([]); }}><div className="cat-icon-circle"><img src="/beauty.jpeg" alt="Beauty" /></div><span>Beauty</span></div>
                    <div className="cat-item" onClick={() => { setSelectedCategory('electronics'); setCheckedSubcategories([]); setSelectedPriceRanges([]); }}><div className="cat-icon-circle"><img src="/electronics.jpeg" alt="Electronics" /></div><span>Electronics</span></div>
                    <div className="cat-item" onClick={() => { setSelectedCategory('home'); setCheckedSubcategories([]); setSelectedPriceRanges([]); }}><div className="cat-icon-circle"><img src="/home.webp" alt="Home" /></div><span>Home</span></div>
                  </div>
                </section>

                {/* PRODUCTS HEADER */}
                <div className="products-header" id="products-header" style={{ marginTop: '100px' }}>
                  <h2 className="section-title">Exclusive Deals for You</h2>
                  <div className="filters-row">
                    <div className="sort-dropdown" style={{ position: 'relative' }}>
                      <button className="sort-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                        Sort by <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {isSortOpen && (
                        <div className="dropdown-menu active" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50 }}>
                          <button className="dropdown-item" onClick={() => { setSortOption('price'); setIsSortOpen(false); }}>Price</button>
                          <button className="dropdown-item" onClick={() => { setSortOption('review'); setIsSortOpen(false); }}>Review</button>
                          <button className="dropdown-item" onClick={() => { setSortOption('offer'); setIsSortOpen(false); }}>Offer</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* FULL-WIDTH PRODUCTS GRID */}
                <div className="products-grid">
                  {filteredProducts.map((product) => {
                    const isLiked = likedIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        className="product-card"
                      >
                        {product.sponsored && <div className="sponsored-label">Sponsored</div>}
                        
                        <button
                          onClick={(e) => handleToggleLike(e, product.id)}
                          className={`like-btn ${isLiked ? 'liked' : ''}`}
                        >
                          <Heart
                            size={16}
                            className={isLiked ? 'text-red-500 fill-red-500' : 'text-slate-400'}
                          />
                        </button>

                        <div className="product-image-box">
                          <img
                            src={`/${product.image}`}
                            alt={product.name}
                          />
                        </div>

                        <div className="product-info">
                          <h3 className="product-name">{product.name}</h3>
                          <div className="product-meta">
                            <span className="rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={14} className="fill-[#ffc107] text-[#ffc107]" /> {product.rating} <span style={{ color: '#888', fontWeight: 400 }}>({product.reviews})</span></span>
                          </div>
                          <div className="product-footer">
                            <div className="price-wrap">
                              <span className="price">₹{product.price}</span>
                              {product.groupPrice && (
                                <span className="group-price">Group: ₹{product.groupPrice}</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              className="add-to-cart"
                              style={{ width: 'auto', padding: '0 15px', fontSize: '13px', fontWeight: 700 }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PROMO STRIP */}
                <section className="promo-strip" id="promo-strip">
                  <div className="promo-card promo-teal">
                    <div className="promo-content">
                      <span className="promo-eyebrow">Limited Time</span>
                      <h3>Buy 2 Get 1 <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0 8px', borderRadius: '4px' }}>FREE</span></h3>
                      <p>On all organic produce this weekend only</p>
                      <button className="btn-white">Grab Deal →</button>
                    </div>
                    <div className="promo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf size={48} className="text-white opacity-80" /></div>
                  </div>
                  <div className="promo-card promo-orange">
                    <div className="promo-content">
                      <span className="promo-eyebrow">New Arrival</span>
                      <h3>Fresh <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0 8px', borderRadius: '4px' }}>Exotic</span> Fruits</h3>
                      <p>Sourced directly from farms worldwide</p>
                      <button className="btn-white">Explore Now →</button>
                    </div>
                    <div className="promo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={48} className="text-white opacity-80" /></div>
                  </div>
                </section>
              </>
            ) : (
              /* --- CATEGORY DASHBOARD VIEW --- */
              <div className="container" id="category-view" style={{ paddingTop: '20px' }}>
                <div className="category-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="back-btn" onClick={() => { setSelectedCategory('all'); setCheckedSubcategories([]); setSelectedPriceRanges([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-dark)' }}>←</button>
                    <h1 className="category-title" style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>
                      {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </h1>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     <button className="btn-ghost" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)', padding: '8px 20px', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                       Filter <SlidersHorizontal size={14} />
                     </button>
                     <button className="btn-ghost" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)', padding: '8px 20px', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                       Sort By <ArrowDownAZ size={14} />
                     </button>
                  </div>
                </div>

                {/* CATEGORY ADS SLIDER */}
                <section className="cat-ads-wrapper" style={{ position: 'relative', marginBottom: '40px' }}>
                  <button className="nav-arrow" onClick={() => scrollCatAds(-1)} style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, boxShadow: 'var(--shadow)' }}>←</button>
                  <button className="nav-arrow" onClick={() => scrollCatAds(1)} style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, boxShadow: 'var(--shadow)' }}>→</button>
                  
                  <div className="cat-ads-carousel" ref={catAdsCarouselRef} style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', padding: '10px 0' }}>
                    <div className="cat-ad-box" style={{ minWidth: '350px', height: '200px', background: 'linear-gradient(45deg, #01406D, #01B4BA)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'var(--shadow)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Limited Offer</span>
                      <h2 style={{ margin: '10px 0', fontSize: '28px', fontWeight: 800 }}>UP TO 50% OFF</h2>
                      <button className="btn-white" style={{ width: 'fit-content', padding: '8px 20px', fontSize: '12px' }}>Shop Now</button>
                    </div>
                    <div className="cat-ad-box" style={{ minWidth: '350px', height: '200px', background: 'linear-gradient(45deg, #012a4a, #01406D)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'var(--shadow)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>New Season</span>
                      <h2 style={{ margin: '10px 0', fontSize: '28px', fontWeight: 800 }}>FRESH ARRIVALS</h2>
                      <button className="btn-white" style={{ width: 'fit-content', padding: '8px 20px', fontSize: '12px' }}>Explore</button>
                    </div>
                    <div className="cat-ad-box" style={{ minWidth: '350px', height: '200px', background: 'linear-gradient(45deg, #001a2e, #012a4a)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'var(--shadow)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Exclusive</span>
                      <h2 style={{ margin: '10px 0', fontSize: '28px', fontWeight: 800 }}>GROUP DEALS</h2>
                      <button className="btn-white" style={{ width: 'fit-content', padding: '8px 20px', fontSize: '12px' }}>Join Now</button>
                    </div>
                    <div className="cat-ad-box" style={{ minWidth: '350px', height: '200px', background: 'linear-gradient(45deg, #ffc107, #ff9800)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'var(--shadow)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Weekend Flash</span>
                      <h2 style={{ margin: '10px 0', fontSize: '28px', fontWeight: 800 }}>BIG SAVINGS</h2>
                      <button className="btn-white" style={{ width: 'fit-content', padding: '8px 20px', fontSize: '12px' }}>Claim Deal</button>
                    </div>
                    <div className="cat-ad-box" style={{ minWidth: '350px', height: '200px', background: 'linear-gradient(45deg, #01406D, #012a4a)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: 'var(--shadow)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Membership</span>
                      <h2 style={{ margin: '10px 0', fontSize: '28px', fontWeight: 800 }}>FREE DELIVERY</h2>
                      <button className="btn-white" style={{ width: 'fit-content', padding: '8px 20px', fontSize: '12px' }}>Get Started</button>
                    </div>
                  </div>
                </section>

                <div className="category-body" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px' }}>
                  {/* SIDEBAR */}
                  <aside className="cat-sidebar">
                    <div className="sidebar-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                      <h4 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Sub Categories</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(SUB_CATEGORIES[selectedCategory] || SUB_CATEGORIES.default).map((sub) => {
                          const isChecked = checkedSubcategories.includes(sub);
                          return (
                            <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setCheckedSubcategories(checkedSubcategories.filter((s) => s !== sub));
                                  } else {
                                    setCheckedSubcategories([...checkedSubcategories, sub]);
                                  }
                                }}
                                className="rounded text-primary-main focus:ring-primary-main w-4 h-4 border-slate-300"
                              />
                              {sub}
                            </label>
                          );
                        })}
                      </div>
                      
                      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '25px 0' }} />
                      
                      <h4 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Price Range</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { value: 'under-500', label: 'Under ₹500' },
                          { value: '500-2000', label: '₹500 - ₹2000' },
                          { value: 'above-2000', label: 'Above ₹2000' },
                        ].map((rng) => {
                          const isChecked = selectedPriceRanges.includes(rng.value);
                          return (
                            <label key={rng.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedPriceRanges(selectedPriceRanges.filter((r) => r !== rng.value));
                                  } else {
                                    setSelectedPriceRanges([...selectedPriceRanges, rng.value]);
                                  }
                                }}
                                className="rounded text-primary-main focus:ring-primary-main w-4 h-4 border-slate-300"
                              />
                              {rng.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </aside>

                  {/* PRODUCT LIST */}
                  <section className="cat-products">
                    <div className="products-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                      {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                            <Search size={48} className="text-slate-350" />
                          </div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '15px 0' }}>No products found</h3>
                          <p style={{ color: '#888' }}>Try adjusting your filters or category choice.</p>
                        </div>
                      ) : (
                        filteredProducts.map((product) => {
                          const isLiked = likedIds.includes(product.id);
                          return (
                            <div
                              key={product.id}
                              onClick={() => handleSelectProduct(product.id)}
                              className="product-card"
                            >
                              {product.sponsored && <div className="sponsored-label">Sponsored</div>}
                              
                              <button
                                onClick={(e) => handleToggleLike(e, product.id)}
                                className={`like-btn ${isLiked ? 'liked' : ''}`}
                              >
                                <Heart
                                  size={16}
                                  className={isLiked ? 'text-red-500 fill-red-500' : 'text-slate-400'}
                                />
                              </button>

                              <div className="product-image-box">
                                <img
                                  src={`/${product.image}`}
                                  alt={product.name}
                                />
                              </div>

                              <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-meta">
                                  <span className="rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={14} className="fill-[#ffc107] text-[#ffc107]" /> {product.rating} <span style={{ color: '#888', fontWeight: 400 }}>({product.reviews})</span></span>
                                </div>
                                <div className="product-footer">
                                  <div className="price-wrap">
                                    <span className="price">₹{product.price}</span>
                                    {product.groupPrice && (
                                      <span className="group-price">Group: ₹{product.groupPrice}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="add-to-cart"
                                    style={{ width: 'auto', padding: '0 15px', fontSize: '13px', fontWeight: 700 }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* PRODUCT DETAILS SLIDE VIEW */
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-8"
          >
            {/* Back indicator */}
            <button
              onClick={handleBackToCatalog}
              className="flex items-center gap-2 self-start font-poppins font-bold text-sm text-primary-main hover:text-primary-dark transition-colors px-3 py-1.5 rounded-full hover:bg-primary-main/5"
            >
              <ArrowLeft size={16} />
              Back to Catalog
            </button>

            {/* Structured Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
              <div className="bg-white border border-primary-main/15 p-12 rounded-[40px] shadow-sm flex items-center justify-center">
                <img
                  src={`/${selectedProduct.image}`}
                  alt={selectedProduct.name}
                  className="max-h-[320px] w-auto object-contain"
                />
              </div>

              <div className="flex flex-col gap-6 justify-center">
                <div className="flex flex-col gap-2">
                  {selectedProduct.sponsored && (
                    <span className="self-start bg-primary-main/15 text-primary-dark font-poppins font-bold text-xs px-3.5 py-0.5 rounded-full border border-primary-main/10 shadow-sm">
                      Sponsored
                    </span>
                  )}
                  <h1 className="font-poppins font-extrabold text-slate-800 text-3xl md:text-4xl leading-tight">
                    {selectedProduct.name}
                  </h1>
                  <div className="flex items-center gap-2.5 font-inter text-sm text-slate-500">
                    <span className="bg-[#FFF8E1] text-[#FFB300] font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Star size={12} className="fill-[#FFB300] text-[#FFB300]" /> {selectedProduct.rating}
                    </span>
                    <span>({selectedProduct.reviews} reviews)</span>
                  </div>
                </div>

                <div className="font-inter font-extrabold text-2xl text-slate-800 flex items-center gap-3">
                  ₹{selectedProduct.price}
                  <span className="text-sm font-medium text-slate-400 font-inter">Inclusive of all taxes</span>
                </div>

                {/* Hot Deals Progress box inside details */}
                {selectedProduct.groupPrice && (
                  <div className="flex flex-col gap-4">
                    <div className="self-start bg-accent-orange text-white font-poppins font-bold text-sm px-5 py-2.5 rounded-2xl shadow-premium flex items-center gap-2">
                      <Flame size={16} /> Group Deal: ₹{selectedProduct.groupPrice}
                    </div>

                    {/* Progress slider bar */}
                    <div className="flex flex-col gap-2 bg-white border border-accent-orange/20 p-5 rounded-3xl shadow-sm">
                      <div className="flex justify-between font-poppins text-xs font-bold text-slate-700 leading-none">
                        <span className="text-accent-orange">
                          {joinedCountMap[selectedProduct.id] !== undefined
                            ? joinedCountMap[selectedProduct.id]
                            : selectedProduct.joinedCount}{' '}
                          persons joined
                        </span>
                        <span>Goal: {selectedProduct.targetCount}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent-orange to-[#FF9800] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                ((joinedCountMap[selectedProduct.id] !== undefined
                                  ? joinedCountMap[selectedProduct.id]
                                  : selectedProduct.joinedCount) /
                                  selectedProduct.targetCount) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs font-inter font-semibold text-slate-500 text-center">
                        {selectedProduct.targetCount -
                          (joinedCountMap[selectedProduct.id] !== undefined
                            ? joinedCountMap[selectedProduct.id]
                            : selectedProduct.joinedCount) >
                        0 ? (
                          <span>
                            Only{' '}
                            <strong>
                              {selectedProduct.targetCount -
                                (joinedCountMap[selectedProduct.id] !== undefined
                                  ? joinedCountMap[selectedProduct.id]
                                  : selectedProduct.joinedCount)}
                            </strong>{' '}
                            more persons needed to unlock!
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-primary-main">
                            Deal Unlocked! <Unlock size={14} className="stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <p className="font-inter text-slate-500 text-sm leading-relaxed">
                  Experience premium quality with our {selectedProduct.name}. Carefully sourced and delivered fresh to
                  your doorstep. Enjoy fast delivery and guaranteed freshness.
                </p>

                {/* Core actions buttons */}
                <div className="flex gap-4 items-center pt-4">
                  <button
                    onClick={(e) => handleAddToCart(e, selectedProduct)}
                    className="flex-1 bg-primary-main hover:bg-primary-hover text-white font-poppins font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgba(1,64,109,0.25)] hover:shadow-lg active:scale-95 transition-all"
                  >
                    Add to Cart
                  </button>

                  {selectedProduct.groupPrice && (
                    <div className="flex-1 flex gap-2">
                      {joinedCountMap[selectedProduct.id] !== undefined ? (
                        <>
                          <button className="flex-1 bg-white border-2 border-primary-main text-primary-main font-poppins font-bold py-4 rounded-2xl cursor-default transition-all flex items-center justify-center gap-2">
                            Joined <Check size={16} className="stroke-[3]" />
                          </button>
                          <button
                            onClick={() => handleShareProduct(selectedProduct)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 p-4 rounded-2xl shadow-sm transition-all"
                            title="Share"
                          >
                            <Share2 size={20} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDetailJoinGroup(selectedProduct, false)}
                          className="flex-1 bg-accent-orange hover:bg-accent-orangeHover text-white font-poppins font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgba(255,122,15,0.25)] hover:shadow-lg active:scale-95 transition-all"
                        >
                          Join Group
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => handleToggleLike(e, selectedProduct.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                      likedIds.includes(selectedProduct.id)
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-400'
                    }`}
                  >
                    <Heart size={20} className={likedIds.includes(selectedProduct.id) ? 'fill-red-500' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

