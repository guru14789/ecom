import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, Bell, Heart, User, Menu, X,
  MapPin, ChevronDown, Package, LogOut, Settings, TrendingUp, Clock
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCartOpen, setLoginModalOpen } from '../../store/slices/uiSlice';
import { markAllAsRead } from '../../store/slices/notificationsSlice';
import { autocompleteSearch } from '../../api/products';
import { AutocompleteItem } from '../../api/products';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount   = useAppSelector((s) => s.cart.items.reduce((acc, i) => acc + i.quantity, 0));
  const user        = useAppSelector((s) => s.auth.user);
  const addresses   = useAppSelector((s) => s.auth.addresses);
  const wishCount   = useAppSelector((s) => s.wishlist.items.length);
  const unreadNotif = useAppSelector((s) => s.notifications.unreadCount);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await autocompleteSearch(q);
      setSuggestions(res.data || []);
      setShowSuggestions(res.data?.length > 0);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  const handleSearch = (q?: string) => {
    const query = q || searchQuery;
    setShowSuggestions(false);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileMenuOpen(false);
    } else {
      navigate('/search');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSearch(suggestions[selectedIndex].name);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleCartClick = () => {
    if (!user?.isLoggedIn) {
      dispatch(setLoginModalOpen(true));
      return;
    }
    navigate('/cart');
  };

  const handleNotifClick = () => {
    navigate('/notifications');
    dispatch(markAllAsRead());
  };

  const currentAddress = addresses[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.06)] border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="flex-shrink-0 flex items-center" aria-label="ShopYNG Home">
          <img src="/logo.png" alt="ShopYNG" className="h-9 w-auto" />
        </button>

        {currentAddress && (
          <button
            className="hidden md:flex items-start gap-1.5 group max-w-[140px] text-left hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          >
            <MapPin size={14} className="text-primary-main mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-inter text-[10px] text-slate-400 font-medium">Deliver to</p>
              <p className="font-poppins font-bold text-xs text-slate-800 truncate flex items-center gap-1">
                {currentAddress.pincode}
                <ChevronDown size={10} className="text-slate-400 group-hover:translate-y-0.5 transition-transform" />
              </p>
            </div>
          </button>
        )}

        <div ref={searchRef} className="flex-1 relative">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 hover:border-primary-main/40 focus-within:border-primary-main focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-main/15 transition-all"
          >
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              placeholder="Search products, brands, categories..."
              className="flex-1 bg-transparent font-inter text-sm text-slate-700 outline-none placeholder:text-slate-400 min-w-0"
              aria-label="Search"
              autoComplete="off"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50">
              {suggestions.map((item, idx) => {
                const disc = item.mrp ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleSearch(item.name)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === selectedIndex ? 'bg-primary-main/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={`/${item.image}`}
                      alt=""
                      className="w-9 h-9 rounded-lg object-contain bg-slate-50 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm text-slate-700 truncate">{item.name}</p>
                      <p className="font-inter text-xs text-slate-400">
                        Rs.{item.price.toLocaleString('en-IN')}
                        {disc > 0 && <span className="text-emerald-600 ml-1">{disc}% off</span>}
                      </p>
                    </div>
                    {!item.inStock && (
                      <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">Out of stock</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <button onClick={handleNotifClick} className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors" aria-label={`Notifications ${unreadNotif > 0 ? `(${unreadNotif} unread)` : ''}`}>
            <Bell size={20} />
            {unreadNotif > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-poppins font-extrabold rounded-full flex items-center justify-center">
                {unreadNotif > 9 ? '9+' : unreadNotif}
              </span>
            )}
          </button>

          <button onClick={() => navigate('/wishlist')} className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors hidden sm:flex" aria-label={`Wishlist (${wishCount} items)`}>
            <Heart size={20} className={wishCount > 0 ? 'text-rose-500' : ''} />
            {wishCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-poppins font-extrabold rounded-full flex items-center justify-center">
                {wishCount > 9 ? '9+' : wishCount}
              </span>
            )}
          </button>

          <button onClick={handleCartClick} className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors" aria-label={`Cart (${cartCount} items)`}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary-main text-white text-[9px] font-poppins font-extrabold rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {user?.isLoggedIn ? (
            <div ref={profileRef} className="relative hidden sm:block">
              <button onClick={() => setProfileMenuOpen((v) => !v)} className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors" aria-label="Account menu" aria-expanded={profileMenuOpen}>
                <User size={20} />
                <ChevronDown size={13} className={`transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50 min-w-[200px]">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="font-poppins font-bold text-sm text-slate-800">{user.fullName || 'My Account'}</p>
                    <p className="font-inter text-xs text-slate-400 mt-0.5">{user.phoneNumber}</p>
                  </div>
                  {[
                    { icon: <User size={14} />,    label: 'My Profile',    path: '/profile' },
                    { icon: <Package size={14} />, label: 'My Orders',     path: '/orders' },
                    { icon: <Heart size={14} />,   label: 'Wishlist',      path: '/wishlist' },
                    { icon: <Bell size={14} />,    label: 'Notifications', path: '/notifications' },
                    { icon: <Settings size={14} />,label: 'Settings',      path: '/profile' },
                  ].map((item) => (
                    <button key={item.label} onClick={() => { navigate(item.path); setProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors">
                      <span className="text-slate-500">{item.icon}</span>
                      <span className="font-inter text-sm text-slate-700 font-medium">{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-50">
                    <button onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 text-left transition-colors">
                      <LogOut size={14} className="text-rose-400" />
                      <span className="font-inter text-sm text-rose-500 font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => dispatch(setLoginModalOpen(true))} className="hidden sm:flex items-center gap-1.5 bg-primary-main hover:bg-primary-hover text-white font-poppins font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all" aria-label="Sign in">
              <User size={14} />
              Sign In
            </button>
          )}

          <button onClick={() => setMobileMenuOpen((v) => !v)} className="sm:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-3">
          {user?.isLoggedIn ? (
            <div className="flex flex-col gap-2">
              <p className="font-poppins font-bold text-sm text-slate-800">Hi, {user.fullName?.split(' ')[0] || 'There'}!</p>
              {[
                { label: 'My Profile',    path: '/profile' },
                { label: 'My Orders',     path: '/orders' },
                { label: 'Wishlist',      path: '/wishlist' },
                { label: 'Notifications', path: '/notifications' },
              ].map((item) => (
                <button key={item.label} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} className="text-left font-inter text-sm text-slate-600 hover:text-primary-main transition-colors py-1.5">
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => { dispatch(setLoginModalOpen(true)); setMobileMenuOpen(false); }} className="bg-primary-main text-white font-poppins font-bold text-sm py-3 rounded-2xl shadow-sm">
              Sign In to Your Account
            </button>
          )}
        </div>
      )}
    </header>
  );
};
