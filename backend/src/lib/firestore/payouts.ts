import { db, fromDoc, fromQuery, now } from './client';

export interface Payout {
  id: string;
  vendorId: string;
  amount: number;
  razorpayPayoutId?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  periodStart: FirebaseFirestore.Timestamp;
  periodEnd: FirebaseFirestore.Timestamp;
  paidAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('payouts');
export const createPayout = async (data: Omit<Payout, 'id' | 'createdAt'>) => {
  const ref = col().doc();
  await ref.set({ ...data, createdAt: now() });
  return { id: ref.id, ...data } as Payout;
};
export const updatePayout = (id: string, data: Partial<Payout>) => col().doc(id).update(data);
export const getPayoutsByVendor = async (vendorId: string, limit = 20) =>
  fromQuery<Payout>(await col().where('vendorId', '==', vendorId).orderBy('createdAt', 'desc').limit(limit).get());
export const getPendingPayouts = async () =>
  fromQuery<Payout>(await col().where('status', '==', 'pending').orderBy('createdAt').get());
