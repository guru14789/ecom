import { api } from './client';

export interface AddCartItemParams {
  productId: string;
  quantity?: number;
  isGroupBuy?: boolean;
  variantId?: string;
}

export async function getCart() {
  const response = await api.get('/cart');
  return response.data;
}

export async function addCartItem(params: AddCartItemParams) {
  const response = await api.post('/cart/items', params);
  return response.data;
}

export async function updateCartItem(productId: string, quantity: number, isGroupBuy = false) {
  const response = await api.put(`/cart/items/${productId}`, { quantity, isGroupBuy });
  return response.data;
}

export async function removeCartItem(productId: string, isGroupBuy = false) {
  const response = await api.delete(`/cart/items/${productId}`, {
    params: { isGroupBuy },
  });
  return response.data;
}

export async function clearCart() {
  const response = await api.delete('/cart');
  return response.data;
}

export async function applyCoupon(code: string) {
  const response = await api.post('/cart/coupon', { code });
  return response.data;
}
