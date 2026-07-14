import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductCard } from '../../components/buyer/ProductCard';
import type { Product } from '../../types';
import { ChevronRight, SlidersHorizontal, X, Star, Check } from 'lucide-react';

const DISCOUNT_RANGES = [10, 25, 50, 70];

export const CategoryPage: React.FC = () => {
  const { '*': splat } = useParams<{ '*': string }>();
  const navigate = useNavigate();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [includeOutOfStock, setIncludeOutOfStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  
  // UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const pathParts = splat ? splat.split('/') : [];
  const mainCategory = pathParts[0] || '';
  const subCategory = pathParts[1] || '';

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { buyerApi } = await import('../../lib/api');
        const response = await buyerApi.products.list({ 
          category: mainCategory && mainCategory !== 'all' ? mainCategory : undefined,
          limit: 100
        });
        
        let prods: Product[] = response.data || [];

        if (subCategory) {
          prods = prods.filter(p => p.subcategory === subCategory);
        }

        setProducts(prods);
      } catch (err) {
        console.error("Error fetching category products:", err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
    
    // Reset filters on category change
    setSelectedBrands([]);
    setMinRating(0);
    setMinDiscount(0);
    setPriceRange([0, 100000]);
  }, [mainCategory, subCategory]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => { if (p.brand) brands.add(p.brand); });
    return Array.from(brands).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (minRating > 0 && (p.rating || 0) < minRating) return false;
      if (minDiscount > 0 && (p.discountPercent || 0) < minDiscount) return false;
      if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) return false;
      if (!includeOutOfStock && (!p.isAvailable || (p.stock || 0) <= 0)) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return b.id.localeCompare(a.id);
        default: return 0; // featured
      }
    });

    return result;
  }, [products, priceRange, minRating, minDiscount, selectedBrands, includeOutOfStock, sortBy]);

  const displayTitle = subCategory
    ? subCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : mainCategory
      ? mainCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'All Products';
      
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const renderStars = (count: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star} 
          className={`w-4 h-4 ${star <= count ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
        />
      ))}
      <span className="text-sm text-gray-700 ml-1">& Up</span>
    </div>
  );

  return (
    <div className="pb-20 md:pb-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/category/${mainCategory || 'all'}`} className={`capitalize hover:text-primary transition-colors ${!subCategory ? 'font-bold text-gray-900' : ''}`}>
          {mainCategory.replace('-', ' ') || 'All'}
        </Link>
        {subCategory && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="font-bold text-gray-900 capitalize">{subCategory.replace('-', ' ')}</span>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Mobile Filter Toggle */}
        <div className="w-full md:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-4">
          <span className="font-bold text-gray-900">{filteredProducts.length} Results</span>
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg font-bold text-sm text-gray-700"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`fixed inset-0 z-50 bg-white md:bg-transparent md:sticky md:top-24 md:h-[calc(100vh-8rem)] md:block md:w-64 flex-shrink-0 overflow-y-auto custom-scrollbar ${showMobileFilters ? 'block' : 'hidden'}`}>
          <div className="p-6 md:p-0">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-6 md:hidden">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Category */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Department</h3>
                <div className="space-y-2">
                  <Link to="/category/all" className={`block text-sm hover:text-primary ${!mainCategory || mainCategory === 'all' ? 'font-bold text-primary' : 'text-gray-600'}`}>All Departments</Link>
                  <Link to="/category/electronics" className={`block text-sm hover:text-primary ${mainCategory === 'electronics' ? 'font-bold text-primary' : 'text-gray-600'}`}>Electronics</Link>
                  <Link to="/category/fashion" className={`block text-sm hover:text-primary ${mainCategory === 'fashion' ? 'font-bold text-primary' : 'text-gray-600'}`}>Fashion</Link>
                  <Link to="/category/groceries" className={`block text-sm hover:text-primary ${mainCategory === 'groceries' ? 'font-bold text-primary' : 'text-gray-600'}`}>Groceries</Link>
                  <Link to="/category/home-kitchen" className={`block text-sm hover:text-primary ${mainCategory === 'home-kitchen' ? 'font-bold text-primary' : 'text-gray-600'}`}>Home & Kitchen</Link>
                  <Link to="/category/beauty" className={`block text-sm hover:text-primary ${mainCategory === 'beauty' ? 'font-bold text-primary' : 'text-gray-600'}`}>Beauty</Link>
                </div>
              </div>

              {/* Customer Reviews */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Customer Reviews</h3>
                <div className="space-y-3">
                  {[4, 3, 2, 1].map(rating => (
                    <button 
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                      className={`block hover:opacity-80 transition-opacity ${minRating === rating ? 'bg-gray-50 -mx-2 px-2 py-1 rounded' : 'py-1'}`}
                    >
                      {renderStars(rating)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {availableBrands.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Brands</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {availableBrands.map(brand => (
                      <label key={brand} onClick={() => toggleBrand(brand)} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                          {selectedBrands.includes(brand) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Price</h3>
                <div className="space-y-2 mb-4">
                  <button onClick={() => setPriceRange([0, 100000])} className={`block text-sm ${priceRange[0] === 0 && priceRange[1] === 100000 ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}>Any Price</button>
                  <button onClick={() => setPriceRange([0, 500])} className={`block text-sm ${priceRange[1] === 500 ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}>Under ₹500</button>
                  <button onClick={() => setPriceRange([500, 1500])} className={`block text-sm ${priceRange[0] === 500 && priceRange[1] === 1500 ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}>₹500 - ₹1500</button>
                  <button onClick={() => setPriceRange([1500, 5000])} className={`block text-sm ${priceRange[0] === 1500 && priceRange[1] === 5000 ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}>₹1500 - ₹5000</button>
                  <button onClick={() => setPriceRange([5000, 100000])} className={`block text-sm ${priceRange[0] === 5000 ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}>Over ₹5000</button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0] || ''}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-20 px-2 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1] === 100000 ? '' : priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 100000])}
                    className="w-20 px-2 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">Go</button>
                </div>
              </div>

              {/* Discount */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Discount</h3>
                <div className="space-y-2">
                  <button onClick={() => setMinDiscount(0)} className={`block text-sm ${minDiscount === 0 ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}>All Discounts</button>
                  {DISCOUNT_RANGES.map(discount => (
                    <button 
                      key={discount}
                      onClick={() => setMinDiscount(discount)}
                      className={`block text-sm ${minDiscount === discount ? 'font-bold text-primary' : 'text-gray-600 hover:text-primary'}`}
                    >
                      {discount}% Off or more
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Availability</h3>
                <label onClick={() => setIncludeOutOfStock(!includeOutOfStock)} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeOutOfStock ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                    {includeOutOfStock && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">Include Out of Stock</span>
                </label>
              </div>

            </div>
            
            {/* Mobile Apply Button */}
            <div className="mt-8 md:hidden">
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold"
              >
                Show Results
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full">
          {/* Top Bar */}
          <div className="hidden md:flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{displayTitle}</h1>
              <p className="text-gray-500 text-sm mt-1">{filteredProducts.length} results</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-none bg-gray-50 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              Loading products...
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="group">
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="text-6xl mb-4 opacity-50">🛒</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
              <p className="text-gray-500 max-w-sm mb-6">Try checking your spelling or clearing some of the filters to find what you're looking for.</p>
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setMinRating(0);
                  setMinDiscount(0);
                  setPriceRange([0, 100000]);
                  setIncludeOutOfStock(false);
                }}
                className="text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
