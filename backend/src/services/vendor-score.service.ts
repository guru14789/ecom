import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Vendor } from '../models/Vendor';

export interface VendorScore {
  vendorId: string;
  fulfillmentRate: number;
  returnRate: number;
  averageRating: number;
  responseRate: number;
  shippingScore: number;
  totalOrders: number;
  totalProducts: number;
  overallScore: number;
}

export async function computeVendorScore(vendorId: string): Promise<VendorScore> {
  const [vendor, allOrders, products] = await Promise.all([
    Vendor.findById(vendorId).lean(),
    Order.find({ 'items.vendorId': vendorId }).lean(),
    Product.find({ vendorId }).lean(),
  ]);

  const totalOrders = allOrders.length;
  const fulfilled = allOrders.filter((o) => o.status === 'delivered').length;
  const cancelled = allOrders.filter((o) => o.status === 'cancelled').length;
  const returned = allOrders.filter((o) => o.status === 'returned' || o.status === 'return_requested').length;

  const fulfillmentRate = totalOrders > 0 ? Math.round((fulfilled / totalOrders) * 100) : 100;
  const returnRate = totalOrders > 0 ? Math.round((returned / totalOrders) * 100) : 0;

  const avgRating = products.length > 0
    ? Math.round((products.reduce((s, p) => s + p.rating, 0) / products.length) * 10) / 10
    : 0;

  const totalResponses = products.reduce((s, p) => s + p.reviews, 0);
  const responseRate = totalOrders > 0
    ? Math.min(100, Math.round((totalResponses / totalOrders) * 100))
    : 0;

  const shippingScore = vendor?.shippingScore ?? 0;

  const overallScore = Math.round(
    (fulfillmentRate * 0.35) +
    ((100 - returnRate) * 0.20) +
    (avgRating * 15) +
    (responseRate * 0.15) +
    (shippingScore * 0.15)
  );

  return {
    vendorId,
    fulfillmentRate,
    returnRate,
    averageRating: avgRating,
    responseRate,
    shippingScore,
    totalOrders,
    totalProducts: products.length,
    overallScore: Math.min(100, Math.max(0, overallScore)),
  };
}

export async function computeAllVendorScores(): Promise<VendorScore[]> {
  const vendors = await Vendor.find({ isActive: true }).select('_id').lean();
  const scores: VendorScore[] = [];
  for (const vendor of vendors) {
    try {
      const score = await computeVendorScore(vendor._id);
      scores.push(score);
    } catch (err) {
      console.error(`Failed to compute score for vendor ${vendor._id}:`, err);
    }
  }
  return scores;
}
