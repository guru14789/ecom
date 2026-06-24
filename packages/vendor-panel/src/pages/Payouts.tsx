import React, { useEffect, useState } from 'react';
import {
  DollarSign, Wallet, TrendingUp, FileText, Download,
  ChevronLeft, ChevronRight, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Transaction {
  id?: string;
  order_id?: string;
  amount: number;
  status: string;
  created_at?: string;
  released_at?: string;
}

interface PayoutSummary {
  grossSales: number;
  commission: number;
  pgFee: number;
  returns: number;
  netPayout: number;
}

const Payouts: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const perPage = 10;

  useEffect(() => {
    const fetch = async () => {
      try {
        const params: any = {};
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;
        const res = await api.get('/vendor/payouts', { params });
        setTransactions(res.data.data || []);
      } catch {
        toast.error('Failed to load payouts');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [dateFrom, dateTo]);

  // Compute earnings breakdown from transactions
  const summary: PayoutSummary = transactions.reduce(
    (acc, t) => {
      if (t.status === 'held' || t.status === 'released' || t.status === 'paid') {
        acc.grossSales += t.amount;
        acc.commission += t.amount * 0.12;
        acc.pgFee += t.amount * 0.02;
        acc.netPayout += t.amount * 0.86;
      }
      if (t.status === 'refunded') {
        acc.returns += Math.abs(t.amount);
        acc.netPayout -= Math.abs(t.amount);
      }
      return acc;
    },
    { grossSales: 0, commission: 0, pgFee: 0, returns: 0, netPayout: 0 }
  );

  const totalPages = Math.max(1, Math.ceil(transactions.length / perPage));
  const paginated = transactions.slice((page - 1) * perPage, page * perPage);

  const handleDownloadStatement = async (t: Transaction) => {
    const id = t.id || 'download';
    setDownloading(id);
    try {
      const res = await api.get(`/vendor/payouts/${t.id}/invoice`, {
        params: { amount: t.amount, status: t.status },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('Failed to download statement');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadSummary = () => {
    const csv = [
      'Metric,Value',
      `Gross Sales,${summary.grossSales}`,
      `Commission,${summary.commission}`,
      `PG Fee,${summary.pgFee}`,
      `Returns,${summary.returns}`,
      `Net Payout,${summary.netPayout}`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-summary-${dateFrom || 'all'}-${dateTo || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded');
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
      <h1 className="text-2xl font-artz font-bold text-[#01406D] mb-6">Payouts</h1>

      {/* Settlement Period Selector */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-artz font-bold text-[#01406D] text-sm flex items-center gap-2">
            <Calendar size={15} className="text-[#01B4BA]" /> Settlement Period
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-[#01406D] rounded-[6px] text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 min-h-[44px]"
            />
            <span className="text-xs text-[#6B8FA3]">to</span>
            <input
              type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-[#01406D] rounded-[6px] text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 min-h-[44px]"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="px-3 py-2 text-xs font-inter font-bold text-[#FF7A0F] hover:bg-[#FFF7ED] rounded-[6px] min-h-[44px] transition-colors duration-150"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E0EFEF]">
            <h3 className="font-artz font-bold text-[#01406D] text-sm">Earnings Breakdown</h3>
          </div>
          <div className="divide-y divide-[#E0EFEF]">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-inter text-sm text-[#01406D]">Gross Sales</span>
              <span className="font-inter text-sm font-bold text-[#01406D]">₹{summary.grossSales.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-inter text-sm text-[#01406D]">Commission (12%)</span>
              <span className="font-inter text-sm font-bold text-[#FF7A0F]">-₹{Math.round(summary.commission).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-inter text-sm text-[#01406D]">PG Fee (2%)</span>
              <span className="font-inter text-sm font-bold text-[#FF7A0F]">-₹{Math.round(summary.pgFee).toLocaleString('en-IN')}</span>
            </div>
            {summary.returns > 0 && (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="font-inter text-sm text-[#01406D]">Returns</span>
                <span className="font-inter text-sm font-bold text-red-500">-₹{Math.round(summary.returns).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-4 bg-[#F5FEFE]">
              <span className="font-inter text-sm font-bold text-[#01406D]">Net Payout</span>
              <span className="font-inter text-lg font-bold text-[#01B4BA]">₹{Math.round(summary.netPayout).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-[#E0EFEF]">
            <button
              onClick={handleDownloadSummary}
              className="flex items-center gap-1.5 text-[#01B4BA] font-inter font-bold text-xs hover:underline"
            >
              <Download size={13} /> Download Summary CSV
            </button>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="bg-white border border-[#E0EFEF] rounded-2xl p-5 space-y-4">
          <h3 className="font-artz font-bold text-[#01406D] text-sm flex items-center gap-2">
            <TrendingUp size={15} className="text-[#01B4BA]" /> Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <span className="text-xs font-inter text-[#01406D]">Total Paid Out</span>
              <span className="font-inter font-bold text-emerald-700 text-sm">
                ₹{Math.round(summary.netPayout * 0.7).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5FEFE] rounded-xl">
              <span className="text-xs font-inter text-[#01406D]">Pending Clearance</span>
              <span className="font-inter font-bold text-[#01B4BA] text-sm">
                ₹{Math.round(summary.netPayout * 0.3).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#FFF7ED] rounded-xl">
              <span className="text-xs font-inter text-[#01406D]">Transactions</span>
              <span className="font-inter font-bold text-[#FF7A0F] text-sm">{transactions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E0EFEF] flex items-center justify-between">
          <h3 className="font-artz font-bold text-[#01406D] text-sm">Transaction History</h3>
          <span className="text-xs font-inter text-[#6B8FA3]">{transactions.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Statement</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#6B8FA3]">
                    <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-inter">No payouts yet</p>
                  </td>
                </tr>
              ) : (
                paginated.map((t, i) => (
                  <tr key={t.id || t.order_id || i} className="border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-inter text-xs text-[#6B8FA3]">
                      {new Date(t.released_at || t.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 font-inter text-xs font-mono text-[#01406D]">
                      #{t.order_id ? t.order_id.slice(-8) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-inter font-bold ${
                        t.status === 'paid' || t.status === 'released' ? 'bg-emerald-50 text-emerald-700' :
                        t.status === 'held' ? 'bg-[#F5FEFE] text-[#01B4BA]' :
                        t.status === 'refunded' ? 'bg-red-50 text-red-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {t.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-inter text-sm font-bold text-[#01406D]">
                      +₹{(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDownloadStatement(t)}
                        disabled={downloading === (t.id || 'download')}
                        className="p-2 hover:bg-[#F5FEFE] rounded-lg transition-colors disabled:opacity-40"
                        title="Download Statement"
                      >
                        {downloading === (t.id || 'download') ? (
                          <div className="w-4 h-4 border-2 border-[#01B4BA] border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          <FileText size={15} className="text-[#01B4BA]" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E0EFEF]">
            <span className="text-xs font-inter text-[#6B8FA3]">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, transactions.length)} of {transactions.length}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 hover:bg-[#F5FEFE] rounded-lg disabled:opacity-30"
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
                className="p-1.5 hover:bg-[#F5FEFE] rounded-lg disabled:opacity-30"
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

export default Payouts;
