import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../shared/Navbar';
import { CartDrawer } from './CartDrawer';
import { ChatWidget } from '../chat/ChatWidget';
import { Footer } from '../shared/Footer';
import { Home, Search, Package, User } from 'lucide-react';

export const BuyerLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-white pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:py-6">
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-between px-6 py-2 z-40 pb-safe">
        <Link to="/" className={`flex flex-col items-center gap-1 ${currentPath === '/' ? 'text-gray-900' : 'text-gray-400'}`}>
          <Home className={`h-6 w-6 ${currentPath === '/' ? 'fill-gray-900 stroke-gray-900' : 'stroke-[1.5]'}`} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center gap-1 ${currentPath === '/search' ? 'text-gray-900' : 'text-gray-400'}`}>
          <Search className={`h-6 w-6 stroke-[1.5] ${currentPath === '/search' ? 'stroke-gray-900 stroke-2' : ''}`} />
          <span className="text-[10px] font-bold">Search</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center gap-1 ${currentPath === '/orders' ? 'text-gray-900' : 'text-gray-400'}`}>
          <Package className={`h-6 w-6 stroke-[1.5] ${currentPath === '/orders' ? 'stroke-gray-900 stroke-2' : ''}`} />
          <span className="text-[10px] font-bold">Orders</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${currentPath === '/profile' ? 'text-gray-900' : 'text-gray-400'}`}>
          <User className={`h-6 w-6 ${currentPath === '/profile' ? 'fill-gray-900 stroke-gray-900' : 'stroke-[1.5]'}`} />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </div>

      <CartDrawer />
      <ChatWidget />
    </div>
  );
};
