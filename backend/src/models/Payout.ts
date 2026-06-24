import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IPayoutItem {
  orderId: string;
  amount: number;
  commission: number;
  pgFee: number;
  shippingFee: number;
  tds: number;
}

export interface IPayout extends Document<string> {
  _id: string;
  vendorId: string;
  periodStart: Date;
  periodEnd: Date;
  items: IPayoutItem[];
  grossAmount: number;
  totalCommission: number;
  totalPgFee: number;
  totalShippingFee: number;
  totalReturns: number;
  totalTds: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paymentReference?: string;
  paidAt?: Date;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutItemSchema = new Schema<IPayoutItem>({
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  pgFee: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
}, { _id: false });

const PayoutSchema = new Schema<IPayout>({
  _id: { type: String, default: () => generateId('pay', 12) },
  vendorId: { type: String, required: true, ref: 'Vendor', index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  items: [PayoutItemSchema],
  grossAmount: { type: Number, required: true },
  totalCommission: { type: Number, default: 0 },
  totalPgFee: { type: Number, default: 0 },
  totalShippingFee: { type: Number, default: 0 },
  totalReturns: { type: Number, default: 0 },
  totalTds: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending',
    index: true,
  },
  paymentReference: String,
  paidAt: Date,
  invoiceUrl: String,
}, { timestamps: true, _id: false });

PayoutSchema.index({ vendorId: 1, status: 1, createdAt: -1 });

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);
