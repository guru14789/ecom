import { query } from '../config/postgres';
import { AppError } from '../utils/errors';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  productLimit: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
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
    productLimit: 1000,
    features: ['Unlimited products', 'API access', 'Dedicated account manager', 'Custom integrations', 'White-label options', 'Priority payouts'],
  },
};

export async function createSubscription(vendorId: string, tier: string = 'basic'): Promise<Record<string, unknown>> {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (!tierConfig) {
    throw new AppError('INVALID_TIER', 'Invalid subscription tier', 400);
  }

  const result = await query(
    `INSERT INTO vendor_subscriptions (vendor_id, tier, price, product_limit, features)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (vendor_id)
     DO UPDATE SET tier = $2, price = $3, product_limit = $4, features = $5::jsonb, updated_at = NOW()
     RETURNING *`,
    [vendorId, tier, tierConfig.price, tierConfig.productLimit, JSON.stringify(tierConfig.features)]
  );

  return result.rows[0];
}

export async function getSubscription(vendorId: string): Promise<Record<string, unknown> | null> {
  const result = await query(
    'SELECT * FROM vendor_subscriptions WHERE vendor_id = $1',
    [vendorId]
  );
  return result.rows[0] || null;
}

export async function updateSubscriptionTier(vendorId: string, newTier: string): Promise<Record<string, unknown>> {
  const tierConfig = SUBSCRIPTION_TIERS[newTier];
  if (!tierConfig) {
    throw new AppError('INVALID_TIER', 'Invalid subscription tier', 400);
  }

  const result = await query(
    `UPDATE vendor_subscriptions
     SET tier = $2, price = $3, product_limit = $4, features = $5::jsonb,
         current_period_end = NOW() + INTERVAL '30 days',
         status = 'active', updated_at = NOW()
     WHERE vendor_id = $1
     RETURNING *`,
    [vendorId, newTier, tierConfig.price, tierConfig.productLimit, JSON.stringify(tierConfig.features)]
  );

  if (result.rows.length === 0) {
    return createSubscription(vendorId, newTier);
  }
  return result.rows[0];
}

export async function cancelSubscription(vendorId: string): Promise<void> {
  await query(
    `UPDATE vendor_subscriptions
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE vendor_id = $1`,
    [vendorId]
  );
}

export async function getVendorProductLimit(vendorId: string): Promise<number> {
  const sub = await getSubscription(vendorId);
  if (!sub) return SUBSCRIPTION_TIERS.basic.productLimit;
  return (sub as { product_limit: number }).product_limit || SUBSCRIPTION_TIERS.basic.productLimit;
}
