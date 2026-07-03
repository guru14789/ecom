import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../../utils/razorpay';
import { holdPayment } from '../../services/escrow.service';
import { updateOrderPayment, updateOrderStatus } from '../../lib/firestore/orders';
import { now } from '../../lib/firestore/client';
import admin from 'firebase-admin';

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
            razorpayOrderId: payment.order_id || '',
          });

          await updateOrderPayment(orderId, {
            paymentStatus: 'paid',
            razorpayPaymentId: payment.id,
            paidAt: now() as admin.firestore.Timestamp,
          });
          
          await updateOrderStatus(
            orderId, 
            'confirmed', 
            `Payment captured (Razorpay: ${payment.id})`, 
            'system'
          );
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const orderId = payment.notes?.order_id;
        if (orderId) {
          await updateOrderPayment(orderId, {
            paymentStatus: 'failed',
          });
          
          // Using updateOrderStatus might change the main status, but this is a timeline note.
          // In firestore/orders.ts, updateOrderStatus pushes to timeline AND updates status.
          // For a failed payment, maybe the status remains 'pending' or goes to 'cancelled'.
          // Let's set it to 'cancelled' for failed payments to match standard flows, or keep it.
          // Actually, let's just mark it pending and they can retry, but timeline gets a note.
          // I'll update the main status to 'cancelled' so it's clearly failed.
          await updateOrderStatus(
            orderId,
            'cancelled',
            `Payment failed (Razorpay: ${payment.id}) - ${payment.error_description || ''}`,
            'system'
          );
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
