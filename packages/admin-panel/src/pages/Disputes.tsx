import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import api from '../api/client';

interface Dispute {
  _id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  detail?: string;
  status: string;
  messages: Array<{ _id: string; userId: string; userRole: string; message: string; createdAt: string }>;
  createdAt: string;
}

const Disputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');

  const load = async () => {
    try { const res = await api.get('/disputes'); setDisputes(res.data.data || []); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected) return;
    try {
      await api.post(`/disputes/${selected}/messages`, { message: newMsg });
      setNewMsg('');
      load();
    } catch { /* ignore */ }
  };

  const resolve = async (id: string, status: string) => {
    try {
      await api.patch(`/disputes/${id}/resolve`, { status, resolution: 'Resolved by admin' });
      load();
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-main" /></div>;

  const active = disputes.find((d) => d._id === selected);

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      <div className="w-1/3 border border-slate-100 rounded-2xl overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-poppins font-bold text-sm text-slate-800">Disputes ({disputes.length})</h2>
        </div>
        {disputes.map((d) => (
          <button key={d._id} onClick={() => setSelected(d._id)}
            className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected === d._id ? 'bg-primary-main/5' : ''}`}
          >
            <p className="font-inter text-sm text-slate-700 font-medium">Order #{d.orderId.slice(-8)}</p>
            <p className="font-inter text-xs text-slate-500 mt-0.5">{d.reason}</p>
            <span className={`text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
              d.status === 'open' ? 'bg-rose-100 text-rose-700' :
              d.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>{d.status}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 border border-slate-100 rounded-2xl flex flex-col">
        {active ? (
          <>
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-poppins font-bold text-sm text-slate-800">Order #{active.orderId.slice(-8)}</h3>
              <p className="font-inter text-xs text-slate-500">{active.detail || active.reason}</p>
              {active.status === 'open' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => resolve(active._id, 'resolved_buyer')} className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold">Resolve for Buyer</button>
                  <button onClick={() => resolve(active._id, 'resolved_vendor')} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg font-bold">Resolve for Vendor</button>
                  <button onClick={() => resolve(active._id, 'partial_refund')} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg font-bold">Partial Refund</button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {active.messages.map((m) => (
                <div key={m._id} className={`flex ${m.userRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-3 ${m.userRole === 'admin' ? 'bg-primary-main text-white' : 'bg-slate-50 text-slate-700'}`}>
                    <p className="font-inter text-sm">{m.message}</p>
                    <p className={`text-[10px] mt-1 ${m.userRole === 'admin' ? 'text-white/70' : 'text-slate-400'}`}>{m.userRole} · {new Date(m.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              />
              <button onClick={sendMessage} className="bg-primary-main text-white p-2.5 rounded-xl"><Send size={16} /></button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select a dispute</div>
        )}
      </div>
    </div>
  );
};

export default Disputes;
