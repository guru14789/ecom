import { db, fromDoc, fromQuery, now, arrayUnion } from './client';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'packed'
  | 'shipped' | 'out_for_delivery' | 'delivered'
  | 'cancelled' | 'return_requested' | 'returned';

export interface OrderItem {
  productId: string;
  productSnapshot: Record<string, unknown>;
  quantity: number;
  isGroupBuy: boolean;
  unitPrice: number;
  totalPrice: number;
  variantId?: string;
  vendorId?: string;
}

export interface DeliveryAddress {
  houseNo: string;
  area: string;
  pincode: string;
  landmark?: string;
  city?: string;
  state?: string;
  tag?: string;
}

export interface TimelineEntry {
  status: string;
  timestamp: FirebaseFirestore.Timestamp;
  note?: string;
  updatedBy?: string;
}

export interface VendorOrder {
  vendorId: string;
  items: string[];
  status: string;
  fulfilledAt?: FirebaseFirestore.Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: FirebaseFirestore.Timestamp;
  status: OrderStatus;
  timeline: TimelineEntry[];
  trackingId?: string;
  estimatedDelivery?: FirebaseFirestore.Timestamp;
  deliveredAt?: FirebaseFirestore.Timestamp;
  groupSessionId?: string;
  vendorOrders: VendorOrder[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('orders');

export async function getOrderById(id: string): Promise<Order | null> {
  return fromDoc<Order>(await col().doc(id).get());
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as Order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
  updatedBy?: string
): Promise<void> {
  const entry: TimelineEntry = {
    status,
    timestamp: now() as FirebaseFirestore.Timestamp,
    note,
    updatedBy,
  };
  await col().doc(id).update({
    status,
    timeline: arrayUnion(entry),
    updatedAt: now(),
  });
}

export async function updateOrderPayment(
  id: string,
  opts: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    paidAt?: FirebaseFirestore.Timestamp;
  }
): Promise<void> {
  await col().doc(id).update({
    ...opts,
    paymentReference: opts.razorpayPaymentId,
    updatedAt: now(),
  });
}

export async function getOrdersByUser(
  userId: string,
  opts: { limit?: number; startAfter?: string; status?: OrderStatus }
): Promise<Order[]> {
  let q = col().where('userId', '==', userId).orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.status) q = q.where('status', '==', opts.status);
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  return fromQuery<Order>(await q.limit(opts.limit || 20).get());
}

export async function getOrdersByVendor(
  vendorId: string,
  opts: { limit?: number; startAfter?: string; status?: string }
): Promise<Order[]> {
  let q = col()
    .where('vendorOrders', 'array-contains-any', [{ vendorId }])
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  return fromQuery<Order>(await q.limit(opts.limit || 20).get());
}

export async function getAllOrders(opts: {
  limit?: number;
  startAfter?: string;
  status?: string;
  paymentStatus?: string;
}): Promise<Order[]> {
  let q = col().orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
  if (opts.status) q = q.where('status', '==', opts.status);
  if (opts.paymentStatus) q = q.where('paymentStatus', '==', opts.paymentStatus);
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  return fromQuery<Order>(await q.limit(opts.limit || 20).get());
}
