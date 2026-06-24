import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IProductVariant {
  id: string;
  label: string;
  type: 'size' | 'color' | 'storage' | 'pack';
  stock: number;
  priceModifier: number;
}

export interface IProductSpec {
  label: string;
  value: string;
}

export interface IProduct extends Document<string> {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  category: string;
  subcategory?: string;
  brand?: string;
  tags: string[];
  price: number;
  groupPrice: number;
  mrp?: number;
  targetCount: number;
  image: string;
  images: string[];
  specs: IProductSpec[];
  highlights: string[];
  variants: IProductVariant[];
  vendorId: string;
  stock: number;
  returnPolicy?: string;
  warranty?: string;
  deliveryTime?: string;
  rating: number;
  reviews: number;
  badge?: 'bestseller' | 'new' | 'trending' | 'limited' | 'deal';
  sponsored: boolean;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  _id: { type: String, default: () => generateId('p', 10) },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  slug: { type: String, unique: true, index: true },
  category: { type: String, required: true, ref: 'Category', index: true },
  subcategory: { type: String },
  brand: { type: String, index: true },
  tags: [String],
  price: { type: Number, required: true, min: 0 },
  groupPrice: { type: Number, required: true, min: 0 },
  mrp: { type: Number },
  targetCount: { type: Number, default: 100 },
  image: { type: String, required: true },
  images: [String],
  specs: [{ label: String, value: String }],
  highlights: [String],
  variants: [{
    id: String,
    label: String,
    type: { type: String, enum: ['size', 'color', 'storage', 'pack'] },
    stock: { type: Number, default: 0 },
    priceModifier: Number,
  }],
  vendorId: { type: String, required: true, ref: 'Vendor', index: true },
  stock: { type: Number, default: 0, index: true },
  returnPolicy: String,
  warranty: String,
  deliveryTime: String,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  badge: { type: String, enum: ['bestseller', 'new', 'trending', 'limited', 'deal'] },
  sponsored: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true, _id: false });

ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
ProductSchema.index({ category: 1, price: 1, rating: -1 });
ProductSchema.index({ vendorId: 1, isActive: 1 });
ProductSchema.index({ sponsored: 1, isFeatured: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
