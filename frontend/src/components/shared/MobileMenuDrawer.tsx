import React, { useState } from 'react';
import { X, User, ChevronRight, ChevronDown, Package, Heart, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CATEGORY_DATA } from '../../data/categories';
import type { CategoryNode } from '../../types';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleCat = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCategoryNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.subcategories && node.subcategories.length > 0;
    const isExpanded = !!expandedCats[node.id];

    return (
      <div key={node.id} className="w-full">
        <div 
          className={`flex items-center justify-between py-3 px-4 border-b border-gray-50 ${depth === 0 ? 'font-bold text-gray-900 bg-gray-50/50' : 'text-gray-700 text-sm'}`}
          style={{ paddingLeft: `${(depth + 1) * 16}px` }}
          onClick={() => hasChildren ? toggleCat(node.id) : onClose()}
        >
          {hasChildren ? (
            <span className="flex-1">{node.name}</span>
          ) : (
            <Link to={`/category/${node.slug}`} className="flex-1 block">{node.name}</Link>
          )}
          
          {hasChildren && (
            <button className="p-1">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="bg-white">
            {node.subcategories!.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 z-[70] w-4/5 max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        
        {/* Header / Profile section */}
        <div className="bg-secondary text-secondary-foreground p-6 pb-8 rounded-br-[3rem] relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              {user ? (
                <>
                  <h2 className="font-bold text-lg">{user.displayName || 'Hello!'}</h2>
                  <Link to="/profile" onClick={onClose} className="text-sm opacity-80 hover:underline">View Profile</Link>
                </>
              ) : (
                <>
                  <h2 className="font-bold text-lg">Welcome!</h2>
                  <Link to="/profile" onClick={onClose} className="text-sm font-medium hover:underline">Login / Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex px-4 py-6 gap-2 border-b border-gray-100">
          <Link to="/profile/orders" onClick={onClose} className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 shadow-sm hover:border-primary transition-colors">
            <Package className="w-6 h-6 text-primary mb-2" />
            <span className="text-[11px] font-bold text-gray-700">Orders</span>
          </Link>
          <Link to="/profile/wishlist" onClick={onClose} className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 shadow-sm hover:border-primary transition-colors">
            <Heart className="w-6 h-6 text-primary mb-2" />
            <span className="text-[11px] font-bold text-gray-700">Wishlist</span>
          </Link>
          <Link to="/offers" onClick={onClose} className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 shadow-sm hover:border-primary transition-colors">
            <Tag className="w-6 h-6 text-primary mb-2" />
            <span className="text-[11px] font-bold text-gray-700">Offers</span>
          </Link>
        </div>

        {/* Categories Accordion */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="px-4 py-4 font-black text-gray-900 uppercase text-xs tracking-wider">All Categories</h3>
          <div className="pb-10">
            {CATEGORY_DATA.map(cat => renderCategoryNode(cat, 0))}
          </div>
        </div>
      </div>
    </>
  );
};
