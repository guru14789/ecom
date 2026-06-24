import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  key: string;
  label: string;
  image: string;
  subcategories: string[];
  featured: boolean;
  order: number;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>({
  key: { type: String, required: true, unique: true, index: true },
  label: { type: String, required: true },
  image: { type: String, required: true },
  subcategories: [String],
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
