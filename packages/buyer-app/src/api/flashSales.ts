import { api } from './client';
import { FlashSaleItem } from '../types';

export async function getActiveFlashSales(): Promise<{ data: FlashSaleItem[] }> {
  const response = await api.get('/flash-sales/active');
  return response.data;
}
