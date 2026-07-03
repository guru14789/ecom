import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Ticket } from 'lucide-react';

export const VendorLayout: React.FC = () => {
  const location = useLocation();

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/vendor', icon: LayoutDashboard },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
    { label: 'Products', path: '/vendor/products', icon: Package },
    { label: 'Coupons', path: '/vendor/coupons', icon: Ticket },
    { label: 'Settings', path: '/vendor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/vendor" className="text-xl font-black text-accent">shopsyy Vendor</Link>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent/10 text-yellow-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-yellow-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900">
            {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium text-gray-900 block leading-tight">FreshMart Super Store</span>
              <span className="text-green-600 text-xs font-bold">● Open</span>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full border"></div>
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
