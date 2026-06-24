import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export type NotificationType = 'order_update' | 'group_deal' | 'price_drop' | 'back_in_stock' | 'promo' | 'system';

export interface INotification extends Document<string> {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  imageUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  _id: { type: String, default: () => generateId('notif', 10) },
  userId: { type: String, required: true, ref: 'User', index: true },
  type: { type: String, enum: ['order_update', 'group_deal', 'price_drop', 'back_in_stock', 'promo', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  actionUrl: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true, _id: false });

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
