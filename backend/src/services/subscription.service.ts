import { getSubscription, setSubscription, SubscriptionTier } from '../lib/firestore/vendors';
import admin from '../lib/firestore/client';
import { AppError } from '../utils/errors';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  productLimit: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 0,
    productLimit: 10,
    features: ['Product listings', 'Basic analytics', 'Email support'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 999,
    productLimit: 100,
    features: ['Product listings', 'Advanced analytics', 'Priority support', 'Bulk upload', 'Custom storefront'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    productLimit: 10000,
    features: ['Unlimited listings', 'Full analytics', 'Dedicated support', 'API access', 'Custom integrations'],
  },
};

export async function getVendorSubscription(vendorId: string): Promise<SubscriptionTier | null> {
  return getSubscription(vendorId);
}

export async function upgradeSubscription(
  vendorId: string,
  tierId: string,
  razorpayPaymentId: string
): Promise<SubscriptionTier> {
  const plan = SUBSCRIPTION_TIERS[tierId];
  if (!plan) throw new AppError('INVALID_TIER', 'Invalid subscription tier', 400);

  const tier: SubscriptionTier = {
    tier: tierId as SubscriptionTier['tier'],
    price: plan.price,
    productLimit: plan.productLimit,
    status: 'active',
    startedAt: admin.firestore.Timestamp.now(),
    expiresAt: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ),
  };

  await setSubscription(vendorId, tier);
  return tier;
}

export async function checkProductLimit(vendorId: string, currentCount: number): Promise<boolean> {
  const sub = await getSubscription(vendorId);
  const limit = sub ? sub.productLimit : SUBSCRIPTION_TIERS.basic.productLimit;
  return currentCount < limit;
}
