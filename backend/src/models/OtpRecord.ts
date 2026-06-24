import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpRecord extends Document {
  phoneNumber: string;
  otp: string;
  attempts: number;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtpRecord>({
  phoneNumber: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

OtpSchema.index({ phoneNumber: 1, createdAt: -1 });

export const OtpRecord = mongoose.model<IOtpRecord>('OtpRecord', OtpSchema);
