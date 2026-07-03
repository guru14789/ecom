import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductCard } from '../../components/buyer/ProductCard';
import type { Product } from '../../types';
import { ChevronRight } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { "*": splat } = useParams<{ "*": string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // splat will be something like "electronics/mobiles" or "electronics"
  const pathParts = splat ? splat.split('/') : [];
  const mainCategory = pathParts[0] || '';
  const subCategory = pathParts[1] || '';

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        let q = collection(db, 'products') as any;
        
        if (mainCategory) {
          q = query(q, where('category', '==', mainCategory));
        }
        
        const snapshot = await getDocs(q);
        let prods: Product[] = [];
        snapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
        });

        // Client-side filtering for subcategory if needed (or we could chain composite index)
        if (subCategory) {
          prods = prods.filter(p => p.subcategory === subCategory);
        }

        setProducts(prods);
      } catch (error) {
        console.error("Error fetching category products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [mainCategory, subCategory]);

  const displayTitle = subCategory 
    ? subCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : mainCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
        <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button>
        <ChevronRight className="w-4 h-4" />
        <span className="capitalize">{mainCategory.replace('-', ' ')}</span>
        {subCategory && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="font-bold text-gray-900 capitalize">{subCategory.replace('-', ' ')}</span>
          </>
        )}
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{displayTitle || 'All Products'}</h1>
        <p className="text-gray-500 text-sm">Showing {products.length} products</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading products...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No products found</h2>
          <p className="text-gray-500">We couldn't find any products in this category.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};
