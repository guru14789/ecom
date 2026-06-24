import React, { useEffect, useState } from 'react';
import {
  Package, Search, AlertTriangle, Edit3, Trash2, X,
  Save, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface InventoryItem {
  _id: string;
  name: string;
  image?: string;
  sku?: string;
  stock: number;
  lowStockThreshold?: number;
  price: number;
  category: string;
  variants?: Array<{ label: string; stock: number; sku?: string }>;
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [bulkStockValue, setBulkStockValue] = useState<number | ''>('');
  const [updating, setUpdating] = useState(false);
  const perPage = 12;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/vendor/products?limit=200');
        setItems(res.data.data || []);
      } catch {
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((i) => i._id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selected.size === 0 || bulkStockValue === '') return;
    setUpdating(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          api.put(`/vendor/products/${id}`, { stock: Number(bulkStockValue) })
        )
      );
      toast.success(`Updated stock for ${selected.size} product(s)`);
      setSelected(new Set());
      setBulkStockValue('');
      const res = await api.get('/vendor/products?limit=200');
      setItems(res.data.data || []);
    } catch {
      toast.error('Bulk update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickEdit = async (id: string, newStock: number) => {
    try {
      await api.put(`/vendor/products/${id}`, { stock: newStock });
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, stock: newStock } : i)));
      toast.success('Stock updated');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const getStockStatus = (item: InventoryItem): 'normal' | 'low' | 'out' => {
    if (item.stock === 0) return 'out';
    if (item.lowStockThreshold && item.stock <= item.lowStockThreshold) return 'low';
    if (item.stock <= 5) return 'low';
    return 'normal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#01B4BA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-[#01406D]">Inventory</h1>
        <button
          onClick={() => { window.location.href = '/bulk-stock'; }}
          className="flex items-center gap-2 bg-white border border-[#01406D] text-[#01406D] px-5 py-2.5 rounded-[6px] text-sm font-inter font-bold min-h-[44px] hover:bg-[#F5FEFE] transition-colors duration-150"
        >
          <RefreshCw size={15} /> Bulk Update
        </button>
      </div>

      {/* Search + Summary */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8FA3]" size={15} />
          <input
            type="text" placeholder="Search by name or SKU..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E0EFEF] rounded-xl text-xs font-inter outline-none focus:border-[#01B4BA] transition-colors"
          />
        </div>
        <div className="flex gap-3 text-xs font-inter text-[#6B8FA3]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {items.filter((i) => getStockStatus(i) === 'normal').length} In Stock</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF7A0F]" /> {items.filter((i) => getStockStatus(i) === 'low').length} Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {items.filter((i) => getStockStatus(i) === 'out').length} Out</span>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="bg-[#F5FEFE] border border-[#01B4BA] rounded-xl px-5 py-3 mb-5 flex items-center justify-between animate-fade-in-up">
          <span className="text-sm font-inter font-medium text-[#01406D]">
            {selected.size} product{selected.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <input
              type="number" min={0} placeholder="New stock value"
              value={bulkStockValue} onChange={(e) => setBulkStockValue(e.target.value ? parseInt(e.target.value) : '')}
              className="w-28 px-3 py-1.5 bg-white border border-[#01406D] rounded-lg text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30"
            />
            <button
              onClick={handleBulkUpdate}
              disabled={bulkStockValue === '' || updating}
              className="flex items-center gap-1 px-4 py-1.5 bg-[#01B4BA] text-white rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-[#019aa0] transition-colors duration-150 disabled:opacity-50"
            >
              <Save size={13} /> Update Stock
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-white rounded-lg transition-colors">
              <X size={14} className="text-[#6B8FA3]" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selected.size === paginated.length}
                  onChange={toggleSelectAll}
                  className="rounded border-[#01406D] text-[#01B4BA] focus:ring-[#01B4BA]/30"
                />
              </th>
              <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Product</th>
              <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">SKU</th>
              <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Stock</th>
              <th className="text-left px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Status</th>
              <th className="text-right px-3 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-[#6B8FA3]">
                  <Package size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-inter">No products found</p>
                </td>
              </tr>
            ) : (
              paginated.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr
                    key={item._id}
                    className={`border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors ${
                      status === 'out' ? 'border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(item._id)}
                        onChange={() => toggleSelect(item._id)}
                        className="rounded border-[#01406D] text-[#01B4BA] focus:ring-[#01B4BA]/30"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://via.placeholder.com/40'}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-[#F5FEFE]"
                        />
                        <div>
                          <span className="text-sm font-inter font-medium text-[#01406D] block">{item.name}</span>
                          <span className="text-[10px] font-inter text-[#6B8FA3]">{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 font-inter text-xs text-[#6B8FA3] font-mono">{item.sku || '—'}</td>
                    <td className="px-3 py-4">
                      <span className={`font-inter text-sm font-bold ${
                        status === 'out' ? 'text-red-500' : status === 'low' ? 'text-[#FF7A0F]' : 'text-[#01406D]'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {status === 'low' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-inter font-bold bg-[#FF7A0F]/10 text-[#FF7A0F] border border-[#FF7A0F]/20">
                          <AlertTriangle size={10} /> Low Stock
                        </span>
                      )}
                      {status === 'out' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-inter font-bold bg-red-50 text-red-600 border border-red-200">
                          <AlertTriangle size={10} /> Out of Stock
                        </span>
                      )}
                      {status === 'normal' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-inter font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => {
                          const val = window.prompt('Enter new stock value:', String(item.stock));
                          if (val !== null && !isNaN(Number(val)) && Number(val) >= 0) {
                            handleQuickEdit(item._id, Number(val));
                          }
                        }}
                        className="p-2 hover:bg-[#F5FEFE] rounded-lg transition-colors"
                        title="Edit Stock"
                      >
                        <Edit3 size={14} className="text-[#6B8FA3]" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E0EFEF]">
            <span className="text-xs font-inter text-[#6B8FA3]">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 hover:bg-[#F5FEFE] rounded-lg disabled:opacity-30 transition-opacity"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-inter font-bold transition-colors ${
                    page === p ? 'bg-[#01B4BA] text-white' : 'bg-[#F5FEFE] text-[#6B8FA3] hover:bg-[#E0EFEF]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 hover:bg-[#F5FEFE] rounded-lg disabled:opacity-30 transition-opacity"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
