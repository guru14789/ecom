import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (
    product: Product,
    quantity?: number,
    selectedVariant?: CartItem['selectedVariant'],
    isSubscription?: boolean,
    subscriptionFrequency?: CartItem['subscriptionFrequency']
  ) => void;
  removeItem: (productId: string, variantId?: string, isSubscription?: boolean) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string, isSubscription?: boolean) => void;
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
      
      addItem: (product, quantity = 1, selectedVariant, isSubscription, subscriptionFrequency) => {
        set((state) => {
          if (state.items.length > 0) {
            const currentVendorId = state.items[0].product.vendorId;
            if (currentVendorId && product.vendorId && currentVendorId !== product.vendorId) {
              throw new Error('You can only order from one vendor at a time. Please clear your cart to add this item.');
            }
          }

          const existingItem = state.items.find(item => 
            item.product.id === product.id && 
            item.selectedVariant?.id === selectedVariant?.id &&
            item.isSubscription === isSubscription
          );
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                (item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id && item.isSubscription === isSubscription)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isOpen: true,
            };
          }
          
          return {
            items: [...state.items, { product, quantity, selectedVariant, isSubscription, subscriptionFrequency }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, variantId, isSubscription) => {
        set((state) => ({
          items: state.items.filter(item => !(item.product.id === productId && item.selectedVariant?.id === variantId && item.isSubscription === isSubscription))
        }));
      },

      updateQuantity: (productId, quantity, variantId, isSubscription) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId, isSubscription);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            (item.product.id === productId && item.selectedVariant?.id === variantId && item.isSubscription === isSubscription) ? { ...item, quantity } : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.selectedVariant ? item.selectedVariant.price : item.product.price;
          const price = item.isSubscription && item.product.subscriptionDiscount 
            ? basePrice * (1 - item.product.subscriptionDiscount / 100)
            : basePrice;
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
