import React from 'react';
import { Search, MessageSquare, PhoneCall, Mail } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto selection:bg-orange-100">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
          How can we help?
        </h1>
        <div className="max-w-2xl mx-auto relative">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search for answers, orders, or policies..." 
            className="w-full pl-14 pr-6 py-4 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        <div className="p-8 border border-gray-100 rounded-3xl hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer">
          <MessageSquare className="w-8 h-8 text-orange-500 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">Live Chat</h3>
          <p className="text-gray-500 font-light text-sm">Chat instantly with our support team available 24/7.</p>
        </div>
        
        <div className="p-8 border border-gray-100 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer">
          <PhoneCall className="w-8 h-8 text-blue-500 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">Call Us</h3>
          <p className="text-gray-500 font-light text-sm">Speak directly with a customer success agent.</p>
        </div>

        <div className="p-8 border border-gray-100 rounded-3xl hover:border-green-200 hover:shadow-xl hover:shadow-green-500/5 transition-all cursor-pointer">
          <Mail className="w-8 h-8 text-green-500 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">Email Support</h3>
          <p className="text-gray-500 font-light text-sm">Send us an email and we'll reply within 2 hours.</p>
        </div>
      </div>
    </div>
  );
};
