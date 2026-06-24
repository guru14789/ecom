import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface ICartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  isGroupBuy: boolean;
  addedAt: Date;
}

export interface ICartSession extends Document<string> {
  _id: string;
  userId: string;
  items: ICartItem[];
  couponCode?: string;
  updatedAt: Date;
}

const CartSchema = new Schema<ICartSession>({
  _id: { type: String, default: () => generateId('cart', 10) },
  userId: { type: String, required: true, unique: true, ref: 'User' },
  items: [{
    productId: String,
    variantId: String,
    quantity: { type: Number, min: 1 },
    isGroupBuy: Boolean,
    addedAt: { type: Date, default: Date.now },
  }],
  couponCode: String,
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true, _id: false });

CartSchema.index({ userId: 1 }, { unique: true });
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export const CartSession = mongoose.model<ICartSession>('CartSession', CartSchema);
