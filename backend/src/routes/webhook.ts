import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../utils/razorpay';
import { holdPayment, releasePayment } from '../services/escrow.service';
import { Order } from '../models/Order';

const router = Router();

router.post('/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody;

  if (!signature || !rawBody) {
    return res.status(400).json({ error: 'MISSING_SIGNATURE' });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'INVALID_SIGNATURE' });
  }

  const event = req.body.event;
  const payload = req.body.payload || {};

  try {
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.notes?.order_id || payment.description;
        const userId = payment.notes?.user_id;
        const vendorId = payment.notes?.vendor_id;
        const amount = (payment.amount || 0) / 100;

        if (orderId && amount > 0) {
          await holdPayment({
            orderId,
            buyerId: userId || 'unknown',
            vendorId: vendorId || 'unknown',
            amount,
            razorpayOrderId: payment.order_id || '',
            razorpayPaymentId: payment.id || '',
          });

          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: 'paid',
            paymentReference: payment.id,
            paidAt: new Date(),
            $push: {
              timeline: {
                status: 'confirmed',
                timestamp: new Date(),
                note: `Payment captured (Razorpay: ${payment.id})`,
                updatedBy: 'system',
              },
            },
          });
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.notes?.order_id;
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: 'failed',
            $push: {
              timeline: {
                status: 'payment_failed',
                timestamp: new Date(),
                note: `Payment failed (Razorpay: ${payment.id}) - ${payment.error_description || ''}`,
                updatedBy: 'system',
              },
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'WEBHOOK_ERROR' });
  }
});

export default router;
