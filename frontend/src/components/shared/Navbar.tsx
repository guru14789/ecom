import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, ChevronDown, Menu } from 'lucide-react';
import { useCart } from '../../store/useCart';
import { useWishlist } from '../../store/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import { MegaMenu } from './MegaMenu';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import logo from '../../assets/logo.png';

export const Navbar: React.FC = () => {
  const { getItemCount, setIsOpen, getTotal } = useCart();
  const { getItemCount: getWishlistCount } = useWishlist();
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
    <header className="sticky top-0 z-[100] w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container flex items-center justify-between h-20 gap-4">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-1 text-gray-900"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center">
            <img src={logo} alt="shopyng" className="h-16 w-auto" />
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold text-primary transition-colors">Home</Link>
          <Link to="/app" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Our App</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          
          <Link to="/profile/wishlist" className="hidden md:flex p-2 text-gray-400 hover:text-primary transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            {getWishlistCount() > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </Link>

          {user ? (
            <Link to="/profile" className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=e0f2fe&color=0369a1`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </Link>
          ) : (
            <Link to="/profile" className="hidden md:flex text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Login
            </Link>
          )}
          
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all relative"
          >
            <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
            {getItemCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white">
                {getItemCount()}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Drawer */}
      <MobileMenuDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
};
