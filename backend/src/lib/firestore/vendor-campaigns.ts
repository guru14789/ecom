import { db, fromDoc, fromQuery, now } from './client';

export interface VendorCampaign {
  id: string;
  vendorId: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;   // daily budget in INR
  spent: number;
  clicks: number;
  conversions: number;
  startedAt: FirebaseFirestore.Timestamp;
  endedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('vendor_campaigns');

export async function listVendorCampaigns(vendorId: string): Promise<VendorCampaign[]> {
  const snap = await col()
    .where('vendorId', '==', vendorId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as VendorCampaign[];
}

export async function createVendorCampaign(
  data: Pick<VendorCampaign, 'vendorId' | 'name' | 'budget'>
): Promise<VendorCampaign> {
  const ref = col().doc();
  const payload: Omit<VendorCampaign, 'id'> = {
    vendorId: data.vendorId,
    name: data.name,
    budget: data.budget,
    status: 'active',
    spent: 0,
    clicks: 0,
    conversions: 0,
    startedAt: now() as FirebaseFirestore.Timestamp,
    createdAt: now() as FirebaseFirestore.Timestamp,
    updatedAt: now() as FirebaseFirestore.Timestamp,
  };
  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function updateVendorCampaign(
  id: string,
  data: Partial<Pick<VendorCampaign, 'name' | 'budget' | 'status'>>
): Promise<void> {
  await col().doc(id).update({ ...data, updatedAt: now() });
}

export async function deleteVendorCampaign(id: string): Promise<void> {
  await col().doc(id).delete();
}

export async function getVendorCampaignById(id: string): Promise<VendorCampaign | null> {
  const doc = await col().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as VendorCampaign;
}
