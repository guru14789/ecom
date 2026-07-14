import React from 'react';
import { Hammer, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const VendorComingSoonPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop() || 'Feature';
  
  // Format the path nicely (e.g. bulk-upload -> Bulk Upload)
  const title = path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-orange-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-orange-100">
        <Hammer className="w-10 h-10 text-orange-500 animate-pulse" />
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-blue-950 mb-4 tracking-tight">
        {title} is Coming Soon!
      </h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8 text-base">
        We are working hard to bring you the best <strong>{title}</strong> experience. This feature is currently under active development and will be available in an upcoming release.
      </p>
      
      <Link 
        to="/vendor" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
