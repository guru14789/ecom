import { updateOrderPayment } from '../lib/firestore/orders';
import { now } from '../lib/firestore/client';

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
  await updateOrderPayment(params.orderId, {
    razorpayPaymentId: params.razorpayPaymentId,
    paymentStatus: 'paid',
    paidAt: now() as FirebaseFirestore.Timestamp,
  });
}

export async function refundPayment(orderId: string): Promise<void> {
  await updateOrderPayment(orderId, { paymentStatus: 'refunded' });
}
