import React from 'react';
import { Gift, Sparkles } from 'lucide-react';

export const ShopWithPointsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto selection:bg-purple-100">
      <div className="text-center mb-20">
        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Gift className="w-10 h-10 text-purple-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
          Shop with Points
        </h1>
        <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
          Turn your everyday grocery runs into free rewards. Pay for your entire cart or just a portion of it using your accumulated shopyng points.
        </p>
      </div>

      <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8 md:p-12 mb-16 text-center">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Your Current Balance</h3>
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <span className="text-6xl font-black text-gray-900">2,450</span>
        </div>
        <p className="text-gray-500 font-medium">Value: ₹245.00</p>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
        <div className="flex gap-6 items-start">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-900 shrink-0">1</div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Earn as you shop</h4>
            <p className="text-gray-500 font-light">Earn 10 points for every ₹100 spent on shopyng. Points are credited to your account automatically upon delivery.</p>
          </div>
        </div>
        <div className="flex gap-6 items-start">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-900 shrink-0">2</div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Select at checkout</h4>
            <p className="text-gray-500 font-light">When you are ready to pay, simply toggle "Use Points" in your cart to apply your balance instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
