import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IUserAddress {
  _id: string;
  houseNo: string;
  area: string;
  pincode: string;
  landmark?: string;
  city?: string;
  state?: string;
  tag: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}

export interface IWalletTransaction {
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  createdAt: Date;
}

export interface IUser extends Document<string> {
  _id: string;
  phoneNumber: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  role: 'buyer' | 'vendor' | 'vendor_admin' | 'platform_admin' | 'super_admin';
  vendorId?: string;
  cognitoSub?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  refreshTokenHash?: string;
  passwordHash?: string;
  addresses: IUserAddress[];
  walletBalance: number;
  walletTransactions: IWalletTransaction[];
  referralCode: string;
  referredBy?: string;
  referredCount: number;
  preferences: {
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
    notifications: { email: boolean; sms: boolean; push: boolean };
  };
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, default: () => generateId('u', 10) },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, sparse: true, lowercase: true },
  fullName: { type: String, trim: true },
  avatar: { type: String },
  role: { type: String, enum: ['buyer', 'vendor', 'vendor_admin', 'platform_admin', 'super_admin'], default: 'buyer' },
  vendorId: { type: String },
  cognitoSub: { type: String, sparse: true, unique: true },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String },
  passwordHash: { type: String },
  addresses: [{
    _id: { type: String, default: () => generateId('addr', 8) },
    houseNo: { type: String, required: true },
    area: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    tag: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    isDefault: { type: Boolean, default: false },
  }],
  walletBalance: { type: Number, default: 0, min: 0 },
  walletTransactions: [{
    amount: Number,
    type: { type: String, enum: ['credit', 'debit'] },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String, ref: 'User' },
  referredCount: { type: Number, default: 0 },
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  lastLoginAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true, _id: false });

UserSchema.index({ phoneNumber: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
