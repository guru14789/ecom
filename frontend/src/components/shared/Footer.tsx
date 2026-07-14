import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield } from 'lucide-react';
import logo from '../../assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="hidden md:block bg-blue-950 text-blue-100/70 mt-auto">
      {/* Back to top */}
      <div 
        className="bg-blue-900/80 hover:bg-blue-800 text-blue-50 text-center py-4 cursor-pointer text-sm font-bold transition-colors"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Back to top
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-4 gap-8">
          
          {/* Column 1 */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base">Get to Know Us</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-orange-400 hover:underline transition-colors">About shopyng</Link></li>
              <li><Link to="/careers" className="hover:text-orange-400 hover:underline transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-orange-400 hover:underline transition-colors">Blog</Link></li>
              <li><Link to="/press" className="hover:text-orange-400 hover:underline transition-colors">Press Releases</Link></li>
              <li><Link to="/investors" className="hover:text-orange-400 hover:underline transition-colors">Investor Relations</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base">Make Money with Us</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/vendor/register" className="hover:text-orange-400 hover:underline transition-colors">Sell on shopyng</Link></li>
              <li><Link to="/accelerator" className="hover:text-orange-400 hover:underline transition-colors">Sell under shopyng Accelerator</Link></li>
              <li><Link to="/brand-protection" className="hover:text-orange-400 hover:underline transition-colors">Protect and Build Your Brand</Link></li>
              <li><Link to="/affiliate" className="hover:text-orange-400 hover:underline transition-colors">Become an Affiliate</Link></li>
              <li><Link to="/fbe" className="hover:text-orange-400 hover:underline transition-colors">Fulfilment by shopyng</Link></li>
              <li><Link to="/advertise" className="hover:text-orange-400 hover:underline transition-colors">Advertise Your Products</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base">shopyng Payment Products</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/business-card" className="hover:text-green-400 hover:underline transition-colors">shopyng Business Card</Link></li>
              <li><Link to="/shop-with-points" className="hover:text-green-400 hover:underline transition-colors">Shop with Points</Link></li>
              <li><Link to="/reload-balance" className="hover:text-green-400 hover:underline transition-colors">Reload Your Balance</Link></li>
              <li><Link to="/currency-converter" className="hover:text-green-400 hover:underline transition-colors">shopyng Currency Converter</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="text-white font-bold mb-4 text-base">Let Us Help You</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/profile" className="hover:text-orange-400 hover:underline transition-colors">Your Account</Link></li>
              <li><Link to="/orders" className="hover:text-orange-400 hover:underline transition-colors">Your Orders</Link></li>
              <li><Link to="/shipping-policies" className="hover:text-orange-400 hover:underline transition-colors">Shipping Rates & Policies</Link></li>
              <li><Link to="/returns-policy" className="hover:text-orange-400 hover:underline transition-colors">Returns & Replacements</Link></li>
              <li><Link to="/manage-devices" className="hover:text-orange-400 hover:underline transition-colors">Manage Your Content and Devices</Link></li>
              <li><Link to="/help" className="hover:text-orange-400 hover:underline transition-colors">Help</Link></li>
              <li className="pt-2"><Link to="/admin" className="text-blue-300 hover:text-white hover:underline transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Admin Login</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section with Logo and Language/Currency */}
      <div className="border-t border-blue-900 py-8 bg-blue-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="shopyng" className="h-16 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
          </Link>

          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <button className="flex items-center gap-2 border border-blue-800 rounded px-3 py-2 text-blue-200 hover:border-orange-500 hover:text-orange-400 transition-colors">
              <Globe className="w-4 h-4" />
              <span>English</span>
            </button>
            
            <button className="flex items-center gap-2 border border-blue-800 rounded px-3 py-2 text-blue-200 hover:border-green-500 hover:text-green-400 transition-colors">
              <span className="font-bold">₹</span>
              <span>INR - Indian Rupee</span>
            </button>

            <button className="flex items-center gap-2 border border-blue-800 rounded px-3 py-2 text-blue-200 hover:border-orange-500 hover:text-orange-400 transition-colors">
              <span>🇮🇳 India</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="bg-[#0b1120] py-5 text-center text-xs text-blue-300/50 border-t border-blue-900/50">
        <div className="flex justify-center gap-6 mb-2">
          <Link to="/terms" className="hover:underline">Conditions of Use & Sale</Link>
          <Link to="/privacy" className="hover:underline">Privacy Notice</Link>
          <Link to="/ads" className="hover:underline">Interest-Based Ads</Link>
        </div>
        <p>© {new Date().getFullYear()}, shopyng.com, Inc. or its affiliates</p>
      </div>
    </footer>
  );
};
