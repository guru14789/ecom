import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem, removeItem, updateQuantity, clearCart } from '../store/slices/cartSlice';
import { setCartOpen, setLoginModalOpen, setPendingAction, addToast } from '../store/slices/uiSlice';
import { Product } from '../types';

export function useCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);

  const addToCart = useCallback((product: Product, quantity = 1, isGroupBuy = false) => {
    if (!user?.isLoggedIn) {
      dispatch(setPendingAction({ type: 'cart', productId: product.id }));
      dispatch(setLoginModalOpen(true));
      return;
    }
    dispatch(addItem({ product, quantity, isGroupBuy }));
    dispatch(addToast({ title: 'Added to cart!', message: product.name, type: 'success' }));
    dispatch(setCartOpen(true));
  }, [dispatch, user]);

  const removeFromCart = useCallback((productId: number, isGroupBuy = false) => {
    dispatch(removeItem({ productId, isGroupBuy }));
  }, [dispatch]);

  const changeQuantity = useCallback((productId: number, isGroupBuy: boolean, quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeItem({ productId, isGroupBuy }));
      return;
    }
    dispatch(updateQuantity({ productId, isGroupBuy, quantity }));
  }, [dispatch]);

  const openCart = useCallback(() => {
    if (!user?.isLoggedIn) {
      dispatch(setPendingAction({ type: 'cart', productId: 0 }));
      dispatch(setLoginModalOpen(true));
      return;
    }
    dispatch(setCartOpen(true));
  }, [dispatch, user]);

  const clearAll = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => {
    const price = item.isGroupBuy ? item.product.groupPrice : item.product.price;
    return acc + price * item.quantity;
  }, 0);

  return {
    items,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    changeQuantity,
    openCart,
    clearAll,
  };
}
