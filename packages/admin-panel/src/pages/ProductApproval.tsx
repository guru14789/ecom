import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Eye, ExternalLink, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  image: string;
  vendorId: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const ProductApproval: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products/pending');
      setProducts(res.data.data || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/products/${id}/featured`, { isFeatured: featured });
      toast.success(featured ? 'Product featured' : 'Product unfeatured');
      setProducts(products.map(p => p._id === id ? { ...p, isFeatured: featured } : p));
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-artz font-bold text-navy">Product Approval</h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage products</p>
        </div>
        <button onClick={fetchProducts} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
          <Eye size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No products found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-50" />
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.category}</td>
                  <td className="px-4 py-3 text-sm font-semibold">₹{p.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${p.isFeatured ? 'bg-teal/10 text-teal' : 'bg-slate-100 text-slate-500'}`}>
                      {p.isFeatured ? 'Featured' : 'Standard'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedProduct(p)} className="p-2 hover:bg-slate-100 rounded-lg"><Eye size={14} className="text-slate-400" /></button>
                      <button onClick={() => handleToggleFeatured(p._id, !p.isFeatured)} disabled={actionLoading === p._id} className="p-2 hover:bg-teal/10 rounded-lg">
                        {p.isFeatured ? <XCircle size={14} className="text-red-400" /> : <CheckCircle size={14} className="text-teal" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-20 h-20 rounded-xl object-cover bg-slate-50" />
              <div className="flex-1">
                <h3 className="font-artz font-bold text-navy">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500">{selectedProduct.category}</p>
                <p className="text-lg font-bold text-teal mt-1">₹{selectedProduct.price}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-100 rounded-lg"><XCircle size={16} className="text-slate-400" /></button>
            </div>
            {selectedProduct.description && (
              <p className="text-sm text-slate-600 mb-4">{selectedProduct.description}</p>
            )}
            <div className="text-xs text-slate-400">
              <p>ID: {selectedProduct._id}</p>
              <p>Vendor: {selectedProduct.vendorId}</p>
              <p>Created: {new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductApproval;
