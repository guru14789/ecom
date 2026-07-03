import { db, fromDoc, fromQuery, now } from './client';

export interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  vendorId: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  adminNote?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('disputes');
export const createDispute = async (data: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as Dispute;
};
export const getDisputeById = (id: string) => fromDoc<Dispute>(col().doc(id).get() as any);
export const updateDispute = (id: string, data: Partial<Dispute>) => col().doc(id).update({ ...data, updatedAt: now() });
export const listDisputes = async (opts: { status?: string; limit?: number }) => {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.status) q = q.where('status', '==', opts.status);
  return fromQuery<Dispute>(await q.limit(opts.limit || 20).get());
};
