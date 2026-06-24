import { api } from './client';
import { ReturnRequest } from '../types';

export async function getReturnRequests(): Promise<{ data: ReturnRequest[] }> {
  const response = await api.get('/returns');
  return response.data;
}

export async function createReturnRequest(data: {
  orderId: string; productId: string; quantity: number; reason: string; detail?: string; images?: string[];
}): Promise<{ data: ReturnRequest }> {
  const response = await api.post('/returns', data);
  return response.data;
}

export async function cancelReturnRequest(returnId: string): Promise<{ data: ReturnRequest }> {
  const response = await api.post(`/returns/${returnId}/cancel`);
  return response.data;
}
