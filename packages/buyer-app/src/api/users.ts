import { api } from './client';
import { Address } from '../types';

export async function getProfile() {
  const response = await api.get('/users/me');
  return response.data;
}

export async function updateProfile(data: { fullName?: string; email?: string; avatar?: string }) {
  const response = await api.put('/users/me', data);
  return response.data;
}

export async function getAddresses() {
  const response = await api.get('/users/me/addresses');
  return response.data;
}

export async function addAddress(data: Omit<Address, 'id'>) {
  const response = await api.post('/users/me/addresses', data);
  return response.data;
}

export async function updateAddress(id: string, data: Partial<Address>) {
  const response = await api.put(`/users/me/addresses/${id}`, data);
  return response.data;
}

export async function deleteAddress(id: string) {
  const response = await api.delete(`/users/me/addresses/${id}`);
  return response.data;
}

export async function getWishlist() {
  const response = await api.get('/users/me/wishlist');
  return response.data;
}

export async function addToWishlist(productId: string) {
  const response = await api.post(`/users/me/wishlist/${productId}`);
  return response.data;
}

export async function removeFromWishlist(productId: string) {
  const response = await api.delete(`/users/me/wishlist/${productId}`);
  return response.data;
}

export async function getWallet() {
  const response = await api.get('/users/me/wallet');
  return response.data;
}
