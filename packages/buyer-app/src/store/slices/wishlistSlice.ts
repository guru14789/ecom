import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WishlistItem, Product } from '../../types';

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<Product>) => {
      const exists = state.items.find((i) => i.product.id === action.payload.id);
      if (!exists) {
        state.items.push({ product: action.payload, addedAt: new Date().toISOString() });
      }
    },
    removeFromWishlist: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
    },
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const idx = state.items.findIndex((i) => i.product.id === action.payload.id);
      if (idx >= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items.push({ product: action.payload, addedAt: new Date().toISOString() });
      }
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const { addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;
