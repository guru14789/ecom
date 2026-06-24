import { api } from './client';

export interface CreateRazorpayOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    orderId: string;
    paymentStatus: string;
  };
}

export async function createRazorpayOrder(params: {
  addressId: string;
  couponCode?: string;
}): Promise<CreateRazorpayOrderResponse> {
  const response = await api.post('/payments/create-order', params);
  return response.data;
}

export async function verifyPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}): Promise<VerifyPaymentResponse> {
  const response = await api.post('/payments/verify', params);
  return response.data;
}
