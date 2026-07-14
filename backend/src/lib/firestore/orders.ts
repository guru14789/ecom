import admin, { db, fromDoc, fromQuery, now, arrayUnion } from './client';

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
  taxRate?: number;
  taxAmount?: number;
  productType?: 'physical' | 'digital';
  digitalFileUrl?: string;
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
  shippingDetails?: {
    awb: string;
    courierName: string;
    trackingUrl: string;
    shippedAt: FirebaseFirestore.Timestamp;
  };
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
  taxTotal: number;
  total: number;
  pointsUsed?: number;
  pointsEarned?: number;
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
  vendorIds: string[];
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
  const docRef = col().doc(id);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) throw new Error('Order not found');
    const order = doc.data() as Order;

    const entry: TimelineEntry = {
      status,
      timestamp: now() as FirebaseFirestore.Timestamp,
      note,
      updatedBy,
    };

    const updates: any = {
      status,
      timeline: arrayUnion(entry),
      updatedAt: now(),
    };

    transaction.update(docRef, updates);

    // Credit points if order is delivered
    if (status === 'delivered' && order.status !== 'delivered' && order.pointsEarned) {
      const userRef = db.collection('users').doc(order.userId);
      transaction.update(userRef, {
        pointsBalance: admin.firestore.FieldValue.increment(order.pointsEarned)
      });
    }
  });
}

export async function updateVendorOrderStatus(
  orderId: string,
  vendorId: string,
  status: OrderStatus,
  shippingDetails?: { awb: string; courierName: string; trackingUrl: string }
): Promise<void> {
  const docRef = col().doc(orderId);
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) throw new Error('Order not found');
    const order = doc.data() as Order;
    
    const vendorOrders = order.vendorOrders || [];
    const idx = vendorOrders.findIndex(v => v.vendorId === vendorId);
    if (idx === -1) throw new Error('Vendor not part of this order');
    
    vendorOrders[idx].status = status;
    if (status === 'shipped' && shippingDetails) {
      vendorOrders[idx].shippingDetails = {
        ...shippingDetails,
        shippedAt: now() as FirebaseFirestore.Timestamp
      };
    }

    // Determine global status
    const allStatuses = vendorOrders.map(v => v.status);
    let newGlobalStatus = order.status;
    if (allStatuses.every(s => s === 'delivered')) newGlobalStatus = 'delivered';
    else if (allStatuses.every(s => s === 'shipped' || s === 'delivered')) newGlobalStatus = 'shipped';
    else if (allStatuses.some(s => s === 'packed' || s === 'shipped' || s === 'out_for_delivery')) newGlobalStatus = 'processing';

    const updates: any = {
      vendorOrders,
      updatedAt: now()
    };

    if (newGlobalStatus !== order.status) {
      updates.status = newGlobalStatus;
      updates.timeline = admin.firestore.FieldValue.arrayUnion({
        status: newGlobalStatus,
        timestamp: now(),
        note: `Status updated because all vendor orders reached ${newGlobalStatus}`,
        updatedBy: 'system'
      });

      if (newGlobalStatus === 'delivered' && order.pointsEarned) {
        const userRef = db.collection('users').doc(order.userId);
        transaction.update(userRef, {
          pointsBalance: admin.firestore.FieldValue.increment(order.pointsEarned)
        });
      }
    }

    transaction.update(docRef, updates);
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
    .where('vendorIds', 'array-contains', vendorId) as FirebaseFirestore.Query;
  if (opts.status) q = q.where('status', '==', opts.status);
  
  const snapshot = await q.get();
  let orders = fromQuery<Order>(snapshot);
  
  orders.sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
    const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
    return bTime - aTime;
  });

  if (opts.startAfter) {
    const startIdx = orders.findIndex(o => o.id === opts.startAfter);
    if (startIdx !== -1) orders = orders.slice(startIdx + 1);
  }
  if (opts.limit) {
    orders = orders.slice(0, opts.limit);
  }
  return orders;
}

export async function getAllOrders(opts: {
  limit?: number;
  startAfter?: string;
  status?: string;
  paymentStatus?: string;
}): Promise<Order[]> {
  let q = col() as FirebaseFirestore.Query;
  if (opts.status) q = q.where('status', '==', opts.status);
  if (opts.paymentStatus) q = q.where('paymentStatus', '==', opts.paymentStatus);
  
  // Apply limit directly in Firestore query for faster fetching
  const queryLimit = opts.limit || 50;
  
  let snapshot;
  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    if (cursor.exists) {
      // Note: Ordering in memory instead of Firestore to avoid composite index demands
      snapshot = await q.get();
    } else {
      snapshot = await q.limit(queryLimit).get();
    }
  } else {
    snapshot = await q.limit(queryLimit).get();
  }
  
  let orders = fromQuery<Order>(snapshot);

  orders.sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
    const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
    return bTime - aTime;
  });

  if (opts.startAfter) {
    const startIdx = orders.findIndex(o => o.id === opts.startAfter);
    if (startIdx !== -1) orders = orders.slice(startIdx + 1);
  }
  
  // Final safeguard slice
  return orders.slice(0, queryLimit);
}
