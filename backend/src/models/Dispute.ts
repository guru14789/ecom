import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IDisputeMessage {
  _id: string;
  userId: string;
  userRole: 'buyer' | 'vendor' | 'admin';
  message: string;
  attachments: string[];
  createdAt: Date;
}

export interface IDispute extends Document<string> {
  _id: string;
  returnRequestId: string;
  orderId: string;
  raisedBy: string;
  raisedByRole: 'buyer' | 'vendor';
  againstId: string;
  reason: string;
  detail: string;
  evidence: string[];
  messages: IDisputeMessage[];
  status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_vendor' | 'partial_refund' | 'closed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeMessageSchema = new Schema<IDisputeMessage>({
  _id: { type: String, default: () => generateId('dmsg', 8) },
  userId: { type: String, required: true },
  userRole: { type: String, enum: ['buyer', 'vendor', 'admin'], required: true },
  message: { type: String, required: true },
  attachments: [String],
  createdAt: { type: Date, default: Date.now },
});

const DisputeSchema = new Schema<IDispute>({
  _id: { type: String, default: () => generateId('disp', 12) },
  returnRequestId: { type: String, ref: 'ReturnRequest', index: true },
  orderId: { type: String, required: true, ref: 'Order', index: true },
  raisedBy: { type: String, required: true },
  raisedByRole: { type: String, enum: ['buyer', 'vendor'], required: true },
  againstId: { type: String, required: true },
  reason: { type: String, required: true },
  detail: { type: String, maxlength: 5000 },
  evidence: [String],
  messages: [DisputeMessageSchema],
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved_buyer', 'resolved_vendor', 'partial_refund', 'closed'],
    default: 'open',
    index: true,
  },
  resolution: String,
  resolvedBy: String,
  resolvedAt: Date,
}, { timestamps: true, _id: false });

DisputeSchema.index({ status: 1, createdAt: -1 });

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
