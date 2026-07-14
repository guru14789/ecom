import { db, fromDoc, fromQuery, now, arrayUnion } from './client';
import admin from './client';

export interface UserAddress {
  id: string;
  houseNo: string;
  area: string;
  pincode: string;
  landmark?: string;
  city?: string;
  state?: string;
  tag: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}

export interface WalletTransaction {
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  role: 'buyer' | 'vendor' | 'vendor_admin' | 'platform_admin' | 'super_admin';
  vendorId?: string;
  firebaseUid: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  addresses: UserAddress[];
  wishlist?: string[];
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  referralCode: string;
  referredBy?: string;
  referredCount: number;
  fcmToken?: string;
  preferences: {
    language: string;
    currency: string;
    notifications: { email: boolean; sms: boolean; push: boolean };
  };
  lastLoginAt?: FirebaseFirestore.Timestamp;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('users');

export async function getUserById(id: string): Promise<User | null> {
  const snap = await col().doc(id).get();
  return fromDoc<User>(snap);
}

export async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  const snap = await col().where('phoneNumber', '==', phoneNumber).limit(1).get();
  if (snap.empty) return null;
  return fromDoc<User>(snap.docs[0]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const snap = await col().where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  return fromDoc<User>(snap.docs[0]);
}

export async function getUserByFirebaseUid(uid: string): Promise<User | null> {
  // First try direct document lookup (frontend sets doc ID = uid)
  const docSnap = await col().doc(uid).get();
  if (docSnap.exists) return fromDoc<User>(docSnap);

  // Fallback to querying by 'uid' field (frontend convention)
  let querySnap = await col().where('uid', '==', uid).limit(1).get();
  if (!querySnap.empty) return fromDoc<User>(querySnap.docs[0]);

  // Fallback to querying by 'firebaseUid' field (backend convention)
  querySnap = await col().where('firebaseUid', '==', uid).limit(1).get();
  if (!querySnap.empty) return fromDoc<User>(querySnap.docs[0]);

  return null;
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as User;
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  await col().doc(id).update({ ...data, updatedAt: now() });
}

export async function upsertUserByFirebaseUid(
  uid: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User> {
  const existing = await getUserByFirebaseUid(uid);
  if (existing) {
    await updateUser(existing.id, data);
    return { ...existing, ...data } as User;
  }
  return createUser({
    firebaseUid: uid,
    phoneNumber: data.phoneNumber || '',
    email: data.email,
    fullName: data.fullName,
    role: 'buyer',
    isPhoneVerified: !!data.phoneNumber,
    isEmailVerified: !!data.email,
    addresses: [],
    walletBalance: 0,
    walletTransactions: [],
    referralCode: uid.slice(0, 8).toUpperCase(),
    referredCount: 0,
    isActive: true,
    preferences: {
      language: 'en',
      currency: 'INR',
      notifications: { email: true, sms: true, push: true },
    },
    ...data,
  });
}

export async function addAddress(userId: string, address: UserAddress): Promise<void> {
  await col().doc(userId).update({ addresses: arrayUnion(address), updatedAt: now() });
}

export async function updateWallet(userId: string, amount: number, reason: string): Promise<void> {
  const type = amount >= 0 ? 'credit' : 'debit';
  const txn: WalletTransaction = { amount: Math.abs(amount), type, reason, createdAt: now() as FirebaseFirestore.Timestamp };
  await col().doc(userId).update({
    walletBalance: admin.firestore.FieldValue.increment(amount),
    walletTransactions: arrayUnion(txn),
    updatedAt: now(),
  });
}

export async function setFcmToken(userId: string, token: string): Promise<void> {
  await col().doc(userId).update({ fcmToken: token, updatedAt: now() });
}

export async function listUsers(opts: {
  role?: string;
  isActive?: boolean;
  limit?: number;
  startAfter?: string;
}): Promise<User[]> {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.role) q = q.where('role', '==', opts.role);
  if (opts.isActive !== undefined) q = q.where('isActive', '==', opts.isActive);
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  q = q.limit(opts.limit || 20);
  return fromQuery<User>(await q.get());
}
