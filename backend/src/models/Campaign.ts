import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface ICampaignSegment {
  type: 'all' | 'new_users' | 'dormant' | 'high_value' | 'custom';
  userIds?: string[];
}

export interface ICampaign extends Document<string> {
  _id: string;
  title: string;
  type: 'email' | 'push' | 'sms';
  subject?: string;
  body: string;
  segment: ICampaignSegment;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  _id: { type: String, default: () => generateId('cmp', 10) },
  title: { type: String, required: true },
  type: { type: String, enum: ['email', 'push', 'sms'], required: true },
  subject: String,
  body: { type: String, required: true },
  segment: {
    type: { type: String, enum: ['all', 'new_users', 'dormant', 'high_value', 'custom'], default: 'all' },
    userIds: [String],
  },
  scheduledAt: Date,
  sentAt: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
    default: 'draft',
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
  },
  createdBy: { type: String, required: true },
}, { timestamps: true, _id: false });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
