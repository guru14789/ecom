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
  
  const handleAddItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      addItem(product);
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
      <div className="aspect-square bg-white rounded-lg mb-4 flex items-center justify-center p-2 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="object-contain w-full h-full" 
            loading="lazy"
          />
        ) : (
          <div className="text-5xl opacity-10 drop-shadow-sm">🥦</div>
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
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center text-[10px] font-bold text-secondary bg-secondary/10 px-1 rounded-sm">
            {product.rating} ★
          </div>
          <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
        </div>
        
        <div className="mt-auto flex items-end justify-between pt-1 relative h-10">
          <div className="flex flex-col justify-end h-full">
            {product.discountPercent > 0 && (
              <span className="text-[11px] text-gray-400 line-through decoration-gray-300">
                ₹{product.mrp}
              </span>
            )}
            <span className="font-bold text-gray-900 text-[15px] leading-none">
              ₹{product.price}
            </span>
          </div>

          {/* Add to Cart Action */}
          <div className="absolute right-0 bottom-0 h-9 w-[76px]">
            {quantityInCart === 0 ? (
              <button 
                onClick={handleAddItem}
                className="w-full h-full border border-primary bg-white text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-black shadow-sm transition-all duration-200 uppercase tracking-wide"
              >
                Add
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-between bg-primary text-primary-foreground rounded-lg overflow-hidden shadow-md transition-all duration-200 scale-105">
                <button 
                  onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, quantityInCart - 1); }}
                  className="w-1/3 flex items-center justify-center h-full hover:bg-primary/90 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5 stroke-[3]" />
                </button>
                <span className="w-1/3 text-xs font-black text-center">{quantityInCart}</span>
                <button 
                  onClick={handleAddItem}
                  className="w-1/3 flex items-center justify-center h-full hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
