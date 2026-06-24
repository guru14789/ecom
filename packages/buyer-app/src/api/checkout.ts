import { api } from './client';
import { DeliveryEstimate } from '../types';

export interface CheckoutSummary {
  items: Array<{
    productId: string; name: string; image: string; price: number; quantity: number; total: number; vendorId: string;
  }>;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  handlingFee: number;
  couponDiscount: number;
  couponCode?: string;
  total: number;
  breakdown: {
    itemTotal: number; gstRate: string; deliveryCharge: number; handlingCharge: number; platformFee: number;
  };
}

export async function getDeliveryEstimate(pincode: string, productId?: string): Promise<{ data: DeliveryEstimate }> {
  const params: Record<string, string> = { pincode };
  if (productId) params.productId = productId;
  const response = await api.get('/checkout/delivery-estimate', { params });
  return response.data;
}

export async function checkPincode(pincode: string): Promise<{ data: { serviceable: boolean; couriers: any[] } }> {
  const response = await api.get('/checkout/pincode-serviceability', { params: { pincode } });
  return response.data;
}

export async function validateCoupon(code: string, cartValue: number): Promise<{ valid: boolean; data?: any; error?: string }> {
  const response = await api.post('/checkout/validate-coupon', { code, cartValue });
  return response.data;
}

export async function getCheckoutSummary(data: {
  items: Array<{ productId: string; quantity: number; isGroupBuy?: boolean }>;
  pincode?: string; couponCode?: string;
}): Promise<{ data: CheckoutSummary }> {
  const response = await api.post('/checkout/summary', data);
  return response.data;
}

export async function checkCodAvailability(pincode?: string, amount?: number): Promise<{ data: { available: boolean; charge: number; maxAmount: number } }> {
  const params: Record<string, string> = {};
  if (pincode) params.pincode = pincode;
  if (amount) params.amount = String(amount);
  const response = await api.get('/checkout/cod-availability', { params });
  return response.data;
}
