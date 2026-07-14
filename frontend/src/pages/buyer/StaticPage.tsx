import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

export const StaticPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'page';
  
  // Format path to title (e.g., 'shipping-policies' -> 'Shipping Policies')
  const title = path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{title}</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We are currently working hard to bring you the <span className="font-bold text-gray-700">{title}</span> page. Please check back later!
        </p>
        <Link to="/" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-orange-500/20">
          Return to Home
        </Link>
      </div>
    </div>
  );
};
