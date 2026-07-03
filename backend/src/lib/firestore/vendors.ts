import { db, fromDoc, fromQuery, now } from './client';

export interface SubscriptionTier {
  tier: 'basic' | 'pro' | 'enterprise';
  price: number;
  productLimit: number;
  status: 'active' | 'expired' | 'cancelled';
  startedAt: FirebaseFirestore.Timestamp;
  expiresAt?: FirebaseFirestore.Timestamp;
}

export interface BankDetails {
  accountNo?: string;
  ifsc?: string;
  upiId?: string;
  beneficiaryName?: string;
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  businessName: string;
  email: string;
  phoneNumber: string;
  gstin?: string;
  pan?: string;
  bankDetails: BankDetails;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments?: Record<string, string>;
  verified: boolean;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  logo?: string;
  banner?: string;
  description?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
  };
  deliveryRadiusKm?: number;
  minOrderValue?: number;
  isOpen: boolean;
  operatingHours?: Record<string, { open: string; close: string }>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('vendors');

export async function getVendorById(id: string): Promise<Vendor | null> {
  return fromDoc<Vendor>(await col().doc(id).get());
}

export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  const snap = await col().where('userId', '==', userId).limit(1).get();
  return snap.empty ? null : fromDoc<Vendor>(snap.docs[0]);
}

export async function createVendor(data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as Vendor;
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<void> {
  await col().doc(id).update({ ...data, updatedAt: now() });
}

export async function listVendors(opts: {
  kycStatus?: string;
  isActive?: boolean;
  limit?: number;
  startAfter?: string;
}): Promise<Vendor[]> {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.kycStatus) q = q.where('kycStatus', '==', opts.kycStatus);
  if (opts.isActive !== undefined) q = q.where('isActive', '==', opts.isActive);
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  return fromQuery<Vendor>(await q.limit(opts.limit || 20).get());
}

// ─── Subscription (subcollection) ─────────────────────────────────────────────
export async function getSubscription(vendorId: string): Promise<SubscriptionTier | null> {
  const snap = await col().doc(vendorId).collection('subscription').doc('current').get();
  return snap.exists ? (snap.data() as SubscriptionTier) : null;
}

export async function setSubscription(vendorId: string, tier: SubscriptionTier): Promise<void> {
  await col().doc(vendorId).collection('subscription').doc('current').set(tier);
}

export async function incrementVendorStats(
  vendorId: string,
  revenue: number
): Promise<void> {
  const admin = require('firebase-admin');
  await col().doc(vendorId).update({
    totalOrders: admin.firestore.FieldValue.increment(1),
    totalRevenue: admin.firestore.FieldValue.increment(revenue),
    updatedAt: now(),
  });
}
