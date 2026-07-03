import React, { useState } from 'react';
import { CATEGORY_DATA } from '../../data/categories';
import { ChevronRight, Smartphone, Shirt, Home, ShoppingCart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const ICON_MAP: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-5 h-5" />,
  'Shirt': <Shirt className="w-5 h-5" />,
  'Home': <Home className="w-5 h-5" />,
  'ShoppingCart': <ShoppingCart className="w-5 h-5" />,
  'Sparkles': <Sparkles className="w-5 h-5" />,
};

interface MegaMenuProps {
  onClose?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_DATA[0]);

  return (
    <div className="absolute top-full left-0 w-[800px] bg-white border border-gray-100 shadow-2xl rounded-b-xl z-50 flex overflow-hidden max-h-[600px] animate-in slide-in-from-top-2 duration-200">
      
      {/* Left Sidebar: Main Categories */}
      <div className="w-1/3 bg-gray-50 border-r border-gray-100 py-4 overflow-y-auto hide-scrollbar">
        {CATEGORY_DATA.map((cat) => (
          <button
            key={cat.id}
            onMouseEnter={() => setActiveCategory(cat)}
            className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
              activeCategory.id === cat.id
                ? 'bg-white text-primary border-l-4 border-l-primary'
                : 'text-gray-700 hover:bg-white hover:text-primary border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {cat.icon && ICON_MAP[cat.icon] ? ICON_MAP[cat.icon] : <div className="w-5 h-5 bg-gray-200 rounded-full" />}
              {cat.name}
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform ${activeCategory.id === cat.id ? 'text-primary' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>

      {/* Right Content Area: Subcategories */}
      <div className="w-2/3 bg-white p-8 overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-6">{activeCategory.name}</h3>
        
        {activeCategory.subcategories && activeCategory.subcategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-8">
            {activeCategory.subcategories.map((subGroup) => (
              <div key={subGroup.id}>
                <Link 
                  to={`/category/${activeCategory.slug}/${subGroup.slug}`}
                  className="font-bold text-gray-900 mb-3 block hover:text-primary transition-colors"
                  onClick={onClose}
                >
                  {subGroup.name}
                </Link>
                
                {subGroup.subcategories && (
                  <ul className="space-y-2">
                    {subGroup.subcategories.map((item) => (
                      <li key={item.id}>
                        <Link 
                          to={`/category/${activeCategory.slug}/${subGroup.slug}/${item.slug}`}
                          className="text-sm text-gray-600 hover:text-primary hover:underline transition-colors block py-0.5"
                          onClick={onClose}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No subcategories available.</div>
        )}
      </div>
    </div>
  );
};
