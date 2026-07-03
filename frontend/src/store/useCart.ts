import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (product: Product, quantity?: number, selectedVariant?: CartItem['selectedVariant']) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      
      addItem: (product, quantity = 1, selectedVariant) => {
        set((state) => {
          if (state.items.length > 0) {
            const currentVendorId = state.items[0].product.vendorId;
            if (currentVendorId !== product.vendorId) {
              throw new Error('You can only order from one vendor at a time. Please clear your cart to add this item.');
            }
          }

          const existingItem = state.items.find(item => 
            item.product.id === product.id && 
            item.selectedVariant?.id === selectedVariant?.id
          );
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                (item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isOpen: true,
            };
          }
          
          return {
            items: [...state.items, { product, quantity, selectedVariant }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(item => !(item.product.id === productId && item.selectedVariant?.id === variantId))
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            (item.product.id === productId && item.selectedVariant?.id === variantId) ? { ...item, quantity } : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.selectedVariant ? item.selectedVariant.price : item.product.price;
          return total + (price * item.quantity);
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'shopsyy-cart',
    }
  )
);
