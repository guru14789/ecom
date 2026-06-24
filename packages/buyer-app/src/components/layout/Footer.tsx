import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#012a4a] text-white pt-20 pb-0 mt-20" id="site-footer">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-10 mb-16">
        {/* Brand */}
        <div className="flex flex-col gap-5">
          <Link to="/" className="flex items-center gap-2 self-start select-none">
            <img src="/logo.png" alt="ShopYNG Logo" className="h-[80px] w-auto brightness-0 invert opacity-90" />
          </Link>
          <p className="font-inter text-white/60 text-sm leading-relaxed max-w-[300px]">
            Better, Together. — Get the freshest groceries delivered right to your home. Fast, fresh, and always on time.
          </p>
          <div className="flex gap-3">
            <a href="#" id="social-fb" className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white/10 text-white hover:bg-primary-main hover:-translate-y-[3px] transition-all duration-200">
              <Facebook size={16} />
            </a>
            <a href="#" id="social-ig" className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white/10 text-white hover:bg-primary-main hover:-translate-y-[3px] transition-all duration-200">
              <Instagram size={16} />
            </a>
            <a href="#" id="social-tw" className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white/10 text-white hover:bg-primary-main hover:-translate-y-[3px] transition-all duration-200">
              <Twitter size={16} />
            </a>
          </div>
        </div>

        {/* Links Group */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
          {/* Column 1 - Shop */}
          <div className="flex flex-col gap-6">
            <h4 className="font-poppins font-bold text-white text-lg">Shop</h4>
            <div className="flex flex-col gap-3">
              <Link to="/search" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">All Products</Link>
              <Link to="/search?sort=discount" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Deals</Link>
              <Link to="/search?sort=newest" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">New Arrivals</Link>
              <Link to="/search?sort=bestseller" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Best Sellers</Link>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="flex flex-col gap-6">
            <h4 className="font-poppins font-bold text-white text-lg">Quick Links</h4>
            <div className="flex flex-col gap-3">
              <Link to="/cart" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Cart</Link>
              <Link to="/wishlist" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Wishlist</Link>
              <Link to="/orders" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">My Orders</Link>
              <Link to="/notifications" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Notifications</Link>
            </div>
          </div>

          {/* Column 3 - Support */}
          <div className="flex flex-col gap-6">
            <h4 className="font-poppins font-bold text-white text-lg">Support</h4>
            <div className="flex flex-col gap-3">
              <Link to="/orders" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Track Order</Link>
              <Link to="/orders" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Returns</Link>
              <Link to="/profile" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">My Profile</Link>
              <a href="#" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Help Center</a>
              <a href="#" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Contact Us</a>
            </div>
          </div>

          {/* Column 4 - Account & More */}
          <div className="flex flex-col gap-6">
            <h4 className="font-poppins font-bold text-white text-lg">Account</h4>
            <div className="flex flex-col gap-3">
              <Link to="/profile" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">My Account</Link>
              <Link to="/checkout" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Checkout</Link>
              <a href="http://localhost:3100" target="_blank" rel="noopener noreferrer" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Seller Portal</a>
              <a href="http://localhost:3200" target="_blank" rel="noopener noreferrer" className="font-inter text-white/60 hover:text-white text-[15px] transition-colors">Admin Panel</a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-7 text-center">
        <p className="font-inter text-white/40 text-sm">
          © 2026 ShopYNG. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
