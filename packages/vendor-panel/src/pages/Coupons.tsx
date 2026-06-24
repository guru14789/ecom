import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Tag, Calendar, Check } from 'lucide-react';
import api from '../api/client';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minCartValue: number;
  maxDiscount?: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
}

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discountType: 'percent' as 'percent' | 'flat', discountValue: 0,
    minCartValue: 0, maxDiscount: 0, maxUses: 100, validFrom: '', validUntil: '', description: '',
  });

  const load = async () => {
    try {
      const res = await api.get('/vendor/coupons');
      setCoupons(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.post('/vendor/coupons', { ...form, validFrom: new Date(form.validFrom).toISOString(), validUntil: new Date(form.validUntil).toISOString() });
      setShowForm(false);
      setForm({ code: '', discountType: 'percent', discountValue: 0, minCartValue: 0, maxDiscount: 0, maxUses: 100, validFrom: '', validUntil: '', description: '' });
      load();
    } catch { /* ignore */ }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/vendor/coupons/${id}`);
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-main" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-xl text-slate-800">Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-primary-main text-white font-poppins font-bold text-xs px-4 py-2.5 rounded-xl">
          <Plus size={14} /> Create Coupon
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-100 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-inter text-xs text-slate-500">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="percent">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Value</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: +e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Min Cart Value</label>
              <input type="number" value={form.minCartValue} onChange={(e) => setForm({ ...form, minCartValue: +e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Max Discount</label>
              <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: +e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Max Uses</label>
              <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: +e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Valid From</label>
              <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="font-inter text-xs text-slate-500">Valid Until</label>
              <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full mt-3 border border-slate-200 rounded-xl px-3 py-2 text-sm" rows={2} />
          <div className="flex gap-2 mt-3">
            <button onClick={create} className="bg-primary-main text-white font-poppins font-bold text-xs px-4 py-2 rounded-xl">Save</button>
            <button onClick={() => setShowForm(false)} className="border border-slate-200 text-slate-600 font-poppins font-bold text-xs px-4 py-2 rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {coupons.map((c) => (
          <div key={c._id} className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-main/10 flex items-center justify-center"><Tag size={18} className="text-primary-main" /></div>
              <div>
                <p className="font-poppins font-bold text-sm text-slate-800">{c.code}</p>
                <p className="font-inter text-xs text-slate-400">{c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`} off · Min ₹{c.minCartValue} · Used {c.currentUses}/{c.maxUses}</p>
                <p className="font-inter text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Calendar size={10} /> Until {new Date(c.validUntil).toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={() => remove(c._id)} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500"><X size={14} /></button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-center font-inter text-sm text-slate-400 py-8">No coupons created yet</p>}
      </div>
    </div>
  );
};

export default Coupons;
