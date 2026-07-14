import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Ticket, Menu, X,
  BarChart2, Wallet, RotateCcw, Bell, MessageSquare, Star, Upload, Megaphone,
  Users, Warehouse, Link2, FileText, ChevronDown, ChevronRight, Store,
} from 'lucide-react';
import logo from '../../assets/logo.png';

interface NavGroup {
  label: string;
  items: { label: string; path: string; icon: React.ElementType; badge?: number }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/vendor', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Products', path: '/vendor/products', icon: Package },
      { label: 'Bulk Upload', path: '/vendor/bulk-upload', icon: Upload },
      { label: 'Inventory', path: '/vendor/inventory', icon: Warehouse },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
      { label: 'Returns', path: '/vendor/returns', icon: RotateCcw },
      { label: 'Customers', path: '/vendor/customers', icon: Users },
      { label: 'Shipping', path: '/vendor/shipping', icon: BarChart2 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Coupons', path: '/vendor/coupons', icon: Ticket },
      { label: 'Advertising', path: '/vendor/advertising', icon: Megaphone },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', path: '/vendor/analytics', icon: BarChart2 },
      { label: 'Reviews', path: '/vendor/reviews', icon: Star },
      { label: 'Reports', path: '/vendor/reports', icon: FileText },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance', path: '/vendor/finance', icon: Wallet },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Messages', path: '/vendor/messages', icon: MessageSquare },
      { label: 'Notifications', path: '/vendor/notifications', icon: Bell },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Team', path: '/vendor/team', icon: Users },
      { label: 'Integrations', path: '/vendor/integrations', icon: Link2 },
      { label: 'Settings', path: '/vendor/settings', icon: Settings },
    ],
  },
];

export const VendorLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Fetch unread notification count
  const { data: notifData } = useQuery({
    queryKey: ['vendor-notifications-count'],
    queryFn: () => vendorApi.notifications.list({ limit: 1 }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const unreadCount = (notifData as any)?.unreadCount || 0;

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Inject unread badge into notifications nav item
  const enrichedGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item =>
      item.path === '/vendor/notifications' ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined } : item
    ),
  }));

  const currentLabel = NAV_GROUPS.flatMap(g => g.items).find(i => location.pathname === i.path)?.label;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 shrink-0">
        <Link to="/vendor" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <img src={logo} alt="shopyng" className="h-8 w-auto" />
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Seller Center</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 hide-scrollbar">
        {enrichedGroups.map(group => {
          const isCollapsed = collapsedGroups.has(group.label);
          const hasActive = group.items.some(i => location.pathname.startsWith(i.path));

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 mb-1 group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                  {group.label}
                </span>
                {isCollapsed
                  ? <ChevronRight className="h-3 w-3 text-gray-400" />
                  : <ChevronDown className="h-3 w-3 text-gray-400" />}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/vendor' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
            {user?.displayName?.[0] || user?.phone?.[0] || 'V'}
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 text-xs font-bold truncate">{user?.displayName || 'Vendor'}</p>
            <p className="text-gray-500 text-[10px] truncate">{user?.email || user?.phone || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-gray-100">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="font-black text-gray-900 text-base md:text-lg">
              {currentLabel || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/vendor/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to={`/seller/${user?.uid}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors hidden sm:block">
              View Store →
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
