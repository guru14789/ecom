import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Loader, ArrowLeft } from 'lucide-react';
import { buyerApi } from '../../lib/api';
import { ProductCard } from '../../components/buyer/ProductCard';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await buyerApi.products.search({ q: searchQuery, limit: 50 });
      if (res.data) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      handleSearch(query);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Mobile-friendly Header with Search Bar */}
      <div className="bg-white sticky top-0 z-50 px-4 py-3 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <form onSubmit={onSubmit} className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands..."
            className="w-full bg-gray-100 text-gray-900 text-sm rounded-full py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            autoFocus
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      <div className="container px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Searching for "{query}"...</p>
          </div>
        ) : hasSearched ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {results.length} {results.length === 1 ? 'result' : 'results'} for "{searchParams.get('q')}"
              </h2>
            </div>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500">Try checking your spelling or use more general terms</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 opacity-50">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Enter a search term to find products</h3>
          </div>
        )}
      </div>
    </div>
  );
};
