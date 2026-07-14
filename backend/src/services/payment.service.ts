import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function createRazorpayOrder(options: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }) {
  return await razorpay.orders.create(options);
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  try {
    if (generatedSignature.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}
