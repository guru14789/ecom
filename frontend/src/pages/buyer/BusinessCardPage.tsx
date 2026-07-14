import React from 'react';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

export const BusinessCardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto selection:bg-green-100">
      <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24 mb-24">
        <div className="flex-1">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
            The shopyng <br/> Business Card.
          </h1>
          <p className="text-xl text-gray-400 font-light mb-10 max-w-md">
            Zero annual fees. Unlimited 5% cashback on all local grocery purchases. Built for your daily needs.
          </p>
          <button className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
            Apply Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 w-full max-w-md relative" style={{ perspective: '1000px' }}>
          <div className="w-full aspect-[1.6/1] bg-gradient-to-tr from-green-900 via-green-800 to-green-600 rounded-3xl p-8 shadow-2xl shadow-green-900/20 text-white flex flex-col justify-between transform -rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700">
            <div className="flex justify-between items-start">
              <span className="font-black tracking-widest text-lg">shopyng</span>
              <CreditCard className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-2xl font-mono tracking-[0.2em] mb-2 opacity-90">•••• •••• •••• 4242</div>
              <div className="flex justify-between items-center text-sm font-medium opacity-80">
                <span>BUSINESS</span>
                <span>VALID THRU 12/28</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <h3 className="text-xl font-bold text-gray-900">5% Cashback</h3>
          <p className="text-gray-500 font-light text-sm leading-relaxed">Earn unlimited 5% cashback on every order placed on shopyng.</p>
        </div>
        <div className="space-y-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <h3 className="text-xl font-bold text-gray-900">Zero Fees</h3>
          <p className="text-gray-500 font-light text-sm leading-relaxed">No annual fees, no hidden charges. Keep exactly what you earn.</p>
        </div>
        <div className="space-y-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <h3 className="text-xl font-bold text-gray-900">Instant Approval</h3>
          <p className="text-gray-500 font-light text-sm leading-relaxed">Apply in 60 seconds and start using your virtual card immediately.</p>
        </div>
      </div>
    </div>
  );
};
