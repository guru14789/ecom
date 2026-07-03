import { db, fromDoc, fromQuery, now } from './client';

export interface Campaign {
  id: string;
  name: string;
  type: 'banner' | 'discount' | 'email' | 'push';
  status: 'draft' | 'active' | 'ended';
  startDate: FirebaseFirestore.Timestamp;
  endDate: FirebaseFirestore.Timestamp;
  createdBy: string;
  targetVendorIds?: string[];
  config: Record<string, unknown>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('campaigns');
export const getCampaignById = (id: string) => fromDoc<Campaign>(col().doc(id).get() as any);
export const createCampaign = async (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as Campaign;
};
export const updateCampaign = (id: string, data: Partial<Campaign>) => col().doc(id).update({ ...data, updatedAt: now() });
export const deleteCampaign = (id: string) => col().doc(id).delete();
export const listCampaigns = async (status?: string) => {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (status) q = q.where('status', '==', status);
  return fromQuery<Campaign>(await q.limit(50).get());
};
