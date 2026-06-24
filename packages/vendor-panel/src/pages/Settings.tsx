import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Store, User, Mail, Phone, FileText, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useAppDispatch } from '../store';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    gstin: '',
  });

  useEffect(() => {
    api.get('/vendor/settings')
      .then((res) => {
        const d = res.data.data;
        setForm({
          storeName: d.storeName || '',
          ownerName: d.ownerName || '',
          email: d.email || '',
          phone: d.phone || '',
          gstin: d.gstin || '',
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/vendor/settings', form);
      dispatch({ type: 'SET_VENDOR_USER', payload: { id: '', name: form.ownerName, email: form.email, storeName: form.storeName } });
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-artz font-bold text-navy mb-6">Settings</h1>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Store Name</label>
            <div className="relative">
              <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Owner Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">GSTIN</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;