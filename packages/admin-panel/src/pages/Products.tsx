import React, { useEffect, useState } from 'react';
import {
  Search, Package, Grid3X3, List, CheckCircle, XCircle,
  RefreshCw, Download, ChevronLeft, ChevronRight,
  Eye, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Product {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  category: string;
  image: string;
  stock: number;
  status: 'live' | 'pending_review' | 'rejected';
  vendorName?: string;
  isFeatured?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-[#01B4BA]/10 text-[#01B4BA] border border-[#01B4BA]/20',
  pending_review: 'bg-[#FF7A0F]/10 text-[#FF7A0F] border border-[#FF7A0F]/20',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/admin/products?${params}`);
      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, statusFilter]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/products/${id}/status`, { status });
      toast.success(`Product ${status}`);
      fetchProducts();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const bulkAction = async (status: string) => {
    try {
      await Promise.all(Array.from(selected).map((id) => api.put(`/admin/products/${id}/status`, { status })));
      toast.success(`${selected.size} products updated to "${status}"`);
      setSelected(new Set());
      fetchProducts();
    } catch {
      toast.error('Bulk update failed');
    }
  };

  const exportCSV = () => {
    const csv = [
      'Name,Category,Price,Stock,Status',
      ...products.map((p) => `"${p.name}",${p.category},${p.price},${p.stock},${p.status}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p._id)));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-[6px]" />
        <div className="h-12 skeleton rounded-[6px]" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-56 rounded-2xl skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_150ms_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-[#01406D]">Product Catalogue</h1>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-[#01406D] text-[#01406D] px-4 py-2.5 rounded-[6px] text-xs font-inter font-bold min-h-[44px] hover:bg-[#F5FEFE] transition-colors duration-150">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchProducts} className="flex items-center gap-1.5 text-[#01B4BA] px-4 py-2.5 rounded-[6px] text-xs font-inter font-bold min-h-[44px] hover:bg-[#01B4BA]/5 transition-colors duration-150">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8FA3]" size={15} />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white border border-[#E0EFEF] rounded-[6px] text-sm font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 focus:border-[#01B4BA] transition-all duration-150" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'live', 'pending_review', 'rejected'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-[6px] text-[10px] font-inter font-bold min-h-[36px] transition-all duration-150 ${
                  statusFilter === s ? 'bg-[#01B4BA] text-white' : 'bg-white border border-[#E0EFEF] text-[#6B8FA3] hover:border-[#01B4BA]/40'
                }`}>
                {s === 'all' ? 'All' : s === 'pending_review' ? 'Pending Review' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E0EFEF] rounded-[6px] p-0.5">
          <button onClick={() => setViewMode('table')}
            className={`p-2 rounded-[4px] transition-colors duration-150 ${viewMode === 'table' ? 'bg-[#01B4BA] text-white' : 'text-[#6B8FA3] hover:text-[#01406D]'}`}>
            <List size={16} />
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`p-2 rounded-[4px] transition-colors duration-150 ${viewMode === 'grid' ? 'bg-[#01B4BA] text-white' : 'text-[#6B8FA3] hover:text-[#01406D]'}`}>
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="bg-[#F5FEFE] border border-[#01B4BA] rounded-[6px] px-5 py-3 mb-5 flex items-center justify-between animate-[fadeIn_150ms_ease]">
          <span className="text-sm font-inter font-medium text-[#01406D]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkAction('live')} className="bg-[#01B4BA] text-white px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-[#019aa0] transition-colors">Approve All</button>
            <button onClick={() => bulkAction('rejected')} className="border border-[#FF7A0F] text-[#FF7A0F] px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-[#FFF7ED] transition-colors">Reject All</button>
            <button onClick={() => setSelected(new Set())} className="text-[#6B8FA3] px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-white transition-colors">Clear</button>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[#01406D] text-[#01B4BA] focus:ring-[#01B4BA]/30" />
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Product</th>
                  <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Category</th>
                  <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Price</th>
                  <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Stock</th>
                  <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Status</th>
                  <th className="text-right px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#F5FEFE] flex items-center justify-center">
                        <Package size={28} className="text-[#01B4BA]" />
                      </div>
                      <div>
                        <h3 className="font-artz font-bold text-lg text-[#01406D]">No products found</h3>
                        <p className="font-inter text-sm text-[#6B8FA3] mt-0.5">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p._id} className={`border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors duration-150 ${idx % 2 === 1 ? 'bg-[#F5FEFE]/30' : ''}`}>
                      <td className="px-3 py-4">
                        <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)}
                          className="rounded border-[#01406D] text-[#01B4BA] focus:ring-[#01B4BA]/30" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-[6px] object-cover bg-[#F5FEFE]" />
                          <div>
                            <span className="text-sm font-inter font-medium text-[#01406D] block">{p.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-xs font-inter text-[#6B8FA3]">{p.category}</td>
                      <td className="px-3 py-4">
                        <span className="font-inter font-bold text-sm text-[#01406D]">₹{p.price}</span>
                        {p.mrp && p.mrp > p.price && <span className="text-[10px] text-[#9CA3AF] line-through ml-1">₹{p.mrp}</span>}
                      </td>
                      <td className="px-3 py-4">
                        <span className={`text-sm font-inter font-semibold ${p.stock === 0 ? 'text-red-500' : 'text-[#01406D]'}`}>{p.stock}</span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-inter font-bold ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-500'}`}>
                          {p.status === 'pending_review' ? 'Pending Review' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(p.status === 'pending_review' || p.status === 'rejected') && (
                            <button onClick={() => updateStatus(p._id, 'live')} className="p-2 rounded-[6px] hover:bg-emerald-50 text-emerald-600 min-h-[36px] transition-colors" title="Approve">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {p.status === 'live' && (
                            <button onClick={() => updateStatus(p._id, 'rejected')} className="p-2 rounded-[6px] hover:bg-red-50 text-red-600 min-h-[36px] transition-colors" title="Reject">
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#E0EFEF]">
              <span className="text-xs font-inter text-[#6B8FA3]">Page {page} of {totalPages}</span>
              <div className="flex gap-1.5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-[6px] hover:bg-[#F5FEFE] disabled:opacity-30 min-h-[32px]">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-[6px] text-xs font-inter font-bold transition-colors ${page === p ? 'bg-[#01B4BA] text-white' : 'bg-[#F5FEFE] text-[#6B8FA3] hover:bg-[#E0EFEF]'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-[6px] hover:bg-[#F5FEFE] disabled:opacity-30 min-h-[32px]">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F5FEFE] flex items-center justify-center">
                  <Package size={28} className="text-[#01B4BA]" />
                </div>
                <div>
                  <h3 className="font-artz font-bold text-lg text-[#01406D]">No products found</h3>
                  <p className="font-inter text-sm text-[#6B8FA3] mt-0.5">Try adjusting your filters</p>
                </div>
              </div>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p._id} className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden hover:shadow-sm transition-shadow duration-150 group">
                <div className="h-36 bg-[#F5FEFE] flex items-center justify-center overflow-hidden relative">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Eye size={28} className="text-[#6B8FA3]" />
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-inter font-bold ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-500'}`}>
                    {p.status === 'pending_review' ? 'Review' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-inter text-xs font-medium text-[#01406D] truncate">{p.name}</p>
                  <p className="font-inter text-[10px] text-[#6B8FA3] mt-0.5">{p.category}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E0EFEF]">
                    <span className="font-artz font-bold text-sm text-[#01B4BA]">₹{p.price}</span>
                    <div className="flex gap-1">
                      {(p.status === 'pending_review' || p.status === 'rejected') && (
                        <button onClick={() => updateStatus(p._id, 'live')} className="p-1.5 rounded-[4px] hover:bg-emerald-50 text-emerald-600 transition-colors" title="Approve">
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {p.status === 'live' && (
                        <button onClick={() => updateStatus(p._id, 'rejected')} className="p-1.5 rounded-[4px] hover:bg-red-50 text-red-600 transition-colors" title="Reject">
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'grid' && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <span className="text-xs font-inter text-[#6B8FA3]">Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-[6px] hover:bg-[#F5FEFE] disabled:opacity-30 min-h-[32px]">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-[6px] text-xs font-inter font-bold transition-colors ${page === p ? 'bg-[#01B4BA] text-white' : 'bg-[#F5FEFE] text-[#6B8FA3] hover:bg-[#E0EFEF]'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-[6px] hover:bg-[#F5FEFE] disabled:opacity-30 min-h-[32px]">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
