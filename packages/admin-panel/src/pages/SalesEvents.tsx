import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Calendar, Search, CheckCircle, XCircle, Edit2, Save, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface SaleEvent {
  _id: string;
  title: string;
  description?: string;
  banner?: string;
  products: Array<{ productId: string; salePrice: number; quantity: number; sold: number }>;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface VendorOptIn {
  id: string;
  vendorName: string;
  storeName: string;
  status: 'pending' | 'approved' | 'rejected';
  productsCount: number;
}

interface SearchedProduct {
  _id: string;
  name: string;
  image?: string;
  price?: number;
}

const MOCK_VENDORS: VendorOptIn[] = [
  { id: 'v1', vendorName: 'Suresh Fashion', storeName: 'Suresh Fashion Store', status: 'approved', productsCount: 12 },
  { id: 'v2', vendorName: 'Anita Electronics', storeName: 'Anita Electronics Store', status: 'pending', productsCount: 5 },
  { id: 'v3', vendorName: 'Raj Home Decor', storeName: 'Raj Home Decor Store', status: 'rejected', productsCount: 8 },
];

const DEFAULT_FORM = { title: '', description: '', banner: '', startDate: '', endDate: '', minDiscountPercent: 0, featuredProductIds: [] as string[] };

const SalesEvents: React.FC = () => {
  const [events, setEvents] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [vendorOptIns, setVendorOptIns] = useState<Record<string, VendorOptIn[]>>({});
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    try { const res = await api.get('/flash-sales'); setEvents(res.data.data || []); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (events.length > 0) {
      const map: Record<string, VendorOptIn[]> = {};
      events.forEach(e => { map[e._id] = [...MOCK_VENDORS]; });
      setVendorOptIns(map);
    }
  }, [events]);

  useEffect(() => {
    if (productSearch.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/products/search', { params: { q: productSearch, limit: 10 } });
        setSearchResults(res.data.data || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const resetForm = () => {
    setForm({ ...DEFAULT_FORM, featuredProductIds: [] });
    setShowForm(false);
    setEditingId(null);
    setProductSearch('');
    setSearchResults([]);
  };

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.startDate || !form.endDate) { toast.error('Start and end dates are required'); return; }
    try {
      const body = {
        title: form.title,
        description: form.description,
        banner: form.banner,
        products: [],
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      if (editingId) {
        await api.put(`/flash-sales/${editingId}`, body);
        toast.success('Event updated');
      } else {
        await api.post('/flash-sales', body);
        toast.success('Event created');
      }
      resetForm();
      load();
    } catch { toast.error(editingId ? 'Failed to update event' : 'Failed to create event'); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/flash-sales/${id}`); toast.success('Event deleted'); load(); } catch { toast.error('Failed to delete event'); }
  };

  const edit = (e: SaleEvent) => {
    setForm({
      title: e.title,
      description: e.description || '',
      banner: e.banner || '',
      startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 16) : '',
      endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 16) : '',
      minDiscountPercent: 0,
      featuredProductIds: [],
    });
    setEditingId(e._id);
    setShowForm(true);
  };

  const updateVendorStatus = (eventId: string, vendorId: string, status: 'approved' | 'rejected') => {
    setVendorOptIns(prev => ({
      ...prev,
      [eventId]: (prev[eventId] || []).map(v => v.id === vendorId ? { ...v, status } : v),
    }));
    toast.success(`Vendor ${status}`);
  };

  const toggleFeaturedProduct = (productId: string) => {
    setForm(prev => ({
      ...prev,
      featuredProductIds: prev.featuredProductIds.includes(productId)
        ? prev.featuredProductIds.filter(id => id !== productId)
        : [...prev.featuredProductIds, productId],
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-main" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-xl text-slate-800">Sales Events</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-1 bg-primary-main text-white font-poppins font-bold text-xs px-4 py-2.5 rounded-xl">
          <Plus size={14} /> New Event
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-100 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="font-inter text-xs text-slate-500">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="font-inter text-xs text-slate-500">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="col-span-2">
            <label className="font-inter text-xs text-slate-500">Banner Image URL</label>
            <div className="flex items-center gap-2">
              <input value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} placeholder="https://..." className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <Image size={16} className="text-slate-400 shrink-0" />
            </div>
          </div>
          <div>
            <label className="font-inter text-xs text-slate-500">Start Date</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="font-inter text-xs text-slate-500">End Date</label>
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="font-inter text-xs text-slate-500">Min Discount (%)</label>
            <input type="number" min={0} max={100} value={form.minDiscountPercent} onChange={(e) => setForm({ ...form, minDiscountPercent: Math.min(100, Math.max(0, +e.target.value)) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="font-inter text-xs text-slate-500">Featured Products</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            {searching && <p className="text-xs text-slate-400 mb-2">Searching...</p>}
            {searchResults.length > 0 && (
              <div className="border border-slate-100 rounded-xl max-h-40 overflow-y-auto mb-2">
                {searchResults.map((p) => (
                  <button key={p._id} type="button" onClick={() => toggleFeaturedProduct(p._id)} className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${form.featuredProductIds.includes(p._id) ? 'bg-teal/5' : ''}`}>
                    {form.featuredProductIds.includes(p._id) ? <CheckCircle size={14} className="text-teal shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            {form.featuredProductIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.featuredProductIds.map(id => (
                  <span key={id} className="inline-flex items-center gap-1 bg-teal/10 text-teal text-xs px-2 py-1 rounded-full">
                    {id.slice(-6)}
                    <button type="button" onClick={() => toggleFeaturedProduct(id)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="col-span-2 flex gap-2">
            <button onClick={submit} className="bg-primary-main text-white font-poppins font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1">
              {editingId ? <><Save size={14} /> Update</> : <><Plus size={14} /> Create</>}
            </button>
            <button onClick={resetForm} className="border border-slate-200 text-slate-600 font-poppins font-bold text-xs px-4 py-2 rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.map((e) => {
          const optIns = vendorOptIns[e._id] || [];
          return (
            <div key={e._id} className="border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-poppins font-bold text-sm text-slate-800">{e.title}</p>
                  <p className="font-inter text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar size={10} /> {new Date(e.startDate).toLocaleDateString()} – {new Date(e.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-poppins font-bold px-2 py-1 rounded-full ${e.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {e.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => edit(e)} className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-500"><Edit2 size={14} /></button>
                  <button onClick={() => remove(e._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500"><X size={14} /></button>
                </div>
              </div>

              {e.banner && (
                <div className="mb-3">
                  <img src={e.banner} alt={e.title} className="w-full h-32 object-cover rounded-xl" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              {optIns.length > 0 && (
                <div className="border-t border-slate-50 pt-3 mt-2">
                  <p className="font-inter text-xs font-semibold text-slate-500 mb-2">Vendor Opt-Ins</p>
                  <div className="space-y-1.5">
                    {optIns.map((v) => (
                      <div key={v.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{v.vendorName}</p>
                          <p className="text-[11px] text-slate-400">{v.storeName} · {v.productsCount} products</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            v.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            v.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {v.status}
                          </span>
                          {v.status === 'pending' && (
                            <>
                              <button onClick={() => updateVendorStatus(e._id, v.id, 'approved')} className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600"><CheckCircle size={12} /></button>
                              <button onClick={() => updateVendorStatus(e._id, v.id, 'rejected')} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"><XCircle size={12} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No sales events created</p>}
      </div>
    </div>
  );
};

export default SalesEvents;
