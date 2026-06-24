import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IReviewImage {
  url: string;
  caption?: string;
}

export interface IReview extends Document<string> {
  _id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  title?: string;
  body: string;
  images: IReviewImage[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  helpfulBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  _id: { type: String, default: () => generateId('rev', 12) },
  productId: { type: String, required: true, ref: 'Product', index: true },
  userId: { type: String, required: true, ref: 'User', index: true },
  orderId: { type: String, required: true, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  body: { type: String, required: true, maxlength: 5000 },
  images: [{ url: String, caption: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 },
  helpfulBy: [String],
}, { timestamps: true, _id: false });

ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, rating: -1 });
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
