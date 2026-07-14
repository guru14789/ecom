import { db, fromDoc, fromQuery, now } from './client';

export interface FlashSale {
  id: string;
  title: string;
  banner?: string;
  products: { productId: string; discountPercent: number; stockLimit?: number }[];
  startDate: FirebaseFirestore.Timestamp;
  endDate: FirebaseFirestore.Timestamp;
  isActive: boolean;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('flash_sales');
export const getFlashSaleById = (id: string) => fromDoc<FlashSale>(col().doc(id).get() as any);
export const getActiveFlashSales = async () => {
  const now2 = new Date();
  const snap = await col().where('isActive', '==', true).get();
  const sales = fromQuery<FlashSale>(snap);
  
  // Apply date range filters in-memory to prevent index issues
  return sales.filter(s => {
    const start = s.startDate?.toDate ? s.startDate.toDate() : new Date(0);
    const end = s.endDate?.toDate ? s.endDate.toDate() : new Date(0);
    return start <= now2 && end >= now2;
  });
};
export const createFlashSale = async (data: Omit<FlashSale, 'id' | 'createdAt'>) => {
  const ref = col().doc();
  await ref.set({ ...data, createdAt: now() });
  return { id: ref.id, ...data } as FlashSale;
};
export const updateFlashSale = (id: string, data: Partial<FlashSale>) => col().doc(id).update(data);
