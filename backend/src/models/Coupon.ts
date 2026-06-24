import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'platform' | 'vendor';
  discountType: 'percent' | 'flat';
  discountValue: number;
  minCartValue: number;
  maxDiscount?: number;
  maxUses: number;
  maxUsesPerUser: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  vendorId?: string;
  applicableCategories: string[];
  applicableProducts: string[];
  firstOrderOnly: boolean;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  type: { type: String, enum: ['platform', 'vendor'], default: 'platform' },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  minCartValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  maxUses: { type: Number, default: 1000 },
  maxUsesPerUser: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  vendorId: { type: String, ref: 'Vendor', index: true },
  applicableCategories: [String],
  applicableProducts: [String],
  firstOrderOnly: { type: Boolean, default: false },
  description: String,
  createdBy: { type: String, required: true },
}, { timestamps: true });

CouponSchema.index({ code: 1, isActive: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
