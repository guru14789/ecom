import React, { useEffect, useState } from 'react';
import { Package, Truck, Search, Plus, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Shipment {
  id?: string;
  shipment_id?: string;
  order_id?: string;
  order: string;
  courier: string;
  waybill: string;
  status: string;
  date?: string;
  created_at?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  in_transit: 'bg-teal-50 text-teal',
  delivered: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-red-50 text-red-500',
};

const Shipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ orderId: '', courier: 'Delhivery', waybill: '' });

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor/shipments');
      setShipments(res.data.data || []);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.waybill) {
      toast.error('Order ID and waybill are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/vendor/shipments', form);
      toast.success('Shipment created');
      setShowForm(false);
      setForm({ orderId: '', courier: 'Delhivery', waybill: '' });
      fetchShipments();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create shipment');
    } finally {
      setCreating(false);
    }
  };

  const filtered = shipments.filter((s) =>
    (s.order_id || s.order || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.waybill || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-slate-100 text-slate-500'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Shipments</h1>
        <div className="flex gap-2">
          <button onClick={fetchShipments} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} className="text-slate-500" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Close' : 'New Shipment'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <h2 className="font-artz font-bold text-navy mb-4">Create Shipment</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Order ID</label>
              <input
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
                placeholder="ORD..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Courier</label>
              <select
                value={form.courier}
                onChange={(e) => setForm({ ...form, courier: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                <option>Delhivery</option>
                <option>Blue Dart</option>
                <option>DTDC</option>
                <option>Ecom Express</option>
                <option>XpressBees</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Waybill Number</label>
              <input
                value={form.waybill}
                onChange={(e) => setForm({ ...form, waybill: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" disabled={creating} className="bg-teal text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60">
                {creating ? 'Creating...' : 'Create Shipment'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by order or waybill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No shipments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Shipment</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Courier</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Waybill</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id || s.shipment_id || i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-sm font-mono text-navy">{s.shipment_id || s.id || `SHP-${String(i + 1).padStart(3, '0')}`}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">#{s.order_id?.slice(-8) || s.order?.slice(-8) || 'N/A'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{s.courier || '-'}</td>
                  <td className="px-5 py-3 text-sm font-mono text-slate-500">{s.waybill || '-'}</td>
                  <td className="px-5 py-3">{getStatusBadge(s.status)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(s.date || s.created_at || Date.now()).toLocaleDateString('en-IN')}
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

export default Shipments;