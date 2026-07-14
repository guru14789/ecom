import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { useHomepage } from '../../hooks/useProducts';
import { ProductCard } from '../../components/buyer/ProductCard';
import { CATEGORY_DATA } from '../../data/categories';
import {
  ShoppingBag, Shirt, Smartphone, Sparkles, Laptop, Lamp, Tv, Gamepad2, Apple, Car, Bike, Dumbbell, Book, Armchair
} from 'lucide-react';

const FLIPKART_CATEGORIES = [
  { id: 'fc1', name: 'For You', slug: 'all', icon: <ShoppingBag size={24} className="stroke-[1.5]" />, active: true },
  { id: 'fc2', name: 'Fashion', slug: 'fashion', icon: <Shirt size={24} className="stroke-[1.5]" /> },
  { id: 'fc3', name: 'Mobiles', slug: 'mobiles', icon: <Smartphone size={24} className="stroke-[1.5]" /> },
  { id: 'fc4', name: 'Beauty', slug: 'beauty', icon: <Sparkles size={24} className="stroke-[1.5]" /> },
  { id: 'fc5', name: 'Electronics', slug: 'electronics', icon: <Laptop size={24} className="stroke-[1.5]" /> },
  { id: 'fc6', name: 'Home', slug: 'home', icon: <Lamp size={24} className="stroke-[1.5]" /> },
  { id: 'fc7', name: 'Appliances', slug: 'appliances', icon: <Tv size={24} className="stroke-[1.5]" /> },
  { id: 'fc8', name: 'Toys, ba...', slug: 'toys', icon: <Gamepad2 size={24} className="stroke-[1.5]" /> },
  { id: 'fc9', name: 'Food & H...', slug: 'food', icon: <Apple size={24} className="stroke-[1.5]" /> },
  { id: 'fc10', name: 'Auto Acc...', slug: 'auto', icon: <Car size={24} className="stroke-[1.5]" /> },
  { id: 'fc11', name: '2 Wheelers', slug: '2-wheelers', icon: <Bike size={24} className="stroke-[1.5]" /> },
  { id: 'fc12', name: 'Sports & ...', slug: 'sports', icon: <Dumbbell size={24} className="stroke-[1.5]" /> },
  { id: 'fc13', name: 'Books & ...', slug: 'books', icon: <Book size={24} className="stroke-[1.5]" /> },
  { id: 'fc14', name: 'Furniture', slug: 'furniture', icon: <Armchair size={24} className="stroke-[1.5]" /> }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: homepageData, isLoading, error } = useHomepage();

  return (
    <div className="container py-4 md:py-8 space-y-8 md:space-y-12">
      
      {/* Hero Section */}
      <section className="pt-6">
        <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 border-none shadow-sm min-h-[400px] flex items-center">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            {/* Abstract floating shapes for decoration */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-green-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-1/4 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-10 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="p-8 md:p-16 relative z-20 flex flex-col justify-center h-full max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black text-blue-950 leading-[1.1] mb-2 tracking-tight">
              Order your<br/>Favorite Products
            </h1>
            <p className="text-orange-500 font-extrabold text-lg md:text-xl mb-8">
              #Free Delivery
            </p>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="relative max-w-md w-full shadow-xl shadow-blue-900/5 rounded-full overflow-hidden bg-white flex items-center p-1.5 border border-gray-100"
            >
              <div className="pl-4 pr-2 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your daily groceries..." 
                className="flex-1 py-3 px-2 text-sm md:text-base outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
              <button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-8 py-3 rounded-full hover:from-orange-600 hover:to-orange-700 transition-colors h-full whitespace-nowrap shadow-lg shadow-orange-500/20">
                Search
              </button>
            </form>
          </div>
          
          {/* Decorative Image Area */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none">
            <div className="w-full h-full relative">
              {/* Fake images placeholders simulating floating groceries */}
              <div className="absolute top-16 left-10 text-6xl drop-shadow-xl animate-bounce" style={{animationDuration: '3s'}}>🥑</div>
              <div className="absolute bottom-16 left-24 text-7xl drop-shadow-xl animate-bounce" style={{animationDuration: '4s'}}>🥬</div>
              <div className="absolute top-32 right-32 text-8xl drop-shadow-xl animate-bounce" style={{animationDuration: '3.5s'}}>🥖</div>
              <div className="absolute bottom-24 right-16 text-6xl drop-shadow-xl animate-bounce" style={{animationDuration: '4.5s'}}>🍅</div>
              <div className="absolute top-10 right-10 text-5xl drop-shadow-xl animate-bounce" style={{animationDuration: '2.5s'}}>🥦</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Categories Navigation */}
      <section className="bg-white border-b border-gray-100 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center overflow-x-auto hide-scrollbar gap-6 md:gap-8 lg:justify-between py-2">
          {FLIPKART_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={`flex flex-col items-center gap-1.5 cursor-pointer relative pb-3 flex-shrink-0 group ${cat.active ? 'text-blue-900' : 'text-gray-500 hover:text-orange-500'}`}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 ${cat.active ? 'bg-gradient-to-br from-blue-100 to-green-100 text-blue-600 shadow-sm' : 'bg-transparent text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                {cat.icon}
              </div>
              <span className={`text-[10px] md:text-xs text-center whitespace-nowrap ${cat.active ? 'font-black' : 'font-semibold'}`}>
                {cat.name}
              </span>
              {cat.active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%+8px)] h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-t-lg" />
              )}
            </Link>
          ))}
        </div>
      </section>

      {FLIPKART_CATEGORIES.filter(c => c.slug !== 'all').map((category, index) => {
        // Find real products for this category from any of the homepage endpoints (featured, new arrivals, bestsellers)
        const allFetchedProducts = [
          ...(homepageData?.featuredProducts || []),
          ...(homepageData?.newArrivals || []),
          ...(homepageData?.bestsellers || []),
        ];

        // Deduplicate products by ID
        const uniqueProductsMap: Record<string, any> = {};
        allFetchedProducts.forEach((p: any) => {
          if (p && p.id) uniqueProductsMap[p.id] = p;
        });

        const categoryProducts = Object.values(uniqueProductsMap).filter((p: any) => {
          const productCat = (p.category || '').toLowerCase().trim();
          const targetCat = (category.slug || '').toLowerCase().trim();
          const productSub = (p.subcategory || '').toLowerCase().trim();
          
          // Map Flipkart categories to database categories exclusively
          if (targetCat === 'mobiles') {
            return productCat === 'electronics' || productSub.includes('mobile') || productCat.includes('mobile') || productSub === 'mobiles' || productCat === 'mobiles';
          }
          
          // If Mobiles shelf is active, Electronics shelf should exclude mobile products
          if (targetCat === 'electronics') {
            const isMobile = productSub.includes('mobile') || productCat.includes('mobile') || productSub === 'mobiles' || productCat === 'mobiles';
            if (isMobile) return false;
            return productCat.includes('elect') || productSub.includes('elect');
          }
          
          if (targetCat === 'appliances') {
            return productCat === 'home-kitchen' || productCat.includes('appliance') || productSub.includes('appliance') || productSub === 'appliances';
          }
          
          // If Appliances shelf is active, Home shelf should exclude appliance products
          if (targetCat === 'home') {
            const isAppliance = productCat.includes('appliance') || productSub.includes('appliance') || productSub === 'appliances';
            if (isAppliance) return false;
            return productCat.includes('home') || productCat.includes('kitchen') || productSub.includes('home');
          }
          
          if (targetCat === 'food' && (productCat === 'groceries' || productCat.includes('food') || productSub.includes('food') || productCat === 'grocery')) return true;
          if (targetCat === 'fashion' && (productCat.includes('fash') || productCat.includes('cloth') || productSub.includes('fash'))) return true;
          if (targetCat === 'beauty' && (productCat.includes('beaut') || productCat.includes('care') || productSub.includes('beaut'))) return true;

          return productCat === targetCat || productSub === targetCat;
        });
        
        console.log(`Category: ${category.name} (${category.slug}) matched products:`, categoryProducts);

        if (categoryProducts.length === 0) {
          // Do not render empty categories in production
          return null;
        }

        return (
          <section key={category.id} className="pt-2 pb-6 border-b border-gray-100 last:border-0">
            <div className="flex items-center justify-between mb-4 px-2 md:px-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">{category.name}</h2>
              <Link to={`/category/${category.slug}`} className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
                see all
              </Link>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar custom-scrollbar gap-4 px-2 md:px-0 pb-4">
              {categoryProducts.map((product) => (
                <div key={product.id} className="min-w-[160px] max-w-[160px] md:min-w-[180px] md:max-w-[180px] flex-shrink-0">
                  <Link to={`/product/${product.id}`} className="group block h-full">
                    <ProductCard product={product} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Download App Section */}
      <section>
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-2xl shadow-blue-900/20">
          {/* Decorative shapes */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-md text-center md:text-left mb-8 md:mb-0 relative z-10">
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4">Download App</h2>
            <p className="text-blue-100/80 mb-8 text-sm md:text-base">
              Get the best shopping experience on your mobile device. Download our app today and get exclusive offers!
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.24-.86 3.64-.8 1.48.06 2.65.65 3.32 1.63-2.76 1.67-2.29 5.37.49 6.46-.71 1.94-1.57 3.93-2.53 4.88zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.39-2.06 4.38-3.74 4.25z"/></svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-blue-200">Download on the</span>
                  <span className="font-bold text-sm tracking-wide">App Store</span>
                </div>
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M3.609 1.814L13.792 12 3.61 22.186c-.165-.154-.265-.417-.265-.773V2.587c0-.356.1-.62.264-.773zm10.953 10.952l2.338 2.338-10.45 6.033 8.112-8.371zm.699-.699l3.818-3.818c.677-.677.677-1.782 0-2.46L6.45 2.064l8.811 9.003zm-1.398 1.398L5.052 21.936l10.45-6.033-2.338-2.338z"/></svg>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-blue-200">GET IT ON</span>
                  <span className="font-bold text-sm tracking-wide">Google Play</span>
                </div>
              </button>
            </div>
          </div>
          <div className="hidden md:block relative z-10">
            <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-3xl rotate-12 shadow-2xl border-8 border-white/10 flex items-center justify-center backdrop-blur-sm">
              <span className="text-7xl drop-shadow-lg">📱</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
