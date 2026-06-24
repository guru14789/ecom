import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCartOpen, setLoginModalOpen } from '../../store/slices/uiSlice';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const user      = useAppSelector((s) => s.auth.user);
  const cartCount = useAppSelector((s) => s.cart.items.reduce((acc, i) => acc + i.quantity, 0));
  const wishCount = useAppSelector((s) => s.wishlist.items.length);

  const isActive = (path: string) => location.pathname === path;

  const tabs: Array<{
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
    path?: string;
    onClick?: () => void;
    activeColor?: string;
  }> = [
    {
      label: 'Home',
      icon: <Home size={21} />,
      path: '/',
    },
    {
      label: 'Search',
      icon: <Search size={21} />,
      path: '/search',
    },
    {
      label: 'Cart',
      icon: <ShoppingBag size={21} />,
      badgeCount: cartCount,
      onClick: () => {
        if (!user?.isLoggedIn) {
          dispatch(setLoginModalOpen(true));
          return;
        }
        dispatch(setCartOpen(true));
      },
      activeColor: 'text-primary-main',
    },
    {
      label: 'Wishlist',
      icon: <Heart size={21} className={wishCount > 0 ? 'text-rose-500' : ''} />,
      badgeCount: wishCount,
      path: '/wishlist',
      activeColor: 'text-rose-500',
    },
    {
      label: 'Profile',
      icon: <User size={21} />,
      path: user?.isLoggedIn ? '/profile' : undefined,
      onClick: !user?.isLoggedIn ? () => dispatch(setLoginModalOpen(true)) : undefined,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-sm bg-white/85 backdrop-blur-xl border border-white/60 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.14)] z-[4999] flex items-center justify-around py-2.5 px-4"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const active = tab.path ? isActive(tab.path) : false;
        return (
          <button
            key={tab.label}
            onClick={tab.onClick ?? (tab.path ? () => navigate(tab.path!) : undefined)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-0.5 transition-all duration-200 ${
              active
                ? (tab.activeColor ?? 'text-primary-main') + ' scale-105'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="text-[9px] font-poppins font-bold">{tab.label}</span>

            {/* Badge */}
            {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
