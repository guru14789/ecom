import React, { useState } from 'react';
import {
  Percent, Download, DollarSign, TrendingUp, Wallet,
  ArrowUpRight, ArrowDownRight, Calendar, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface CategoryCommission {
  category: string;
  commissionRate: number;
  gstRate: number;
}

const DEFAULT_CATEGORIES: CategoryCommission[] = [
  { category: 'fashion', commissionRate: 15, gstRate: 5 },
  { category: 'electronics', commissionRate: 8, gstRate: 18 },
  { category: 'beauty', commissionRate: 12, gstRate: 18 },
  { category: 'home', commissionRate: 10, gstRate: 12 },
  { category: 'food', commissionRate: 5, gstRate: 5 },
  { category: 'books', commissionRate: 5, gstRate: 0 },
  { category: 'sports', commissionRate: 10, gstRate: 12 },
  { category: 'toys', commissionRate: 12, gstRate: 18 },
  { category: 'furniture', commissionRate: 8, gstRate: 18 },
  { category: 'mobiles', commissionRate: 6, gstRate: 18 },
];

const Finance: React.FC = () => {
  const [categories, setCategories] = useState<CategoryCommission[]>(() => {
    const saved = localStorage.getItem('admin_commission_config');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [saved, setSaved] = useState(false);
  const [payoutFrom, setPayoutFrom] = useState('');
  const [payoutTo, setPayoutTo] = useState('');
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);

  const update = (idx: number, field: keyof CategoryCommission, value: number) => {
    const next = [...categories];
    next[idx] = { ...next[idx], [field]: value };
    setCategories(next);
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem('admin_commission_config', JSON.stringify(categories));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreviewPayout = () => {
    if (!payoutFrom || !payoutTo) { toast.error('Select date range'); return; }
    const days = Math.ceil((new Date(payoutTo).getTime() - new Date(payoutFrom).getTime()) / (1000 * 60 * 60 * 24));
    const estimated = Math.round(days * 12500 + Math.random() * 50000);
    setPreviewAmount(estimated);
  };

  const handleInitiatePayout = () => {
    if (!previewAmount) return;
    toast.success(`Payout of ₹${previewAmount.toLocaleString('en-IN')} initiated`);
    setPreviewAmount(null);
    setPayoutFrom('');
    setPayoutTo('');
  };

  // P&L mock data
  const pnl = {
    gmv: 2845000,
    netGmv: 2560500,
    commission: 341250,
    costs: 89500,
    netRevenue: 251750,
  };

  return (
    <div className="space-y-6 animate-[fadeIn_150ms_ease]">
      <h1 className="text-2xl font-artz font-bold text-[#01406D]">Finance Panel</h1>

      {/* P&L Summary Card */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E0EFEF]">
          <h2 className="font-artz font-bold text-[#01406D] text-base flex items-center gap-2">
            <DollarSign size={16} className="text-[#01B4BA]" /> P&amp;L Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-[#E0EFEF]">
          <div className="px-5 py-5 text-center">
            <p className="text-[10px] font-inter font-bold text-[#6B8FA3] uppercase mb-1">GMV</p>
            <p className="font-artz font-bold text-lg text-[#01406D]">₹{pnl.gmv.toLocaleString('en-IN')}</p>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="text-[10px] font-inter font-bold text-[#6B8FA3] uppercase mb-1">Net GMV</p>
            <p className="font-artz font-bold text-lg text-[#01406D]">₹{pnl.netGmv.toLocaleString('en-IN')}</p>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="text-[10px] font-inter font-bold text-[#6B8FA3] uppercase mb-1">Commission</p>
            <p className="font-artz font-bold text-lg text-[#01406D]">₹{pnl.commission.toLocaleString('en-IN')}</p>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="text-[10px] font-inter font-bold text-[#6B8FA3] uppercase mb-1">Costs</p>
            <p className="font-artz font-bold text-lg text-[#01406D]">₹{pnl.costs.toLocaleString('en-IN')}</p>
          </div>
          <div className="px-5 py-5 text-center bg-[#F5FEFE]">
            <p className="text-[10px] font-inter font-bold text-[#01B4BA] uppercase mb-1">Net Revenue</p>
            <p className="font-artz font-bold text-lg text-[#01B4BA]">₹{pnl.netRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Rates Table */}
        <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0EFEF]">
            <h2 className="font-artz font-bold text-[#01406D] text-base flex items-center gap-2">
              <Percent size={16} className="text-[#01B4BA]" /> Commission Rates
            </h2>
            <button onClick={save}
              className="bg-[#01B4BA] text-white px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] hover:bg-[#019aa0] transition-colors duration-150">
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                  <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Commission %</th>
                  <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">GST %</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={c.category} className={`border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors ${i % 2 === 1 ? 'bg-[#F5FEFE]/30' : ''}`}>
                    <td className="px-4 py-3 font-inter text-sm text-[#01406D] capitalize font-medium">{c.category}</td>
                    <td className="px-4 py-3">
                      <input type="number" value={c.commissionRate} onChange={(e) => update(i, 'commissionRate', +e.target.value)}
                        className="w-20 px-2 py-1.5 border border-[#01406D] rounded-[4px] text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30" min={0} max={100} step={0.5} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={c.gstRate} onChange={(e) => update(i, 'gstRate', +e.target.value)}
                        className="w-20 px-2 py-1.5 border border-[#01406D] rounded-[4px] text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30" min={0} max={100} step={0.5} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Batch Generator */}
        <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E0EFEF]">
            <h2 className="font-artz font-bold text-[#01406D] text-base flex items-center gap-2">
              <Calendar size={16} className="text-[#01B4BA]" /> Payout Batch Generator
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs font-inter font-semibold text-[#6B8FA3] mb-1 block">From</label>
                <input type="date" value={payoutFrom} onChange={(e) => setPayoutFrom(e.target.value)}
                  className="px-3 py-2.5 border border-[#01406D] rounded-[6px] text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 min-h-[44px]" />
              </div>
              <div>
                <label className="text-xs font-inter font-semibold text-[#6B8FA3] mb-1 block">To</label>
                <input type="date" value={payoutTo} onChange={(e) => setPayoutTo(e.target.value)}
                  className="px-3 py-2.5 border border-[#01406D] rounded-[6px] text-xs font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 min-h-[44px]" />
              </div>
              <button onClick={handlePreviewPayout}
                className="bg-[#01406D] text-white px-5 py-2.5 rounded-[6px] text-xs font-inter font-bold min-h-[44px] hover:bg-[#012a4a] transition-colors duration-150">
                Preview
              </button>
            </div>

            {previewAmount !== null && (
              <div className="bg-[#F5FEFE] border border-[#01B4BA]/30 rounded-[6px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-inter text-[#6B8FA3]">Total net payout</span>
                  <span className="font-artz font-bold text-xl text-[#01B4BA]">₹{previewAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-inter text-[#6B8FA3]">
                  <span>Affected vendors</span>
                  <span className="font-bold text-[#01406D]">24 vendors</span>
                </div>
                <button onClick={handleInitiatePayout}
                  className="w-full bg-[#FF7A0F] text-white py-3 rounded-[6px] text-sm font-inter font-bold min-h-[44px] hover:bg-[#e06b0d] transition-colors duration-150">
                  Initiate Payout — ₹{previewAmount.toLocaleString('en-IN')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
