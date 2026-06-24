import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IVendorDocument {
  type: 'gst_certificate' | 'pan_card' | 'cancelled_cheque' | 'address_proof';
  url: string;
  verified: boolean;
}

export interface IVendorBank {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  accountType: 'savings' | 'current';
  bankName?: string;
}

export interface IVendorKyc {
  businessType: 'individual' | 'proprietorship' | 'company' | 'llp';
  pan: string;
  documents: IVendorDocument[];
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  kycRejectedReason?: string;
}

export interface IVendor extends Document<string> {
  _id: string;
  name: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  gstin?: string;
  pan?: string;
  businessType?: 'individual' | 'proprietorship' | 'company' | 'llp';
  bank: IVendorBank;
  kyc: IVendorKyc;
  storeName: string;
  returnPolicyDays: number;
  shippingPolicy?: string;
  rating: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  totalEarnings: number;
  commission: number;
  responseRate: number;
  shippingScore: number;
  categories: string[];
  verified: boolean;
  kycVerified: boolean;
  isActive: boolean;
  autoApproveProducts: boolean;
  fulfillmentRate: number;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorDocSchema = new Schema<IVendorDocument>({
  type: { type: String, enum: ['gst_certificate', 'pan_card', 'cancelled_cheque', 'address_proof'], required: true },
  url: { type: String, required: true },
  verified: { type: Boolean, default: false },
}, { _id: false });

const VendorBankSchema = new Schema<IVendorBank>({
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  accountType: { type: String, enum: ['savings', 'current'], default: 'savings' },
  bankName: String,
}, { _id: false });

const VendorKycSchema = new Schema<IVendorKyc>({
  businessType: { type: String, enum: ['individual', 'proprietorship', 'company', 'llp'] },
  pan: String,
  documents: [VendorDocSchema],
  kycStatus: { type: String, enum: ['pending', 'submitted', 'verified', 'rejected'], default: 'pending' },
  kycRejectedReason: String,
}, { _id: false });

const VendorSchema = new Schema<IVendor>({
  _id: { type: String, default: () => generateId('v', 10) },
  name: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  logo: String,
  coverImage: String,
  description: String,
  gstin: String,
  pan: String,
  businessType: { type: String, enum: ['individual', 'proprietorship', 'company', 'llp'] },
  bank: { type: VendorBankSchema, default: () => ({ accountHolderName: '', accountNumber: '', ifsc: '', accountType: 'savings' }) },
  kyc: { type: VendorKycSchema, default: () => ({ documents: [], kycStatus: 'pending' }) },
  storeName: { type: String, trim: true },
  returnPolicyDays: { type: Number, default: 7 },
  shippingPolicy: String,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalProducts: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  commission: { type: Number, default: 5 },
  responseRate: { type: Number, default: 0 },
  shippingScore: { type: Number, default: 0 },
  categories: [String],
  verified: { type: Boolean, default: false },
  kycVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  autoApproveProducts: { type: Boolean, default: false },
  fulfillmentRate: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true, _id: false });

VendorSchema.index({ email: 1 }, { unique: true });
VendorSchema.index({ isActive: 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
