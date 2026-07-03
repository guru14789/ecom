import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Store, Package, Settings, LogOut, Ticket, FileText } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Vendors', path: '/admin/vendors', icon: Store },
    { label: 'Buyers', path: '/admin/buyers', icon: Users },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Reports', path: '/admin/reports', icon: FileText },
    { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-secondary-foreground flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 bg-black/20">
          <Link to="/admin" className="text-xl font-black tracking-wide uppercase italic">SHOPYNG <span className="text-accent">ADMIN</span></Link>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <h1 className="font-bold text-gray-900">
            {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <span className="font-medium text-gray-900 block leading-tight">Super Admin</span>
              <span className="text-gray-500 text-xs">System Operator</span>
            </div>
            <div className="h-10 w-10 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold">
              AD
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
