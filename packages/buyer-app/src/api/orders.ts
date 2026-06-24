import { api, PaginatedResponse } from './client';
import { Order } from '../types';

export interface CreateOrderParams {
  cartId?: string;
  addressId: string;
  paymentMethod: string;
  paymentReference?: string;
  couponCode?: string;
}

export async function getOrders(params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Order>> {
  const response = await api.get('/orders', { params });
  return response.data;
}

export async function getOrderById(id: string): Promise<{ data: Order }> {
  const response = await api.get(`/orders/${id}`);
  return response.data;
}

export async function createOrder(params: CreateOrderParams): Promise<{ success: boolean; data: Order }> {
  const response = await api.post('/orders', params);
  return response.data;
}

export async function cancelOrder(id: string): Promise<{ success: boolean; data: Order }> {
  const response = await api.post(`/orders/${id}/cancel`);
  return response.data;
}

export async function returnOrder(id: string): Promise<{ success: boolean; data: Order }> {
  const response = await api.post(`/orders/${id}/return`);
  return response.data;
}

export async function getInvoice(id: string) {
  const response = await api.get(`/orders/${id}/invoice`);
  return response.data;
}
