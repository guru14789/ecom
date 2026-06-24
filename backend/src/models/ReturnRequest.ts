import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IReturnRequest extends Document<string> {
  _id: string;
  orderId: string;
  userId: string;
  vendorId: string;
  productId: string;
  quantity: number;
  reason: string;
  detail?: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'item_received' | 'refunded' | 'disputed';
  refundAmount: number;
  refundMethod: 'original' | 'wallet' | 'bank';
  refundReference?: string;
  refundedAt?: Date;
  pickupAddress?: string;
  pickupScheduledAt?: Date;
  pickupCompletedAt?: Date;
  adminNote?: string;
  vendorNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRequestSchema = new Schema<IReturnRequest>({
  _id: { type: String, default: () => generateId('ret', 12) },
  orderId: { type: String, required: true, ref: 'Order', index: true },
  userId: { type: String, required: true, ref: 'User', index: true },
  vendorId: { type: String, required: true, ref: 'Vendor', index: true },
  productId: { type: String, required: true, ref: 'Product' },
  quantity: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  detail: String,
  images: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'pickup_scheduled', 'item_received', 'refunded', 'disputed'],
    default: 'pending',
    index: true,
  },
  refundAmount: { type: Number, default: 0 },
  refundMethod: { type: String, enum: ['original', 'wallet', 'bank'], default: 'original' },
  refundReference: String,
  refundedAt: Date,
  pickupAddress: String,
  pickupScheduledAt: Date,
  pickupCompletedAt: Date,
  adminNote: String,
  vendorNote: String,
}, { timestamps: true, _id: false });

ReturnRequestSchema.index({ vendorId: 1, status: 1 });
ReturnRequestSchema.index({ userId: 1, status: 1 });

export const ReturnRequest = mongoose.model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
