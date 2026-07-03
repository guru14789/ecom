import React, { useState, useEffect } from 'react';
import { ChevronRight, Smartphone, Shirt, Home, Sparkles, ShoppingCart, Baby, Book } from 'lucide-react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductCard } from '../../components/buyer/ProductCard';
import type { Product } from '../../types';



const CATEGORIES = [
  { id: '1', name: 'Mobiles & Tech', icon: <Smartphone size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '2', name: 'Fashion & Apparel', icon: <Shirt size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '3', name: 'Home & Kitchen', icon: <Home size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '4', name: 'Beauty & Grooming', icon: <Sparkles size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '5', name: 'Daily Groceries', icon: <ShoppingCart size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '6', name: 'Snacks & Beverages', icon: <ShoppingCart size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '7', name: 'Toys & Baby', icon: <Baby size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
  { id: '8', name: 'Books & More', icon: <Book size={28} className="text-gray-900 stroke-[1.5]" />, color: 'bg-gray-100 hover:bg-gray-200' },
];

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), limit(12));
        const snapshot = await getDocs(q);
        const prods: Product[] = [];
        snapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(prods);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6 md:space-y-10 pb-20 md:pb-8">
      
      {/* Hero Banner Grid */}
      <section className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-2xl overflow-hidden h-40 md:h-64 bg-secondary border cursor-pointer group">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
            <div className="p-6 relative z-20 flex flex-col justify-center h-full max-w-[60%]">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">Great Indian Festival</h2>
              <p className="text-gray-300 font-medium text-sm md:text-base">Up to 80% off on Top Smartphones.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-[120px] md:text-[180px] drop-shadow-xl opacity-20 grayscale group-hover:scale-105 transition-transform">📱</div>
          </div>
          
          <div className="hidden md:flex relative rounded-2xl overflow-hidden h-64 bg-primary/10 border border-primary/20 cursor-pointer group">
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
            <div className="p-6 relative z-20 flex flex-col justify-center h-full max-w-[60%]">
              <h2 className="text-4xl font-black text-gray-900 leading-tight mb-2">Festive Fashion</h2>
              <p className="text-gray-500 font-medium">Trending styles from top brands.</p>
            </div>
            <div className="absolute right-0 bottom-0 text-[180px] drop-shadow-sm opacity-20 grayscale group-hover:scale-105 transition-transform">👕</div>
          </div>
        </div>
      </section>

      {/* Categories (Horizontal Scroll on Mobile, Grid on Desktop) */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[17px] md:text-xl font-black text-gray-900">Explore by Category</h2>
        </div>
        
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-8 gap-4 md:gap-6 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[72px] md:min-w-0">
              <div className={`w-[72px] h-[72px] md:w-full md:aspect-square rounded-[1rem] ${cat.color} flex items-center justify-center transition-all duration-300 border border-gray-200 group-hover:border-primary group-hover:shadow-md`}>
                <div className="group-hover:scale-110 transition-transform duration-500">
                  {cat.icon}
                </div>
              </div>
              <span className="text-[11px] md:text-[13px] font-medium text-center text-gray-800 leading-tight md:px-1">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Added Products */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[17px] md:text-xl font-black text-gray-900">Newly Registered Products</h2>
          <button className="text-sm font-bold text-accent flex items-center hover:bg-accent/10 px-2 py-1 rounded-lg transition-colors">
            See all <ChevronRight className="h-4 w-4 ml-0.5" />
          </button>
        </div>
        
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 lg:grid-cols-6 gap-4 hide-scrollbar snap-x">
          {loading ? (
            <div className="col-span-full py-10 text-center text-gray-500">Loading products from database...</div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="min-w-[140px] max-w-[150px] md:max-w-none md:min-w-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
              <div className="text-4xl mb-2">🏪</div>
              <h3 className="font-bold text-gray-900">No Products Yet</h3>
              <p className="text-sm text-gray-500 max-w-sm">Vendors need to register products for them to appear here.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
