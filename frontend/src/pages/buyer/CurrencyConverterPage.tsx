import React from 'react';
import { ArrowRightLeft, Globe } from 'lucide-react';

export const CurrencyConverterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-3xl mx-auto selection:bg-blue-100">
      <div className="text-center mb-16">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
          Currency Converter
        </h1>
        <p className="text-gray-400 font-light max-w-lg mx-auto">
          Shopping internationally? Calculate accurate exchange rates instantly before you checkout.
        </p>
      </div>

      <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From</label>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <select className="bg-gray-50 border-r border-gray-200 px-4 font-bold text-gray-700 outline-none">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
              <input type="number" defaultValue={100} className="w-full px-4 py-4 font-black text-xl text-gray-900 outline-none" />
            </div>
          </div>

          <div className="w-12 h-12 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center shrink-0 text-blue-500 my-2 md:my-0 mt-6 z-10 md:-mx-3 relative">
            <ArrowRightLeft className="w-5 h-5 rotate-90 md:rotate-0" />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">To</label>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <select className="bg-gray-50 border-r border-gray-200 px-4 font-bold text-gray-700 outline-none">
                <option>INR</option>
              </select>
              <input type="text" value="8,350.00" readOnly className="w-full px-4 py-4 font-black text-xl text-gray-900 outline-none bg-white" />
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-sm font-medium text-gray-500">
            1 USD = <span className="font-bold text-gray-900">83.50 INR</span>
          </p>
          <p className="text-xs text-gray-400 mt-2 font-light">Mid-market exchange rate at 12:00 UTC</p>
        </div>
      </div>
    </div>
  );
};
