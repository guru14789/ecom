import { updateOrderPayment } from '../lib/firestore/orders';

/**
 * Escrow is simplified: instead of a separate PG table,
 * the Razorpay payment reference is stored directly on the Order document.
 * The "hold" state is simply paymentStatus='pending' with a razorpayOrderId set.
 * The "release" state is paymentStatus='paid' with razorpayPaymentId set.
 */

export async function holdPayment(params: {
  orderId: string;
  razorpayOrderId: string;
}): Promise<void> {
  await updateOrderPayment(params.orderId, {
    razorpayOrderId: params.razorpayOrderId,
    paymentStatus: 'pending',
  });
}

export async function releasePayment(params: {
  orderId: string;
  razorpayPaymentId: string;
}): Promise<void> {
  const admin = require('firebase-admin');
  await updateOrderPayment(params.orderId, {
    razorpayPaymentId: params.razorpayPaymentId,
    paymentStatus: 'paid',
    paidAt: admin.firestore.Timestamp.now(),
  });
}

export async function refundPayment(orderId: string): Promise<void> {
  await updateOrderPayment(orderId, { paymentStatus: 'refunded' });
}
