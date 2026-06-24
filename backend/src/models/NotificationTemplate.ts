import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationTemplate extends Document {
  trigger: string;
  title: string;
  body: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  emailSubject?: string;
  emailHtml?: string;
  smsBody?: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  trigger: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  channels: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },
  emailSubject: String,
  emailHtml: String,
  smsBody: String,
  variables: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
