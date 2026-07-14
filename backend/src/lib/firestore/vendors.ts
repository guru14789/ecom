import { db, fromDoc, fromQuery, now } from './client';
import admin from './client';

export type RegistrationStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

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

export interface VendorAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  businessName: string;
  email: string;
  phoneNumber: string;
  // Tax & Legal
  gstin?: string;
  pan?: string;
  vatNumber?: string;
  // Registration workflow
  registrationStatus: RegistrationStatus;
  onboardingStep: number; // 1-6
  rejectionReason?: string;
  suspendedAt?: FirebaseFirestore.Timestamp;
  suspendedReason?: string;
  approvedAt?: FirebaseFirestore.Timestamp;
  approvedBy?: string;
  
  // Verification & Trust (New Revamp)
  trustScore?: number;
  mobileVerified?: boolean;
  gstVerified?: boolean;
  gstBusinessName?: string;
  panVerified?: boolean;
  bankVerified?: boolean;
  accountHolderName?: string;
  digilockerVerified?: boolean;
  verificationAuditLogs?: Array<{ action: string, timestamp: string, status: string }>;

  // KYC (Legacy/Hybrid)
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments?: Record<string, string>; // docType → URL
  brandAuthorization?: string[]; // doc URLs
  approvedCategories?: string[];
  // Staff Roles
  staff?: Array<{ userId: string; role: 'admin' | 'staff'; email: string; name: string }>;
  // Store identity
  storeSlug?: string;
  logo?: string;
  banner?: string;
  description?: string;
  // Bank & Payouts
  bankDetails: BankDetails;
  // Addresses
  address?: VendorAddress;       // Primary / store address
  pickupAddress?: VendorAddress;
  returnAddress?: VendorAddress;
  warehouseAddress?: VendorAddress;
  // Business config
  deliveryRadiusKm?: number;
  minOrderValue?: number;
  isOpen: boolean;
  operatingHours?: Record<string, { open: string; close: string }>;
  // Status & metrics
  verified: boolean;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  followers?: number;
  commissionRate?: number; // override per vendor (decimal, e.g. 0.1 = 10%)
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
  await col().doc(vendorId).update({
    totalOrders: admin.firestore.FieldValue.increment(1),
    totalRevenue: admin.firestore.FieldValue.increment(revenue),
    updatedAt: now(),
  });
}

export async function getVendorBySlug(storeSlug: string): Promise<Vendor | null> {
  const snap = await col().where('storeSlug', '==', storeSlug).limit(1).get();
  return snap.empty ? null : fromDoc<Vendor>(snap.docs[0]);
}

export async function updateVendorRegistrationStatus(
  vendorId: string,
  status: RegistrationStatus,
  opts?: { rejectionReason?: string; suspendedReason?: string; approvedBy?: string }
): Promise<void> {
  const update: Partial<Vendor> = { registrationStatus: status };
  if (status === 'rejected' && opts?.rejectionReason) update.rejectionReason = opts.rejectionReason;
  if (status === 'suspended' && opts?.suspendedReason) {
    update.suspendedReason = opts.suspendedReason;
    (update as any).suspendedAt = now();
  }
  if (status === 'approved') {
    update.isActive = true;
    update.verified = true;
    if (opts?.approvedBy) update.approvedBy = opts.approvedBy;
    (update as any).approvedAt = now();
  }
  await updateVendor(vendorId, update);
}

export async function listVendorsByStatus(
  registrationStatus: RegistrationStatus,
  limit = 20
): Promise<Vendor[]> {
  const snap = await col()
    .where('registrationStatus', '==', registrationStatus)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return fromQuery<Vendor>(snap);
}

export async function incrementVendorFollowers(vendorId: string, delta: 1 | -1): Promise<void> {
  await col().doc(vendorId).update({
    followers: admin.firestore.FieldValue.increment(delta),
    updatedAt: now(),
  });
}
