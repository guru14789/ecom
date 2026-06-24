import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '../utils/helpers';

export interface IAnswer {
  _id: string;
  body: string;
  userId: string;
  userType: 'buyer' | 'vendor';
  isAccepted: boolean;
  helpfulCount: number;
  createdAt: Date;
}

export interface IQuestion extends Document<string> {
  _id: string;
  productId: string;
  userId: string;
  body: string;
  answers: IAnswer[];
  answerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  _id: { type: String, default: () => generateId('ans', 10) },
  body: { type: String, required: true, maxlength: 2000 },
  userId: { type: String, required: true },
  userType: { type: String, enum: ['buyer', 'vendor'], required: true },
  isAccepted: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const QuestionSchema = new Schema<IQuestion>({
  _id: { type: String, default: () => generateId('q', 12) },
  productId: { type: String, required: true, ref: 'Product', index: true },
  userId: { type: String, required: true, ref: 'User' },
  body: { type: String, required: true, maxlength: 2000 },
  answers: [AnswerSchema],
  answerCount: { type: Number, default: 0 },
}, { timestamps: true, _id: false });

QuestionSchema.index({ productId: 1, createdAt: -1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
