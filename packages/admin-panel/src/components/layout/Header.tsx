import React from 'react';
import { Bell, Search } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="relative max-w-xs w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-2 bg-[#F5FEFE] border border-[#E0EFEF] rounded-[6px] text-sm font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 focus:border-[#01B4BA] transition-all duration-150"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-slate-50 rounded-xl transition-colors">
          <Bell size={18} className="text-slate-500" />
        </button>
        <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold font-inter">
          A
        </div>
      </div>
    </header>
  );
};

export default Header;
