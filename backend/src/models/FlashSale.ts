import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IFlashSaleProduct {
  productId: string;
  salePrice: number;
  quantity: number;
  sold: number;
}

export interface IFlashSale extends Document<string> {
  _id: string;
  title: string;
  description?: string;
  banner?: string;
  products: IFlashSaleProduct[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema = new Schema<IFlashSale>({
  _id: { type: String, default: () => generateId('fs', 10) },
  title: { type: String, required: true },
  description: String,
  banner: String,
  products: [{
    productId: { type: String, ref: 'Product', required: true },
    salePrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
  }],
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, _id: false });

FlashSaleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export const FlashSale = mongoose.model<IFlashSale>('FlashSale', FlashSaleSchema);
