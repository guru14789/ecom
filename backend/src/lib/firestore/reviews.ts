import { db, fromQuery, now, increment } from './client';

export interface Review {
  id: string;
  productId: string;
  vendorId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment?: string;
  images?: string[];
  vendorReply?: string;
  isVerifiedPurchase: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('reviews');

export const createReview = async (data: Omit<Review, 'id' | 'createdAt'>) => {
  const ref = col().doc();
  await ref.set({ ...data, createdAt: now() });
  return { id: ref.id, ...data } as Review;
};
export const getProductReviews = async (productId: string, limit = 20) =>
  fromQuery<Review>(await col().where('productId', '==', productId).orderBy('createdAt', 'desc').limit(limit).get());
export const getVendorReviews = async (vendorId: string, limit = 20) =>
  fromQuery<Review>(await col().where('vendorId', '==', vendorId).orderBy('createdAt', 'desc').limit(limit).get());
export const replyToReview = (id: string, reply: string) => col().doc(id).update({ vendorReply: reply });
