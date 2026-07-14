import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // Store product IDs
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  getItemCount: () => number;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId) => {
        const { items } = get();
        if (!items.includes(productId)) {
          set({ items: [...items, productId] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(id => id !== productId) });
      },
      hasItem: (productId) => {
        return get().items.includes(productId);
      },
      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'shopsyy-wishlist',
    }
  )
);
