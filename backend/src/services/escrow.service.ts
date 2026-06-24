import { query } from '../config/postgres';
import { AppError } from '../utils/errors';

interface CreateEscrowParams {
  orderId: string;
  buyerId: string;
  vendorId: string;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}

export async function holdPayment(params: CreateEscrowParams): Promise<Record<string, unknown>> {
  const result = await query(
    `INSERT INTO escrow_transactions (order_id, buyer_id, vendor_id, amount, razorpay_order_id, razorpay_payment_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'held')
     RETURNING *`,
    [params.orderId, params.buyerId, params.vendorId, params.amount, params.razorpayOrderId, params.razorpayPaymentId]
  );
  return result.rows[0];
}

export async function releasePayment(orderId: string): Promise<Record<string, unknown>> {
  const escrow = await getEscrow(orderId);
  if (!escrow) {
    throw new AppError('NOT_FOUND', 'Escrow transaction not found', 404);
  }
  if ((escrow as { status: string }).status !== 'held') {
    throw new AppError('INVALID_STATUS', 'Escrow is not in held status', 400);
  }

  const result = await query(
    `UPDATE escrow_transactions
     SET status = 'released', released_at = NOW(), updated_at = NOW()
     WHERE order_id = $1 AND status = 'held'
     RETURNING *`,
    [orderId]
  );
  return result.rows[0];
}

export async function refundPayment(orderId: string, reason?: string): Promise<Record<string, unknown>> {
  const escrow = await getEscrow(orderId);
  if (!escrow) {
    throw new AppError('NOT_FOUND', 'Escrow transaction not found', 404);
  }

  const currentStatus = (escrow as { status: string }).status;
  if (!['held', 'released'].includes(currentStatus)) {
    throw new AppError('INVALID_STATUS', 'Escrow cannot be refunded', 400);
  }

  const result = await query(
    `UPDATE escrow_transactions
     SET status = 'refunded', refunded_at = NOW(), updated_at = NOW()
     WHERE order_id = $1
     RETURNING *`,
    [orderId]
  );
  return result.rows[0];
}

export async function getEscrow(orderId: string): Promise<Record<string, unknown> | null> {
  const result = await query(
    'SELECT * FROM escrow_transactions WHERE order_id = $1',
    [orderId]
  );
  return result.rows[0] || null;
}

export async function getVendorPendingPayouts(vendorId: string): Promise<Record<string, unknown>[]> {
  const result = await query(
    `SELECT * FROM escrow_transactions
     WHERE vendor_id = $1 AND status = 'released'
     ORDER BY released_at DESC`,
    [vendorId]
  );
  return result.rows;
}

const RAZORPAY_PERCENTAGE_FEE = 0.02;
const RAZORPAY_FIXED_FEE = 3;

export function calculateTransactionBreakdown(amount: number): {
  total: number;
  razorpayFee: number;
  platformFee: number;
  vendorPayout: number;
} {
  const razorpayFee = Math.round((amount * RAZORPAY_PERCENTAGE_FEE + RAZORPAY_FIXED_FEE) * 100) / 100;
  const platformFee = 0;
  const vendorPayout = amount - razorpayFee;
  return { total: amount, razorpayFee, platformFee, vendorPayout };
}
