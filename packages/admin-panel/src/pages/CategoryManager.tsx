import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Percent, Tag, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Category {
  _id: string;
  key: string;
  label: string;
  image?: string;
  subcategories?: string[];
  featured?: boolean;
  order?: number;
  isActive?: boolean;
  // Extended fields
  gstRate?: number;
  commissionRate?: number;
  requiredSpecs?: string[];
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key: '', label: '', image: '', subcategories: '', gstRate: '18', commissionRate: '8', requiredSpecs: '',
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.data || []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ key: '', label: '', image: '', subcategories: '', gstRate: '18', commissionRate: '8', requiredSpecs: '' });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      key: cat.key,
      label: cat.label,
      image: cat.image || '',
      subcategories: (cat.subcategories || []).join(', '),
      gstRate: String((cat as any).gstRate || 18),
      commissionRate: String((cat as any).commissionRate || 8),
      requiredSpecs: ((cat as any).requiredSpecs || []).join(', '),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key || !form.label) { toast.error('Key and label required'); return; }
    setSaving(true);
    try {
      const payload = {
        key: form.key,
        label: form.label,
        image: form.image || undefined,
        subcategories: form.subcategories.split(',').map((s: string) => s.trim()).filter(Boolean),
        gstRate: parseFloat(form.gstRate),
        commissionRate: parseFloat(form.commissionRate),
        requiredSpecs: form.requiredSpecs.split(',').map((s: string) => s.trim()).filter(Boolean),
        isActive: true,
      };

      if (editing) {
        await api.put(`/admin/categories/${editing._id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created');
      }
      setShowForm(false);
      setEditing(null);
      fetchCategories();
    } catch (err: any) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = categories.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Category Management</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-artz font-bold text-navy">{editing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 hover:bg-slate-100 rounded-xl"><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Key *</label>
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="electronics" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Label *</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="Electronics" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">GST Rate (%)</label>
              <div className="relative">
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Commission Rate (%)</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Image URL</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Subcategories (comma separated)</label>
              <input value={form.subcategories} onChange={(e) => setForm({ ...form, subcategories: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="Mobiles, Laptops, Tablets" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Required Spec Fields (comma separated)</label>
              <input value={form.requiredSpecs} onChange={(e) => setForm({ ...form, requiredSpecs: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="RAM, Storage, Processor, Battery" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl text-sm font-semibold bg-teal text-white hover:opacity-90 disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No categories found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">GST</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Subcategories</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.image && <img src={c.image} alt={c.label} className="w-8 h-8 rounded-lg object-cover bg-slate-50" />}
                      <div>
                        <span className="text-sm font-medium text-slate-800">{c.label}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{c.key}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{(c as any).gstRate || 18}%</td>
                  <td className="px-4 py-3 text-sm font-semibold text-teal">{(c as any).commissionRate || 8}%</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{(c.subcategories || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 size={14} className="text-slate-400" /></button>
                      <button onClick={() => handleDelete(c._id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
