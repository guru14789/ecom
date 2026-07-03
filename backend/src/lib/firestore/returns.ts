import { db, fromDoc, fromQuery, now } from './client';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  vendorId: string;
  items: { productId: string; quantity: number; reason: string }[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  refundAmount?: number;
  adminNote?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('return_requests');
export const createReturn = async (data: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as ReturnRequest;
};
export const getReturnById = (id: string) => fromDoc<ReturnRequest>(col().doc(id).get() as any);
export const updateReturn = (id: string, data: Partial<ReturnRequest>) => col().doc(id).update({ ...data, updatedAt: now() });
export const listReturnsByUser = async (userId: string) =>
  fromQuery<ReturnRequest>(await col().where('userId', '==', userId).orderBy('createdAt', 'desc').get());
export const listReturnsByVendor = async (vendorId: string) =>
  fromQuery<ReturnRequest>(await col().where('vendorId', '==', vendorId).orderBy('createdAt', 'desc').get());
