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
export const getPayoutsByVendor = async (vendorId: string, limit = 20) => {
  const snapshot = await col().where('vendorId', '==', vendorId).get();
  let payouts = fromQuery<Payout>(snapshot);
  payouts.sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
    const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
    return bTime - aTime;
  });
  return payouts.slice(0, limit);
};
export const getPendingPayouts = async () =>
  fromQuery<Payout>(await col().where('status', '==', 'pending').get()).sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
    const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
    return aTime - bTime;
  });
