import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '../../types';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ product: Product; quantity?: number; isGroupBuy?: boolean }>) => {
      const { product, quantity = 1, isGroupBuy = false } = action.payload;
      const existingItem = state.items.find(
        (item) => item.product.id === product.id && item.isGroupBuy === isGroupBuy
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ product, quantity, isGroupBuy });
      }
    },
    removeItem: (state, action: PayloadAction<{ productId: number; isGroupBuy: boolean }>) => {
      const { productId, isGroupBuy } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.product.id === productId && item.isGroupBuy === isGroupBuy)
      );
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: number; isGroupBuy: boolean; quantity: number }>
    ) => {
      const { productId, isGroupBuy, quantity } = action.payload;
      const item = state.items.find(
        (item) => item.product.id === productId && item.isGroupBuy === isGroupBuy
      );
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
