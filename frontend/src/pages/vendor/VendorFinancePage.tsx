import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ArrowUpRight, Award, Landmark, RefreshCw } from 'lucide-react';
import { vendorApi } from '../../lib/api';

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'pending' | 'released' | 'failed';
  createdAt: string;
  releasedAt?: string;
  orderId?: string;
}

export const VendorFinancePage: React.FC = () => {
  const { data: payoutsData, isLoading: loadingPayouts } = useQuery({
    queryKey: ['vendorPayouts'],
    queryFn: async () => {
      const res = await vendorApi.payouts.list();
      return res.data as PayoutRecord[];
    }
  });

  const payouts = payoutsData || [];

  const balanceMetrics = {
    available: payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0),
    withdrawn: payouts.filter(p => p.status === 'released').reduce((acc, p) => acc + p.amount, 0),
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Payments & Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">Check settlement balance, review bank deposits, and track release dates.</p>
        </div>
      </div>

      {/* Finance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-orange-50">
            <DollarSign className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unsettled Balance</p>
            <h2 className="text-2xl font-black text-blue-950">₹{balanceMetrics.available.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50">
            <ArrowUpRight className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Settled</p>
            <h2 className="text-2xl font-black text-blue-950">₹{balanceMetrics.withdrawn.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-green-50">
            <Award className="w-7 h-7 text-green-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Sales Revenue</p>
            <h2 className="text-2xl font-black text-blue-950">₹{(balanceMetrics.available + balanceMetrics.withdrawn).toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settlements list */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-black text-blue-950">Payout Transactions Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Release Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingPayouts ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <RefreshCw className="w-6 h-6 mx-auto animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      No payout logs available yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(payout.releasedAt || payout.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{payout.amount}</td>
                      <td className="px-6 py-4">
                        {payout.status === 'released' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-700">SETTLED</span>
                        ) : payout.status === 'pending' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700">PENDING</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">FAILED</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank card details */}
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Landmark className="w-5 h-5 text-orange-500" /> Linked Account
          </h3>
          <p className="text-xs text-gray-500">Payouts are settled directly to this bank account within 2-3 business days of confirmation.</p>
          <div className="bg-gray-50 p-4 rounded-2xl border space-y-2">
            <span className="text-[10px] text-gray-400 font-bold block">SETTLEMENT METHOD</span>
            <span className="font-black text-blue-950 text-sm block">Direct Bank Transfer</span>
            
            <div className="pt-2 border-t mt-2">
              <span className="text-[10px] text-gray-400 font-bold block">STATUS</span>
              <span className="text-xs font-black text-green-600 block">Verified & Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
