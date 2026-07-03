import { db, fromDoc, fromQuery, now, increment } from './client';

export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  vendorId?: string;
  usageLimit?: number;
  usedCount: number;
  validFrom: FirebaseFirestore.Timestamp;
  validTo: FirebaseFirestore.Timestamp;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('coupons');

export const getCouponByCode = async (code: string) => {
  const snap = await col().where('code', '==', code.toUpperCase()).where('isActive', '==', true).limit(1).get();
  return snap.empty ? null : fromDoc<Coupon>(snap.docs[0]);
};
export const createCoupon = async (data: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>) => {
  const ref = col().doc();
  await ref.set({ ...data, usedCount: 0, code: data.code.toUpperCase(), createdAt: now() });
  return { id: ref.id, ...data, usedCount: 0 } as Coupon;
};
export const incrementCouponUsage = (id: string) => col().doc(id).update({ usedCount: increment(1) });
export const listCoupons = async (vendorId?: string) => {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (vendorId) q = q.where('vendorId', '==', vendorId);
  return fromQuery<Coupon>(await q.limit(50).get());
};
