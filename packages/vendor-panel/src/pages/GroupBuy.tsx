import React, { useEffect, useState } from 'react';
import { Plus, X, Users, Clock, Target, Percent, RefreshCw, Play, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Product {
  _id: string;
  name: string;
  price: number;
  groupPrice: number;
  targetCount: number;
  image: string;
  stock: number;
}

interface GroupSession {
  _id: string;
  productId: string;
  hostUserId: string;
  targetCount: number;
  currentCount: number;
  shareCode: string;
  shareUrl: string;
  status: string;
  startedAt: string;
  endsAt: string;
  completedAt?: string;
  appliedPrice?: number;
}

const GroupBuy: React.FC = () => {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formProduct, setFormProduct] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formDuration, setFormDuration] = useState('48');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, productsRes] = await Promise.all([
        api.get('/vendor/groups'),
        api.get('/products?vendor=all'),
      ]);
      setSessions(groupsRes.data.data);
      setProducts(productsRes.data.data || []);
    } catch {
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (formProduct) {
      const p = products.find((x) => x._id === formProduct);
      if (p) {
        setFormPrice(String(p.groupPrice));
        setFormTarget(String(p.targetCount));
      }
    }
  }, [formProduct, products]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct) { toast.error('Select a product'); return; }
    setCreating(true);
    try {
      await api.post('/vendor/groups', {
        productId: formProduct,
        groupPrice: parseFloat(formPrice),
        targetCount: parseInt(formTarget),
        durationHours: parseInt(formDuration),
      });
      toast.success('Group deal created! Share the link with customers.');
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create group deal');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/vendor/groups/${id}/cancel`);
      toast.success('Group session cancelled');
      fetchData();
    } catch {
      toast.error('Failed to cancel session');
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const pastSessions = sessions.filter((s) => s.status !== 'active');

  const getProductName = (pid: string) => products.find((p) => p._id === pid)?.name || pid.slice(-8);

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Group Buy</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Close' : 'New Group Deal'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <h2 className="font-artz font-bold text-navy mb-4">Create Group Deal</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Product</label>
              <select
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                <option value="">Select product</option>
                {products.filter((p) => p.stock > 0).map((p) => (
                  <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Group Price (₹)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Buyers</label>
              <input
                type="number"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
                min={2}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration (hours)</label>
              <input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
                min={2}
                max={168}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 bg-teal text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60"
              >
                <Play size={16} />
                {creating ? 'Creating...' : 'Launch Group Deal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-artz font-bold text-navy text-lg">Active Deals</h2>
            <span className="text-xs bg-teal/10 text-teal px-2.5 py-0.5 rounded-full font-semibold">{activeSessions.length}</span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center mb-8">
              <Users size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">No active group deals. Create one to start selling in bulk!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {activeSessions.map((s) => {
                const progress = s.targetCount > 0 ? (s.currentCount / s.targetCount) * 100 : 0;
                const productName = getProductName(s.productId);
                return (
                  <div key={s._id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-slate-800 truncate">{productName}</h3>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full">Active</span>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Target size={14} /> {s.currentCount}/{s.targetCount}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {getTimeRemaining(s.endsAt)}</span>
                      {s.appliedPrice && <span className="flex items-center gap-1"><Percent size={14} /> ₹{s.appliedPrice}</span>}
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                      <div className="bg-teal h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500 font-mono">
                        {s.shareCode || 'No code'}
                      </code>
                      <button
                        onClick={() => handleCancel(s._id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <StopCircle size={14} /> End Deal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pastSessions.length > 0 && (
            <>
              <h2 className="font-artz font-bold text-navy text-lg mb-4">Past Deals</h2>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Progress</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map((s) => (
                      <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{getProductName(s.productId)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.currentCount}/{s.targetCount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            s.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            s.status === 'expired' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>{s.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(s.endsAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GroupBuy;
