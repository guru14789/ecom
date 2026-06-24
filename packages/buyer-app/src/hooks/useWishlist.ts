import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleWishlist, addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToast } from '../store/slices/uiSlice';
import { Product } from '../types';

export function useWishlist(productId?: number) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = productId !== undefined
    ? items.some((item) => item.product.id === productId)
    : false;

  const toggle = useCallback((product: Product) => {
    dispatch(toggleWishlist(product));
    const wasAdded = !items.some((i) => i.product.id === product.id);
    dispatch(addToast({
      title: wasAdded ? 'Added to Wishlist' : 'Removed from Wishlist',
      message: product.name,
      type: wasAdded ? 'success' : 'info',
    }));
  }, [dispatch, items]);

  const add = useCallback((product: Product) => {
    dispatch(addToWishlist(product));
    dispatch(addToast({ title: 'Added to Wishlist', message: product.name, type: 'success' }));
  }, [dispatch]);

  const remove = useCallback((productId: number) => {
    dispatch(removeFromWishlist(productId));
  }, [dispatch]);

  return { items, isWishlisted, toggle, add, remove };
}
