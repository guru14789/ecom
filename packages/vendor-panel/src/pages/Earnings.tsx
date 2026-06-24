import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, Wallet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Transaction {
  id?: string;
  order_id?: string;
  amount: number;
  status: string;
  created_at?: string;
  released_at?: string;
  date?: string;
  releaseDate?: string;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'sale' | 'refund' | 'commission' | 'payout' | 'adjustment';
  amount: number;
  balance: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const typeLabels: Record<string, string> = {
  sale: 'Sale',
  refund: 'Refund',
  commission: 'Commission',
  payout: 'Payout',
  adjustment: 'Adjustment',
};

const typeColors: Record<string, string> = {
  sale: 'bg-emerald-50 text-emerald-600',
  refund: 'bg-red-50 text-red-500',
  commission: 'bg-purple-50 text-purple-600',
  payout: 'bg-teal-50 text-teal',
  adjustment: 'bg-amber-50 text-amber-600',
};

const Earnings: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [totals, setTotals] = useState({ totalEarnings: 0, inEscrow: 0, payouts30d: 0 });
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledgerPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txnRes, dashRes] = await Promise.all([
          api.get('/vendor/payouts'),
          api.get('/vendor/dashboard').catch(() => null),
        ]);
        setTransactions(txnRes.data.data || []);
        if (dashRes?.data?.data?.stats) {
          setTotals({
            totalEarnings: dashRes.data.data.stats.totalEarnings || 0,
            inEscrow: dashRes.data.data.stats.pendingPayouts || 0,
            payouts30d: (txnRes.data.data || [])
              .filter((t: Transaction) => t.status === 'paid' || t.status === 'released')
              .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0),
          });
        }
      } catch {
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadStatement = async (t: Transaction) => {
    setDownloading(t.id || 'download');
    try {
      const res = await api.get(`/vendor/payouts/${t.id}/invoice`, {
        params: { amount: t.amount, status: t.status },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Failed to download payout statement');
    } finally {
      setDownloading(null);
    }
  };

  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    let balance = 0;
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.released_at || a.created_at || 0).getTime();
      const dateB = new Date(b.released_at || b.created_at || 0).getTime();
      return dateA - dateB;
    });
    return sorted.map((t, i) => {
      let type: LedgerEntry['type'] = 'payout';
      if (t.status === 'held') type = 'sale';
      else if (t.status === 'refunded') type = 'refund';
      else if (t.status === 'released' || t.status === 'paid') type = 'payout';

      const amount = t.amount || 0;
      balance += amount;

      return {
        id: t.id || t.order_id || `txn-${i}`,
        date: t.released_at || t.created_at || new Date().toISOString(),
        description: type === 'payout'
          ? `Payout released — Order #${(t.order_id || '').slice(-8)}`
          : type === 'sale'
            ? `Sale held in escrow — Order #${(t.order_id || '').slice(-8)}`
            : type === 'refund'
              ? `Refund processed — Order #${(t.order_id || '').slice(-8)}`
              : `Transaction — Order #${(t.order_id || '').slice(-8)}`,
        type,
        amount,
        balance,
      };
    }).reverse();
  }, [transactions]);

  const totalLedgerPages = Math.max(1, Math.ceil(ledgerEntries.length / ledgerPerPage));
  const paginatedLedger = ledgerEntries.slice(
    (ledgerPage - 1) * ledgerPerPage,
    ledgerPage * ledgerPerPage
  );

  const chartData = [
    { name: 'Week 1', earnings: totals.payouts30d * 0.2 },
    { name: 'Week 2', earnings: totals.payouts30d * 0.3 },
    { name: 'Week 3', earnings: totals.payouts30d * 0.25 },
    { name: 'Week 4', earnings: totals.payouts30d * 0.25 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-artz font-bold text-navy mb-6">Earnings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><DollarSign size={18} className="text-emerald-600" /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totals.totalEarnings.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Clock size={18} className="text-amber-600" /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase">In Escrow</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totals.inEscrow.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-teal" /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Payouts (30d)</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totals.payouts30d.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-artz font-bold text-navy mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-teal" /> Earnings Overview
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="earnings" fill="#01B4BA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-artz font-bold text-navy mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-teal" /> Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <span className="text-sm text-slate-600">Total Paid Out</span>
              <span className="font-bold text-emerald-700">₹{(totals.totalEarnings - totals.inEscrow).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <span className="text-sm text-slate-600">Pending Clearance</span>
              <span className="font-bold text-amber-700">₹{totals.inEscrow.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl">
              <span className="text-sm text-slate-600">This Month</span>
              <span className="font-bold text-teal">₹{totals.payouts30d.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Transaction Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Statement</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No transactions yet</p>
                  </td>
                </tr>
              ) : (
                paginatedLedger.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                  >
                    <td className="px-5 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{entry.description}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeColors[entry.type] || 'bg-slate-100 text-slate-500'}`}>
                        {typeLabels[entry.type] || entry.type}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-sm font-semibold text-right ${entry.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {entry.amount >= 0 ? '+' : ''}₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-800 text-right">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDownloadStatement(transactions.find(
                          t => (t.id || t.order_id) === entry.id
                        ) || transactions.find(
                          t => t.id === entry.id
                        ) || { id: entry.id, amount: entry.amount, status: entry.type === 'payout' ? 'paid' : 'released' })}
                        disabled={downloading === entry.id}
                        className="p-2 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Download Statement"
                      >
                        {downloading === entry.id ? (
                          <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          <FileText size={15} className="text-teal" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalLedgerPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Showing {(ledgerPage - 1) * ledgerPerPage + 1}–{Math.min(ledgerPage * ledgerPerPage, ledgerEntries.length)} of {ledgerEntries.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={ledgerPage <= 1}
                onClick={() => setLedgerPage(ledgerPage - 1)}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalLedgerPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setLedgerPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    ledgerPage === p
                      ? 'bg-teal text-white'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={ledgerPage >= totalLedgerPages}
                onClick={() => setLedgerPage(ledgerPage + 1)}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
