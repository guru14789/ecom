import React, { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';

export const ReloadBalancePage: React.FC = () => {
  const [amount, setAmount] = useState('1000');

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-2xl mx-auto selection:bg-green-100">
      <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
        Reload Balance
      </h1>
      <p className="text-gray-400 font-light mb-16">
        Add funds to your shopyng Wallet for lightning-fast, 1-click checkouts.
      </p>

      <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/20 rounded-[2rem] p-8 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Current Balance</p>
            <p className="text-2xl font-black text-gray-900">₹450.00</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-900 mb-4">Amount to add</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-2xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {['500', '1000', '2000'].map((val) => (
            <button 
              key={val}
              onClick={() => setAmount(val)}
              className={`py-3 rounded-xl font-bold border transition-colors ${amount === val ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'}`}
            >
              +₹{val}
            </button>
          ))}
        </div>

        <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
          <Plus className="w-5 h-5" /> Add Funds to Wallet
        </button>
      </div>
    </div>
  );
};
