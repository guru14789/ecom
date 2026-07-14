import React from 'react';
import { Plus, Minus, Clock } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../store/useCart';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [localQuantity, setLocalQuantity] = React.useState(1);
  
  const handleAddItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // If already in cart, update quantity
      if (quantityInCart > 0) {
        updateQuantity(product.id, quantityInCart + localQuantity);
      } else {
        addItem(product, localQuantity);
      }
      setLocalQuantity(1); // Reset after adding
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const cartItem = items.find(item => item.product.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  return (
    <div className="bg-white rounded-[1rem] border border-gray-100 p-3 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group flex flex-col h-full relative cursor-pointer overflow-hidden">
      
      {/* Discount Badge */}
      {product.discountPercent > 0 && (
        <div className="absolute top-0 left-0 z-10 bg-accent text-accent-foreground text-[10px] font-extrabold px-2 py-1 rounded-br-lg shadow-sm">
          {product.discountPercent}% OFF
        </div>
      )}
      
      {/* Image Container */}
      <div className="aspect-square bg-gray-50/50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
            loading="lazy"
          />
        ) : (
          <div className="text-5xl opacity-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-500">🥦</div>
        )}
      </div>

      {/* Delivery Time Tag */}
      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 w-fit px-1.5 py-0.5 rounded mb-1">
        <Clock className="h-3 w-3" />
        10 MINS
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 mt-1">
        {product.brand && (
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            {product.brand}
          </div>
        )}
        <h3 className="font-semibold text-gray-800 text-[13px] leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-[10px] text-gray-400 mb-2">{product.unit}</p>
        
        <div className="font-bold text-gray-900 text-[15px] leading-none mb-3">
          ${product.price}
        </div>
        
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); setLocalQuantity(Math.max(1, localQuantity - 1)); }}
              className="w-6 h-6 flex items-center justify-center rounded bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <Minus className="h-3 w-3 stroke-[3]" />
            </button>
            <span className="text-sm font-bold w-4 text-center">{localQuantity}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setLocalQuantity(localQuantity + 1); }}
              className="w-6 h-6 flex items-center justify-center rounded bg-gray-50 text-primary hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-3 w-3 stroke-[3]" />
            </button>
          </div>

          <button 
            onClick={handleAddItem}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
