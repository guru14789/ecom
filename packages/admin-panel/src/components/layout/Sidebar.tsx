import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Store, Package, ShoppingCart, Users,
  Wallet, Percent, BarChart3, Settings, Bell, LogOut, Shield,
  UserCheck, ClipboardCheck, Tag, Zap, Scale, FileText,
  BarChart2, ClipboardList
} from 'lucide-react';

interface NavSection {
  label: string;
  items: Array<{ to: string; icon: React.ElementType; label: string; end?: boolean }>;
}

const sections: NavSection[] = [
  {
    label: 'Overview',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true }],
  },
  {
    label: 'Vendors',
    items: [
      { to: '/vendors', icon: Store, label: 'Vendors' },
      { to: '/onboarding', icon: UserCheck, label: 'Onboarding' },
    ],
  },
  {
    label: 'Products',
    items: [
      { to: '/products', icon: Package, label: 'Catalogue' },
      { to: '/product-approval', icon: ClipboardCheck, label: 'Approval' },
      { to: '/categories', icon: Tag, label: 'Categories' },
    ],
  },
  {
    label: 'Orders',
    items: [{ to: '/orders', icon: ShoppingCart, label: 'Orders' }],
  },
  {
    label: 'Users',
    items: [
      { to: '/users', icon: Users, label: 'All Users' },
      { to: '/user-management', icon: Users, label: 'Roles & Access' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/commissions', icon: Percent, label: 'Commissions' },
      { to: '/sales-events', icon: Zap, label: 'Sales Events' },
    ],
  },
  {
    label: 'Promotions',
    items: [
      { to: '/promotions', icon: Percent, label: 'Promotions' },
      { to: '/group-sessions', icon: Zap, label: 'Group Sessions' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports', icon: FileText, label: 'Reports' },
      { to: '/reports-dashboard', icon: BarChart3, label: 'Dashboard' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/activity', icon: ClipboardList, label: 'Activity Log' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/notification-templates', icon: Bell, label: 'Notifications' },
      { to: '/disputes', icon: Scale, label: 'Disputes' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#01406D] text-white flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-artz font-bold tracking-tight">Shop<span className="text-[#01B4BA]">YNG</span></h1>
        <p className="text-xs text-white/60 mt-1 font-inter flex items-center gap-1">
          <Shield size={12} /> Admin Panel
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-4 pb-1 text-[10px] font-artz font-bold text-white/40 uppercase tracking-[0.1em]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-[6px] text-sm font-inter font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#01B4BA]/20 text-[#01B4BA] shadow-[inset_3px_0_0_#01B4BA]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
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
