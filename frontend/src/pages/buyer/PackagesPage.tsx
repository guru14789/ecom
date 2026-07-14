import React from 'react';
import { Check, Star, Users, Zap } from 'lucide-react';

export const PackagesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto selection:bg-orange-100">
      <div className="text-center mb-24">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
          Choose your way <br/> to shop.
        </h1>
        <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
          Whether you're shopping for yourself or your whole family, we have a package designed to save you time and money.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Basic */}
        <div className="border border-gray-100 rounded-[2.5rem] p-8 hover:border-gray-300 hover:shadow-2xl hover:shadow-gray-900/5 transition-all duration-500 flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
            <p className="text-gray-500 font-light">Pay as you go</p>
          </div>
          <div className="mb-10">
            <span className="text-5xl font-black text-gray-900">Free</span>
          </div>
          <div className="flex-1 space-y-4 mb-10">
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Check className="w-5 h-5 text-green-500 shrink-0" /> Standard 30-min delivery
            </div>
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Check className="w-5 h-5 text-green-500 shrink-0" /> Free delivery over ₹500
            </div>
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Check className="w-5 h-5 text-green-500 shrink-0" /> Standard points earning
            </div>
          </div>
          <button className="w-full py-4 rounded-full border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-900 hover:text-white transition-colors">
            Current Plan
          </button>
        </div>

        {/* Plus */}
        <div className="border-2 border-orange-500 rounded-[2.5rem] p-8 shadow-2xl shadow-orange-500/10 relative transform md:-translate-y-4 flex flex-col">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-orange-500/30">
            <Star className="w-3 h-3 fill-current" /> Most Popular
          </div>
          <div className="mb-8 mt-2">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              shopyng <span className="text-orange-500">Plus</span>
            </h3>
            <p className="text-gray-500 font-light">For the daily shopper</p>
          </div>
          <div className="mb-10 flex items-end gap-1">
            <span className="text-5xl font-black text-gray-900">₹99</span>
            <span className="text-gray-500 font-medium mb-1">/mo</span>
          </div>
          <div className="flex-1 space-y-4 mb-10">
            <div className="flex items-center gap-3 text-gray-900 font-medium">
              <Check className="w-5 h-5 text-orange-500 shrink-0" /> Free delivery on ALL orders
            </div>
            <div className="flex items-center gap-3 text-gray-900 font-medium">
              <Check className="w-5 h-5 text-orange-500 shrink-0" /> Priority 15-min delivery
            </div>
            <div className="flex items-center gap-3 text-gray-900 font-medium">
              <Check className="w-5 h-5 text-orange-500 shrink-0" /> 2x points on every purchase
            </div>
            <div className="flex items-center gap-3 text-gray-900 font-medium">
              <Check className="w-5 h-5 text-orange-500 shrink-0" /> Exclusive partner discounts
            </div>
          </div>
          <button className="w-full py-4 rounded-full bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-xl shadow-orange-500/20">
            Start 14-Day Free Trial
          </button>
        </div>

        {/* Family */}
        <div className="border border-gray-100 rounded-[2.5rem] p-8 hover:border-gray-300 hover:shadow-2xl hover:shadow-gray-900/5 transition-all duration-500 flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              shopyng <span className="text-purple-500">Family</span>
            </h3>
            <p className="text-gray-500 font-light">Share with up to 4 people</p>
          </div>
          <div className="mb-10 flex items-end gap-1">
            <span className="text-5xl font-black text-gray-900">₹199</span>
            <span className="text-gray-500 font-medium mb-1">/mo</span>
          </div>
          <div className="flex-1 space-y-4 mb-10">
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Check className="w-5 h-5 text-purple-500 shrink-0" /> Everything in Plus
            </div>
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Users className="w-5 h-5 text-purple-500 shrink-0" /> 4 independent accounts
            </div>
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Zap className="w-5 h-5 text-purple-500 shrink-0" /> Shared family wallet
            </div>
            <div className="flex items-center gap-3 text-gray-600 font-light">
              <Star className="w-5 h-5 text-purple-500 shrink-0" /> Dedicated priority support
            </div>
          </div>
          <button className="w-full py-4 rounded-full border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-900 hover:text-white transition-colors">
            Get Family Plan
          </button>
        </div>
      </div>
    </div>
  );
};
