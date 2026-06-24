import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Boxes, Percent,
  RotateCcw, Wallet, BarChart3, HeadphonesIcon, LogOut
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/promotions', icon: Percent, label: 'Promotions' },
  { to: '/returns', icon: RotateCcw, label: 'Returns' },
  { to: '/payouts', icon: Wallet, label: 'Payouts' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/support', icon: HeadphonesIcon, label: 'Support' },
];

const Sidebar: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    window.location.href = '/';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#01406D] text-white flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-artz font-bold tracking-tight">Shop<span className="text-[#01B4BA]">YNG</span></h1>
        <p className="text-xs text-white/60 mt-1 font-inter">Vendor Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-[6px] text-sm font-inter font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#01B4BA]/20 text-[#01B4BA] shadow-[inset_3px_0_0_#01B4BA]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-[6px] text-sm font-inter font-medium text-white/50 hover:text-red-400 hover:bg-white/5 w-full transition-all duration-150"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
