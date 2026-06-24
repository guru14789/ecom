import mongoose, { Schema, Document } from 'mongoose';
import { generateId, generateShareCode } from '../utils/helpers';

export interface IGroupParticipant {
  userId: string;
  joinedAt: Date;
  orderId?: string;
}

export interface IGroupSession extends Document<string> {
  _id: string;
  productId: string;
  hostUserId: string;
  targetCount: number;
  currentCount: number;
  participants: IGroupParticipant[];
  shareCode: string;
  shareUrl: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  startedAt: Date;
  endsAt: Date;
  completedAt?: Date;
  appliedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSessionSchema = new Schema<IGroupSession>({
  _id: { type: String, default: () => generateId('grp', 12) },
  productId: { type: String, required: true, ref: 'Product', index: true },
  hostUserId: { type: String, required: true, ref: 'User' },
  targetCount: { type: Number, required: true },
  currentCount: { type: Number, default: 1 },
  participants: [{
    userId: String,
    joinedAt: { type: Date, default: Date.now },
    orderId: String,
  }],
  shareCode: { type: String, unique: true, index: true },
  shareUrl: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active',
    index: true,
  },
  startedAt: { type: Date, default: Date.now },
  endsAt: { type: Date, required: true, index: true },
  completedAt: Date,
  appliedPrice: Number,
}, { timestamps: true, _id: false });

GroupSessionSchema.pre('save', function (next) {
  if (!this.shareCode) {
    this.shareCode = generateShareCode();
  }
  if (!this.shareUrl) {
    this.shareUrl = `https://shopsyy.com/?group=${this._id}`;
  }
  next();
});

GroupSessionSchema.index({ productId: 1, status: 1 });
GroupSessionSchema.index({ endsAt: 1, status: 1 });
GroupSessionSchema.index({ shareCode: 1 }, { unique: true });

export const GroupSession = mongoose.model<IGroupSession>('GroupSession', GroupSessionSchema);
