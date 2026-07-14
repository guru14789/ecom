import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Users, Store, Package, Settings, LogOut, Ticket, FileText, Menu, X, CreditCard, ClipboardList, Briefcase } from 'lucide-react';
import adminLogo from '../../assets/admin-logo.png';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Vendors', path: '/admin/vendors', icon: Store },
    { label: 'Buyers', path: '/admin/buyers', icon: Users },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Transactions', path: '/admin/transactions', icon: CreditCard },
    { label: 'Reports', path: '/admin/reports', icon: FileText },
    { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { label: 'Audit Log', path: '/admin/audit-log', icon: ClipboardList },
    { label: 'Careers', path: '/admin/jobs', icon: Briefcase },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-white text-gray-800 flex flex-col 
        transition-all duration-300 ease-in-out border-r border-gray-100 shadow-xl shadow-blue-900/5 whitespace-nowrap overflow-hidden
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'}
      `}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full"></div>

        <div className={`h-20 flex items-center relative z-10 border-b border-gray-100 ${isSidebarOpen ? 'px-6' : 'justify-center'}`}>
          <Link to="/admin" className="text-2xl font-black tracking-tight text-blue-950 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <span className="text-white text-xl leading-none">S</span>
            </div>
            <div className={`transition-opacity duration-300 flex flex-col justify-center ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              <img src={adminLogo} alt="SHOPYNG" className="h-7 object-contain object-left mb-0.5" />
              <span className="text-orange-500 font-bold text-[11px] tracking-[0.2em] leading-none">ADMIN</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 space-y-2 relative z-10 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`flex items-center rounded-xl text-sm font-bold transition-all duration-200 group
                  ${isSidebarOpen ? 'px-4 py-3 mx-4 gap-4' : 'justify-center py-3 mx-3 gap-0'}
                  ${isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' 
                    : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                }`}
                title={item.label}
              >
                <div className={`p-2 rounded-xl transition-colors shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-orange-600'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-gray-100 relative z-10 bg-white flex ${isSidebarOpen ? '' : 'justify-center'}`}>
          <button 
            onClick={handleLogout}
            className={`flex items-center rounded-xl text-sm font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors group ${isSidebarOpen ? 'gap-4 px-4 py-3 w-full' : 'gap-0 p-2 justify-center'}`} 
            title="Logout"
          >
            <div className="p-2 rounded-xl text-gray-400 group-hover:text-red-500 transition-colors shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50 h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            {/* Page title removed to prevent double-header with stunning page headers */}
            <div className="hidden md:block w-8"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <span className="font-bold text-gray-900 block leading-tight">Super Admin</span>
              <span className="text-gray-500 text-xs font-medium">System Operator</span>
            </div>
            <div className="h-10 w-10 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl flex items-center justify-center font-black shadow-md border border-gray-700">
              AD
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
