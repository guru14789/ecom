import React from 'react';
import { useAppSelector } from '../../store';
import { Bell, Search } from 'lucide-react';

const Header: React.FC = () => {
  const user = useAppSelector((s) => s.vendor.user);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search orders, products..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 font-inter">{user?.storeName || 'My Store'}</p>
            <p className="text-xs text-slate-500">{user?.name || 'Vendor'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
