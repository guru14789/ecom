import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, SlidersHorizontal, X, Star, Heart, ShoppingBag,
  TrendingUp, Clock, ArrowLeft, ChevronDown, ChevronUp, Check, Loader2,
  LayoutGrid, List, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { addToast, setLoginModalOpen, setPendingAction } from '../store/slices/uiSlice';
import { Product } from '../types';
import { getProducts, getSearchSuggestions, ProductFilters, Facets } from '../api/products';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'newest';

interface FilterState {
  categories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  minDiscount: number;
  inStock: boolean;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'relevance',  label: 'Most Relevant' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest',     label: 'Newest First' },
];

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60];

const ProductResultCard: React.FC<{ product: Product }> = React.memo(({ product }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const wishlistItems = useAppSelector((s) => s.wishlist.items);
  const isWishlisted = wishlistItems.some((i) => i.product.id === product.id);
  const disc = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const isNew = product.badge === 'new';

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.isLoggedIn) {
      dispatch(setPendingAction({ type: 'cart', productId: product.id }));
      dispatch(setLoginModalOpen(true));
      return;
    }
    dispatch(addItem({ product, quantity: 1, isGroupBuy: false }));
    dispatch(addToast({ title: 'Added to Cart', message: product.name, type: 'success' }));
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleWishlist(product));
    dispatch(addToast({
      title: isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
      message: product.name,
      type: 'success',
    }));
  };

  const fullStars = Math.floor(product.rating);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E0EFEF] rounded-lg overflow-hidden cursor-pointer group hover:shadow-md transition-all"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square bg-white flex items-center justify-center p-4 overflow-hidden">
        <img
          src={`/${product.image}`}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {disc > 0 ? (
          <span className="absolute top-2 left-2 bg-[#FF7A0F] text-white text-[10px] font-poppins font-bold px-2 py-0.5 rounded">
            SALE
          </span>
        ) : isNew ? (
          <span className="absolute top-2 left-2 bg-[#01B4BA] text-white text-[10px] font-poppins font-bold px-2 py-0.5 rounded">
            NEW
          </span>
        ) : null}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={16}
            className={isWishlisted ? 'fill-[#FF7A0F] text-[#FF7A0F]' : 'text-gray-400'}
          />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-inter font-medium text-sm text-[#01406D] leading-snug line-clamp-2">
          {product.name}
        </h3>
        {product.seller?.name && (
          <span className="text-[#6B8FA3] text-[12px] font-inter">
            {product.seller.name}
          </span>
        )}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              className={s <= fullStars ? 'text-[#FF7A0F] fill-[#FF7A0F]' : 'text-gray-200'}
            />
          ))}
          <span className="text-[11px] font-inter text-[#01406D] font-medium ml-0.5">
            {product.rating}
          </span>
          <span className="text-[11px] font-inter text-[#6B8FA3]">
            ({product.reviews.toLocaleString()})
          </span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          {disc > 0 && product.mrp && (
            <span className="text-[#9CA3AF] text-xs line-through font-inter">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
          )}
          <span className="text-[#01B4BA] font-bold text-sm font-poppins">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {disc > 0 && (
            <span className="text-[#FF7A0F] font-bold text-[11px] font-inter">
              {disc}% off
            </span>
          )}
        </div>
        <button
          onClick={handleCart}
          className="w-full mt-1 py-2 rounded-lg border border-[#01B4BA] text-[#01B4BA] font-poppins font-bold text-xs opacity-0 group-hover:opacity-100 hover:bg-[#01B4BA] hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingBag size={12} />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
});

const FilterCheckbox: React.FC<{
  checked: boolean;
  label: string;
  count?: number;
  onChange: () => void;
}> = ({ checked, label, count, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
        checked ? 'bg-[#01B4BA] border-[#01B4BA]' : 'border-gray-300 group-hover:border-[#01B4BA]/50'
      }`}
      onClick={onChange}
    >
      {checked && <Check size={10} className="text-white" />}
    </div>
    <span className="font-inter text-xs text-[#01406D] flex-1">{label}</span>
    {count !== undefined && (
      <span className="font-inter text-[11px] text-[#6B8FA3]">({count})</span>
    )}
  </label>
);

const SectionHeader: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
}> = ({ title, open, onToggle }) => (
  <button
    className="flex items-center justify-between w-full font-poppins font-bold text-sm text-[#01406D] py-1"
    onClick={onToggle}
  >
    {title}
    {open ? <ChevronUp size={14} className="text-[#6B8FA3]" /> : <ChevronDown size={14} className="text-[#6B8FA3]" />}
  </button>
);

const FilterPanel: React.FC<{
  filters: FilterState;
  facets?: Facets;
  onChange: (f: FilterState) => void;
  onClose: () => void;
}> = ({ filters, facets, onChange, onClose }) => {
  const [local, setLocal] = useState(filters);
  const [sections, setSections] = useState({
    category: true, price: true, brand: true, rating: true, availability: true, discount: true,
  });
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => { setLocal(filters); }, [filters]);

  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const toggleCategory = (cat: string) =>
    setLocal((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));

  const toggleBrand = (b: string) =>
    setLocal((prev) => ({
      ...prev,
      brands: prev.brands.includes(b)
        ? prev.brands.filter((br) => br !== b)
        : [...prev.brands, b],
    }));

  const apply = () => { onChange(local); onClose(); };
  const reset = () => {
    const cleared: FilterState = {
      categories: [], brands: [], minPrice: 0, maxPrice: 200000,
      minRating: 0, minDiscount: 0, inStock: false,
    };
    setLocal(cleared);
    onChange(cleared);
    onClose();
  };

  const filteredBrands = useMemo(() => {
    if (!facets?.brands) return [];
    if (!brandSearch.trim()) return facets.brands;
    return facets.brands.filter((b) =>
      b.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [facets?.brands, brandSearch]);

  const priceRange = facets?.priceRange ?? { minPrice: 0, maxPrice: 50000 };
  const sliderMin = priceRange.minPrice;
  const sliderMax = priceRange.maxPrice;

  const getPercent = (val: number) => ((val - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="bg-white border border-[#E0EFEF] rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-[#E0EFEF]">
        <span className="font-poppins font-bold text-base text-[#01406D]">Filters</span>
        <button
          onClick={reset}
          className="font-inter text-xs text-[#FF7A0F] font-bold hover:underline"
        >
          Clear All
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
        {/* Category */}
        <div>
          <SectionHeader title="Category" open={sections.category} onToggle={() => toggleSection('category')} />
          <AnimatePresence>
            {sections.category && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-0.5 pb-1 pt-1">
                  {(facets?.categories || []).map((cat) => (
                    <FilterCheckbox
                      key={cat.key}
                      checked={local.categories.includes(cat.key)}
                      label={cat.key}
                      count={cat.count}
                      onChange={() => toggleCategory(cat.key)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-[#E0EFEF]" />

        {/* Price Range */}
        <div>
          <SectionHeader title="Price Range" open={sections.price} onToggle={() => toggleSection('price')} />
          <AnimatePresence>
            {sections.price && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="pb-2 pt-1">
                  <div className="relative h-6 mt-1 mb-1">
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#01B4BA] rounded-full"
                      style={{
                        left: `${getPercent(local.minPrice)}%`,
                        width: `${getPercent(local.maxPrice) - getPercent(local.minPrice)}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      value={local.minPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= local.maxPrice) setLocal((p) => ({ ...p, minPrice: val }));
                      }}
                      className="absolute w-full top-0 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#01B4BA] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
                    />
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      value={local.maxPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= local.minPrice) setLocal((p) => ({ ...p, maxPrice: val }));
                      }}
                      className="absolute w-full top-0 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#01B4BA] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#6B8FA3]">₹</span>
                      <input
                        type="number"
                        value={local.minPrice}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setLocal((p) => ({ ...p, minPrice: Math.min(v, p.maxPrice) }));
                        }}
                        className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-[#E0EFEF] rounded font-inter focus:outline-none focus:border-[#01B4BA]"
                      />
                    </div>
                    <span className="text-[#6B8FA3] text-xs">-</span>
                    <div className="flex-1 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#6B8FA3]">₹</span>
                      <input
                        type="number"
                        value={local.maxPrice}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setLocal((p) => ({ ...p, maxPrice: Math.max(v, p.minPrice) }));
                        }}
                        className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-[#E0EFEF] rounded font-inter focus:outline-none focus:border-[#01B4BA]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-[#E0EFEF]" />

        {/* Brand */}
        <div>
          <SectionHeader title="Brand" open={sections.brand} onToggle={() => toggleSection('brand')} />
          <AnimatePresence>
            {sections.brand && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="pb-1 pt-1">
                  <div className="relative mb-2">
                    <SearchIcon size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6B8FA3]" />
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="w-full pl-7 pr-2 py-1.5 text-xs border border-[#E0EFEF] rounded font-inter focus:outline-none focus:border-[#01B4BA]"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                    {filteredBrands.map((b) => (
                      <FilterCheckbox
                        key={b}
                        checked={local.brands.includes(b)}
                        label={b}
                        onChange={() => toggleBrand(b)}
                      />
                    ))}
                    {filteredBrands.length === 0 && (
                      <span className="text-[11px] text-[#6B8FA3] font-inter italic">No brands found</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-[#E0EFEF]" />

        {/* Rating */}
        <div>
          <SectionHeader title="Rating" open={sections.rating} onToggle={() => toggleSection('rating')} />
          <AnimatePresence>
            {sections.rating && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-0.5 pb-1 pt-1">
                  {[4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      onClick={() => setLocal((p) => ({ ...p, minRating: p.minRating === star ? 0 : star }))}
                      className={`flex items-center gap-1.5 w-full px-1 py-1 rounded transition-all ${
                        local.minRating === star ? 'bg-[#01B4BA]/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= star ? 'text-[#FF7A0F] fill-[#FF7A0F]' : 'text-gray-200'}
                        />
                      ))}
                      <span className="text-xs font-inter text-[#01406D] ml-1">& above</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-[#E0EFEF]" />

        {/* Availability */}
        <div>
          <SectionHeader title="Availability" open={sections.availability} onToggle={() => toggleSection('availability')} />
          <AnimatePresence>
            {sections.availability && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="pb-1 pt-1">
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="font-inter text-xs text-[#01406D]">In Stock Only</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={local.inStock}
                        onChange={(e) => setLocal((p) => ({ ...p, inStock: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-[#01B4BA] rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="border-[#E0EFEF]" />

        {/* Discount */}
        <div>
          <SectionHeader title="Discount" open={sections.discount} onToggle={() => toggleSection('discount')} />
          <AnimatePresence>
            {sections.discount && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="flex flex-col gap-0.5 pb-1 pt-1">
                  {DISCOUNT_OPTIONS.map((d) => (
                    <FilterCheckbox
                      key={d}
                      checked={local.minDiscount === d}
                      label={`${d}%+`}
                      onChange={() => setLocal((p) => ({ ...p, minDiscount: p.minDiscount === d ? 0 : d }))}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4 border-t border-[#E0EFEF] flex flex-col gap-2">
        <button
          onClick={apply}
          className="w-full bg-[#01B4BA] hover:bg-[#019ea3] text-white font-poppins font-bold text-sm py-2.5 rounded-lg transition-all"
        >
          Apply Filters
        </button>
      </div>
    </motion.div>
  );
};

const POPULAR_SEARCHES = ['iPhone', 'Headphones', 'Organic', 'Books', 'Sneakers', 'Smart Watch', 'Yoga Mat', 'Air Fryer'];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [submitted, setSubmitted] = useState(queryParam);
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance');
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Organic Avocados', 'Headphones']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const buildFiltersFromParams = useCallback((): FilterState => ({
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
    minPrice: parseInt(searchParams.get('minPrice') || '0', 10),
    maxPrice: parseInt(searchParams.get('maxPrice') || '200000', 10),
    minRating: parseInt(searchParams.get('minRating') || '0', 10),
    minDiscount: parseInt(searchParams.get('minDiscount') || '0', 10),
    inStock: searchParams.get('inStock') === 'true',
  }), [searchParams]);

  const [filters, setFilters] = useState<FilterState>(buildFiltersFromParams);

  useEffect(() => {
    setFilters(buildFiltersFromParams());
  }, [buildFiltersFromParams]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const apiFilters = useMemo((): ProductFilters => {
    const f: ProductFilters = { sort };
    if (submitted) f.q = submitted;
    if (filters.categories.length > 0) f.categories = filters.categories;
    if (filters.brands.length > 0) f.brands = filters.brands;
    if (filters.minPrice > 0) f.minPrice = filters.minPrice;
    if (filters.maxPrice < 200000) f.maxPrice = filters.maxPrice;
    if (filters.minRating > 0) f.minRating = filters.minRating;
    if (filters.minDiscount > 0) f.minDiscount = filters.minDiscount;
    if (filters.inStock) f.inStock = true;
    return f;
  }, [submitted, sort, filters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['search-products', apiFilters],
    queryFn: ({ pageParam = 1 }) => getProducts({ ...apiFilters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      const { page, limit, total } = lastPage.pagination;
      const totalPages = Math.ceil(total / limit);
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!submitted,
  });

  const allProducts = useMemo(() =>
    data?.pages.flatMap((p) => p.data) || []
  , [data]);

  const facets = useMemo(() => {
    if (data?.pages?.[0]?.facets) return data.pages[0].facets as Facets;
    return undefined;
  }, [data]);

  const pagination = useMemo(() => {
    if (data?.pages?.[0]?.pagination) return data.pages[0].pagination;
    return undefined;
  }, [data]);

  const totalResults = pagination?.total ?? 0;
  const totalPages = pagination?.pages ?? 1;
  const loadedPages = data?.pages?.length ?? 0;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data]);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSubmitted(trimmed);
    setQuery(trimmed);
    const params = new URLSearchParams();
    params.set('q', trimmed);
    setSearchParams(params);
    setRecentSearches((prev) => [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, 6));
  };

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (submitted) params.set('q', submitted);
    if (newFilters.categories.length > 0) params.set('categories', newFilters.categories.join(','));
    if (newFilters.brands.length > 0) params.set('brands', newFilters.brands.join(','));
    if (newFilters.minPrice > 0) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice < 200000) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.minRating > 0) params.set('minRating', String(newFilters.minRating));
    if (newFilters.minDiscount > 0) params.set('minDiscount', String(newFilters.minDiscount));
    if (newFilters.inStock) params.set('inStock', 'true');
    if (sort !== 'relevance') params.set('sort', sort);
    setSearchParams(params);
  };

  const removeFilterChip = (type: string, value?: string) => {
    const next = { ...filters };
    if (type === 'category' && value) {
      next.categories = next.categories.filter((c) => c !== value);
    } else if (type === 'brand' && value) {
      next.brands = next.brands.filter((b) => b !== value);
    } else if (type === 'rating') {
      next.minRating = 0;
    } else if (type === 'discount') {
      next.minDiscount = 0;
    } else if (type === 'price') {
      next.minPrice = 0; next.maxPrice = 200000;
    } else if (type === 'stock') {
      next.inStock = false;
    }
    updateFilters(next);
  };

  const hasActiveFilters =
    filters.categories.length > 0 || filters.brands.length > 0 ||
    filters.minPrice > 0 || filters.maxPrice < 200000 ||
    filters.minRating > 0 || filters.minDiscount > 0 || filters.inStock;

  const activeFilterCount =
    filters.categories.length + filters.brands.length +
    (filters.minRating > 0 ? 1 : 0) + (filters.minDiscount > 0 ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 200000 ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const [popularSuggestions, setPopularSuggestions] = useState<string[]>(POPULAR_SEARCHES);

  useEffect(() => {
    if (!submitted) {
      getSearchSuggestions().then((res) => {
        if (res.data?.popular?.length) setPopularSuggestions(res.data.popular);
      }).catch(() => {});
    }
  }, [submitted]);

  const goToPage = (page: number) => {
    if (page > loadedPages && hasNextPage) {
      fetchNextPage();
    }
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (loadedPages > 3) {
        pages.push('dots');
        for (let i = Math.max(2, loadedPages - 1); i <= Math.min(totalPages, loadedPages + 1); i++) {
          pages.push(i);
        }
      } else {
        for (let i = 2; i <= Math.min(4, totalPages); i++) pages.push(i);
      }
      if (loadedPages + 1 < totalPages) pages.push('dots');
      if (loadedPages < totalPages) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
          className="flex-1 flex items-center gap-2 bg-white border border-[#E0EFEF] rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-[#01B4BA] focus-within:ring-2 focus-within:ring-[#01B4BA]/20 transition-all"
        >
          <SearchIcon size={17} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="flex-1 font-inter text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSubmitted(''); }} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </form>
      </div>

      {!submitted ? (
        <div className="flex flex-col gap-6">
          {recentSearches.length > 0 && (
            <div>
              <h3 className="font-poppins font-bold text-sm text-[#01406D] mb-3 flex items-center gap-2">
                <Clock size={14} className="text-gray-400" /> Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="font-inter text-sm text-gray-600 bg-gray-100 hover:bg-[#01B4BA]/10 hover:text-[#01B4BA] px-4 py-1.5 rounded-full transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-poppins font-bold text-sm text-[#01406D] mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#01B4BA]" /> Popular Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="font-inter text-sm text-gray-600 bg-[#01B4BA]/5 hover:bg-[#01B4BA]/15 text-[#01406D] px-4 py-1.5 rounded-full border border-[#01B4BA]/15 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          <div className="hidden lg:block w-60 flex-shrink-0 sticky top-28">
            <FilterPanel
              filters={filters}
              facets={facets}
              onChange={updateFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>

          <div className="flex-1 min-w-0" ref={resultsRef}>
            {/* Sort Bar */}
            <div className="bg-white border border-[#E0EFEF] rounded-lg p-3 flex items-center justify-between mb-4">
              <p className="font-inter text-sm text-gray-500">
                {isLoading ? (
                  'Searching...'
                ) : (
                  <>
                    <span className="font-bold text-[#01406D]">{totalResults}</span> results for "<span className="font-bold text-[#01406D]">{submitted}</span>"
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`lg:hidden flex items-center gap-1.5 font-poppins font-bold text-xs px-3 py-2 rounded-lg border transition-all ${
                    hasActiveFilters
                      ? 'bg-[#01B4BA] text-white border-[#01B4BA]'
                      : 'border-[#E0EFEF] text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  Filters {hasActiveFilters && `(${activeFilterCount})`}
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSort(!showSort)}
                    className="flex items-center gap-1.5 font-inter text-xs px-3 py-2 rounded-lg border border-[#E0EFEF] hover:border-[#01B4BA] text-[#01406D] transition-all bg-white"
                  >
                    Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                    <ChevronDown size={13} />
                  </button>
                  <AnimatePresence>
                    {showSort && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-full mt-1 bg-white border border-[#E0EFEF] rounded-lg shadow-lg overflow-hidden z-50 min-w-[200px]"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSort(opt.value);
                              setShowSort(false);
                              const params = new URLSearchParams(searchParams);
                              if (opt.value !== 'relevance') params.set('sort', opt.value);
                              else params.delete('sort');
                              setSearchParams(params);
                            }}
                            className={`w-full text-left px-4 py-2.5 font-inter text-sm transition-colors flex items-center justify-between ${
                              sort === opt.value
                                ? 'bg-[#01B4BA]/10 text-[#01B4BA] font-bold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                            {sort === opt.value && <Check size={13} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-[#E0EFEF] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-[#01406D] text-white'
                        : 'text-[#01406D] hover:bg-gray-50'
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-all ${
                      viewMode === 'list'
                        ? 'bg-[#01406D] text-white'
                        : 'text-[#01406D] hover:bg-gray-50'
                    }`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <div className="lg:hidden mb-4">
                  <FilterPanel
                    filters={filters}
                    facets={facets}
                    onChange={updateFilters}
                    onClose={() => setShowFilters(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.categories.map((cat) => (
                  <span key={`cat-${cat}`} className="flex items-center gap-1 bg-[#01B4BA]/10 text-[#01B4BA] font-poppins font-bold text-xs px-3 py-1 rounded-full">
                    {cat}
                    <button onClick={() => removeFilterChip('category', cat)}><X size={11} /></button>
                  </span>
                ))}
                {filters.brands.map((b) => (
                  <span key={`br-${b}`} className="flex items-center gap-1 bg-[#01406D]/10 text-[#01406D] font-poppins font-bold text-xs px-3 py-1 rounded-full">
                    {b}
                    <button onClick={() => removeFilterChip('brand', b)}><X size={11} /></button>
                  </span>
                ))}
                {filters.minRating > 0 && (
                  <span className="flex items-center gap-1 bg-[#FF7A0F]/10 text-[#FF7A0F] font-poppins font-bold text-xs px-3 py-1 rounded-full">
                    {filters.minRating}+ Stars
                    <button onClick={() => removeFilterChip('rating')}><X size={11} /></button>
                  </span>
                )}
                {filters.minDiscount > 0 && (
                  <span className="flex items-center gap-1 bg-[#01B4BA]/10 text-[#01B4BA] font-poppins font-bold text-xs px-3 py-1 rounded-full">
                    {filters.minDiscount}%+ off
                    <button onClick={() => removeFilterChip('discount')}><X size={11} /></button>
                  </span>
                )}
                {(filters.minPrice > 0 || filters.maxPrice < 200000) && (
                  <span className="flex items-center gap-1 bg-gray-100 text-[#01406D] font-poppins font-bold text-xs px-3 py-1 rounded-full">
                    ₹{filters.minPrice.toLocaleString('en-IN')} – ₹{filters.maxPrice >= 200000 ? '50K+' : filters.maxPrice.toLocaleString('en-IN')}
                    <button onClick={() => removeFilterChip('price')}><X size={11} /></button>
                  </span>
                )}
                {filters.inStock && (
                  <span className="flex items-center gap-1 bg-[#01B4BA]/10 text-[#01B4BA] font-poppins font-bold text-xs px-3 py-1 rounded-full">
                    In Stock
                    <button onClick={() => removeFilterChip('stock')}><X size={11} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid / Results */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="text-[#01B4BA] animate-spin" />
                </motion.div>
              ) : allProducts.length === 0 ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 gap-5 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <SearchIcon size={36} className="text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-lg text-[#01406D]">No results for "{submitted}"</h3>
                    <p className="font-inter text-sm text-[#6B8FA3] mt-1">Try different keywords or remove some filters.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {popularSuggestions.slice(0, 4).map((s) => (
                      <button key={s} onClick={() => handleSearch(s)} className="font-inter text-xs bg-gray-100 hover:bg-[#01B4BA]/10 text-gray-600 hover:text-[#01B4BA] px-4 py-2 rounded-full transition-all">
                        Try "{s}"
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="results" className="flex flex-col gap-4">
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'flex flex-col gap-3'
                    }
                  >
                    {allProducts.map((product) => (
                      <ProductResultCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Infinite Scroll Sentinel */}
                  <div ref={sentinelRef} className="h-4" />

                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="text-[#01B4BA] animate-spin" />
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 py-6">
                      <button
                        onClick={() => goToPage(Math.max(1, loadedPages - 1))}
                        disabled={loadedPages <= 1}
                        className="p-2 rounded-lg text-[#01406D] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {getPageNumbers().map((page, idx) =>
                        page === 'dots' ? (
                          <span key={`dots-${idx}`} className="px-1 text-[#6B8FA3] text-sm">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`min-w-[32px] h-8 rounded-full text-sm font-poppins font-bold transition-all ${
                              page === loadedPages
                                ? 'bg-[#01B4BA] text-white'
                                : 'text-[#01406D] hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => goToPage(loadedPages + 1)}
                        disabled={!hasNextPage}
                        className="p-2 rounded-lg text-[#01406D] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {!hasNextPage && allProducts.length > 0 && (
                    <p className="text-center font-inter text-xs text-[#6B8FA3] py-4">All results loaded</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
