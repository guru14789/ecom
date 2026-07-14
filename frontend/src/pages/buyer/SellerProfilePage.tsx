import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Store, Star, MapPin, Search } from 'lucide-react';
import { ProductCard } from '../../components/buyer/ProductCard';
import type { Product } from '../../types';

export const SellerProfilePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!vendorId) return;
      try {
        setLoading(true);
        const vendorDoc = await getDoc(doc(db, 'users', vendorId));
        if (vendorDoc.exists()) {
          setVendor({ id: vendorDoc.id, ...vendorDoc.data() });
        }

        const q = query(
          collection(db, 'products'),
          where('vendorId', '==', vendorId),
          where('isAvailable', '==', true)
        );
        const snapshot = await getDocs(q);
        const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching seller profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-20">
        <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Seller Not Found</h2>
        <p className="text-gray-500 mt-2">The seller you are looking for does not exist or has been removed.</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block font-medium">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Seller Header */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8">
        <div className="h-48 bg-gradient-to-r from-primary/80 to-primary w-full relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 mb-6">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg relative z-10">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border">
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.businessName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-gray-900">{vendor.businessName || vendor.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 font-medium">
                <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                  <Star className="w-4 h-4 fill-current" /> 
                  4.8 (120 Ratings)
                </span>
                {vendor.city && (
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                    <MapPin className="w-4 h-4" /> {vendor.city}, {vendor.state}
                  </span>
                )}
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified Seller
                </span>
              </div>
            </div>
            <div className="flex gap-3 pb-2 w-full md:w-auto">
              <button 
                onClick={async () => {
                  try {
                    const { chatApi } = await import('../../lib/api');
                    const { toast } = await import('react-hot-toast');
                    toast.loading('Starting chat...', { id: 'chat' });
                    const res = await chatApi.buyer.initiate(vendorId);
                    toast.success('Chat started!', { id: 'chat' });
                    window.dispatchEvent(new CustomEvent('open-chat', { detail: { chatId: res.data.id } }));
                  } catch (err: any) {
                    const { toast } = await import('react-hot-toast');
                    toast.error(err.message || 'Failed to start chat', { id: 'chat' });
                  }
                }}
                className="flex-1 md:flex-none px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-full shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
              >
                Message Seller
              </button>
            </div>
          </div>
          <p className="text-gray-600 max-w-3xl leading-relaxed">
            {vendor.description || "Welcome to our store! We offer high quality products with fast shipping. Browse our catalog below and feel free to reach out if you have any questions."}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">All Products ({products.length})</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search this store..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">This seller has no available products right now.</p>
        </div>
      )}
    </div>
  );
};
