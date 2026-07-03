import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, ChevronDown, Menu } from 'lucide-react';
import { useCart } from '../../store/useCart';
import { useAuth } from '../../hooks/useAuth';
import { MegaMenu } from './MegaMenu';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import logo from '@/assets/logo.png';

export const Navbar: React.FC = () => {
  const { getItemCount, setIsOpen, getTotal } = useCart();
  const { user } = useAuth();
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            if (data && data.address) {
              const area = data.address.suburb || data.address.neighbourhood || data.address.road || '';
              const city = data.address.city || data.address.town || data.address.county || '';
              setGpsLocation(`${area}${area && city ? ', ' : ''}${city}`);
            } else {
              setGpsLocation('Location detected');
            }
          } catch (err) {
            console.error("Error fetching reverse geocoding: ", err);
            setGpsLocation('Location detected');
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [user]);
  
  const displayLocation = user?.addresses && user.addresses.length > 0 
    ? `${user.addresses[0].area}, ${user.addresses[0].city}`
    : gpsLocation || 'Select Location';
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
      <div className="container flex flex-col md:flex-row md:h-20 items-center justify-between gap-4 py-3 md:py-0">
        
        {/* Top Row for Mobile (Logo + Location + Profile/Cart) */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger */}
            <button 
              className="md:hidden p-1 text-gray-900"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1">
              <img src={logo} alt="Shopyng" className="w-32 md:w-36 h-auto" />
            </Link>
            
            <div className="w-px h-10 bg-black/10 hidden md:block mx-2"></div>
            
            {/* Location Picker */}
            <div className="flex flex-col">
              <span className="font-extrabold text-gray-900 text-[15px] leading-tight">Delivery in 10 minutes</span>
              <div className="flex items-center text-gray-800 text-sm">
                <span className="truncate max-w-[150px] font-medium">{displayLocation}</span>
              </div>
            </div>
          </div>

          {/* Right Actions (Mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/profile" className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
              <User className="h-5 w-5 text-gray-900 stroke-[1.5]" />
            </Link>
            <button 
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg font-bold transition-colors shadow-sm"
            >
              <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 w-full md:max-w-2xl relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 stroke-[1.5]" />
          </div>
          <input
            type="text"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-[15px]"
            placeholder="Search products, brands and categories..."
          />
        </div>

        {/* Right Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 text-[15px] font-medium text-gray-900 hover:text-black transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <User className="h-4 w-4 text-gray-900" />
              </div>
              <span className="truncate max-w-[100px]">{user.displayName || 'Profile'}</span>
            </Link>
          ) : (
            <Link to="/profile" className="flex items-center gap-2 text-[15px] font-medium text-gray-900 hover:text-black transition-colors">
              Login
            </Link>
          )}
          
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-sm"
          >
            <ShoppingCart className="h-6 w-6 stroke-[1.5]" />
            <div className="flex flex-col items-start text-xs leading-tight">
              <span className="font-extrabold">{getItemCount()} items</span>
              <span className="opacity-90 font-medium">₹{getTotal()}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Secondary Navbar for Categories (Desktop) */}
      <div className="hidden md:flex border-t border-gray-100 bg-white">
        <div className="container flex items-center relative">
          
          {/* All Categories Dropdown Trigger */}
          <div 
            className="relative group"
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <button className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 font-bold text-sm tracking-wide transition-colors">
              <Menu className="w-5 h-5" />
              ALL CATEGORIES
            </button>
            
            {/* Mega Menu Dropdown */}
            {isMegaMenuOpen && (
              <MegaMenu onClose={() => setIsMegaMenuOpen(false)} />
            )}
          </div>

          {/* Quick Links */}
          <nav className="flex items-center gap-6 ml-6">
            <Link to="/category/electronics/mobiles" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Mobiles</Link>
            <Link to="/category/fashion" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Fashion</Link>
            <Link to="/category/electronics" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Electronics</Link>
            <Link to="/category/home-kitchen" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Home & Kitchen</Link>
            <Link to="/category/groceries" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Daily Groceries</Link>
          </nav>
        </div>
      </div>
      
      {/* Mobile Drawer */}
      <MobileMenuDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
};
