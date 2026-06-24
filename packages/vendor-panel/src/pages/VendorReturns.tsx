import React, { useState, useEffect } from 'react';
import { Loader2, Check, X, Eye } from 'lucide-react';
import api from '../api/client';

interface ReturnItem {
  _id: string;
  orderId: string;
  productId: string;
  quantity: number;
  reason: string;
  detail?: string;
  images: string[];
  status: string;
  refundAmount: number;
  createdAt: string;
}

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'pickup_scheduled', 'item_received', 'refunded'];

const VendorReturns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/vendor/returns', { params });
      setReturns(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/vendor/returns/${id}`, { status });
      load();
    } catch { /* ignore */ }
  };

  const processRefund = async (id: string) => {
    try {
      await api.post(`/vendor/returns/${id}/refund`, { refundReference: `REF-${id}-${Date.now()}` });
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-main" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-xl text-slate-800">Return Requests</h1>
        <div className="flex gap-1">
          {['', 'pending', 'approved', 'refunded'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs font-poppins font-bold px-3 py-1.5 rounded-xl transition-all ${filter === s ? 'bg-primary-main text-white' : 'bg-slate-100 text-slate-600'}`}
            >{s || 'All'}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {returns.map((r) => (
          <div key={r._id} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-inter text-sm text-slate-700">Order: <span className="font-mono">{r.orderId.slice(-8)}</span></p>
                <p className="font-inter text-xs text-slate-500 mt-1">Reason: {r.reason}</p>
                {r.detail && <p className="font-inter text-xs text-slate-400 mt-0.5">{r.detail}</p>}
                <p className="font-inter text-xs text-slate-400 mt-1">Refund: ₹{r.refundAmount.toLocaleString('en-IN')} · Qty: {r.quantity}</p>
              </div>
              <span className={`text-xs font-poppins font-bold px-2 py-1 rounded-full ${
                r.status === 'refunded' ? 'bg-emerald-100 text-emerald-700' :
                r.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                r.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>{r.status}</span>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => updateStatus(r._id, 'approved')} className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-poppins font-bold px-3 py-1.5 rounded-xl"><Check size={12} /> Approve</button>
                <button onClick={() => updateStatus(r._id, 'rejected')} className="flex items-center gap-1 bg-rose-500 text-white text-xs font-poppins font-bold px-3 py-1.5 rounded-xl"><X size={12} /> Reject</button>
              </div>
            )}
            {r.status === 'item_received' && (
              <button onClick={() => processRefund(r._id)} className="mt-3 bg-primary-main text-white text-xs font-poppins font-bold px-3 py-1.5 rounded-xl">Process Refund</button>
            )}
          </div>
        ))}
        {returns.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No return requests</p>}
      </div>
    </div>
  );
};

export default VendorReturns;
