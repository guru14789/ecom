import mongoose, { Schema, Document } from 'mongoose';
import { generateOrderId } from '../utils/helpers';

export interface IOrderItem {
  productId: string;
  productSnapshot: Record<string, unknown>;
  quantity: number;
  isGroupBuy: boolean;
  unitPrice: number;
  totalPrice: number;
  variantId?: string;
  vendorId?: string;
}

export interface IDeliveryAddress {
  houseNo: string;
  area: string;
  pincode: string;
  landmark?: string;
  city?: string;
  state?: string;
  tag?: string;
}

export interface ITimelineEntry {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface IVendorOrder {
  vendorId: string;
  items: string[];
  status: string;
  fulfilledAt?: Date;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';

export interface IOrder extends Document<string> {
  _id: string;
  userId: string;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  couponCode?: string;
  handlingFee: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  paidAt?: Date;
  status: OrderStatus;
  timeline: ITimelineEntry[];
  trackingId?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  groupSessionId?: string;
  vendorOrders: IVendorOrder[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  _id: { type: String, default: () => generateOrderId() },
  userId: { type: String, required: true, ref: 'User', index: true },
  items: [{
    productId: { type: String, ref: 'Product' },
    productSnapshot: { type: Schema.Types.Mixed },
    quantity: Number,
    isGroupBuy: Boolean,
    unitPrice: Number,
    totalPrice: Number,
    variantId: String,
    vendorId: String,
  }],
  deliveryAddress: {
    houseNo: String,
    area: String,
    pincode: String,
    landmark: String,
    city: String,
    state: String,
    tag: String,
  },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  couponCode: String,
  handlingFee: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'cod', 'wallet'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentReference: String,
  paidAt: Date,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned'],
    default: 'pending',
    index: true,
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: String,
  }],
  trackingId: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  groupSessionId: { type: String, ref: 'GroupSession' },
  vendorOrders: [{
    vendorId: String,
    items: [String],
    status: String,
    fulfilledAt: Date,
  }],
}, { timestamps: true, _id: false });

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'items.vendorId': 1, status: 1 });
OrderSchema.index({ groupSessionId: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
