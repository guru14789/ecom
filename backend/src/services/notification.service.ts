import { messaging } from '../lib/firestore/client';
import { createNotification } from '../lib/firestore/notifications';
import { createVendorNotification } from '../lib/firestore/vendor-notifications';

export interface PushPayload {
  userId: string;
  fcmToken?: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
}

/**
 * Send a Firebase Cloud Messaging push notification and persist it in Firestore.
 */
export async function sendPushNotification(payload: PushPayload): Promise<void> {
  // Persist to notifications collection
  await createNotification({
    userId: payload.userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    data: payload.data,
  });

  // Send FCM if token available
  if (payload.fcmToken) {
    try {
      await messaging.send({
        token: payload.fcmToken,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (err) {
      console.warn('FCM send failed (non-fatal):', (err as Error).message);
    }
  }
}

// ─── Buyer / Order Notification Helpers ─────────────────────────────────────

export const notifyOrderConfirmed = (userId: string, fcmToken: string | undefined, orderId: string) =>
  sendPushNotification({
    userId, fcmToken,
    title: 'Order Confirmed! 🎉',
    body: 'Your order has been confirmed and is being prepared.',
    type: 'order_confirmed',
    data: { orderId },
  });

export const notifyOrderShipped = (userId: string, fcmToken: string | undefined, orderId: string) =>
  sendPushNotification({
    userId, fcmToken,
    title: 'Out for Delivery 🚚',
    body: 'Your order is on its way!',
    type: 'order_shipped',
    data: { orderId },
  });

export const notifyOrderDelivered = (userId: string, fcmToken: string | undefined, orderId: string) =>
  sendPushNotification({
    userId, fcmToken,
    title: 'Delivered! ✅',
    body: 'Your order has been delivered. Enjoy!',
    type: 'order_delivered',
    data: { orderId },
  });

export const notifyBuyerRefundProcessed = (userId: string, orderId: string, amount: number) =>
  sendPushNotification({
    userId,
    title: 'Refund Processed 💸',
    body: `Your refund of ₹${amount} has been initiated for order #${orderId.slice(-6)}.`,
    type: 'refund_processed',
    data: { orderId, amount: String(amount) },
  });

export const notifyBuyerOrderStatus = (userId: string, orderId: string, status: string) =>
  sendPushNotification({
    userId,
    title: 'Order Update 📦',
    body: `Your order #${orderId.slice(-6)} status changed to: ${status.replace(/_/g, ' ')}.`,
    type: 'order_status_update',
    data: { orderId, status },
  });

export const notifyBuyerReturnUpdate = (userId: string, orderId: string, status: 'approved' | 'rejected') =>
  sendPushNotification({
    userId,
    title: status === 'approved' ? 'Return Approved ✅' : 'Return Rejected ❌',
    body: status === 'approved'
      ? `Your return request for order #${orderId.slice(-6)} is approved. Refund will be processed.`
      : `Your return request for order #${orderId.slice(-6)} was rejected.`,
    type: 'return_update',
    data: { orderId, status },
  });

// ─── Vendor Notification Helpers ─────────────────────────────────────────────

export const notifyNewOrder = (vendorFcmToken: string, orderId: string) => {
  if (!vendorFcmToken) return Promise.resolve();
  return messaging.send({
    token: vendorFcmToken,
    notification: { title: 'New Order! 🛍️', body: `Order #${orderId.slice(-6)} just came in.` },
    data: { orderId, type: 'new_order' },
    android: { priority: 'high' },
  }).catch((err) => console.warn('Vendor FCM failed:', err.message));
};

export const notifyVendorNewOrder = (vendorId: string, orderId: string, total: number) =>
  createVendorNotification({
    vendorId,
    type: 'order_new',
    title: 'New Order Received! 🛍️',
    body: `Order #${orderId.slice(-6)} worth ₹${total.toLocaleString('en-IN')} has been placed.`,
    data: { orderId },
  }).catch((err) => console.warn('notifyVendorNewOrder failed:', err.message));

export const notifyVendorOrderCancelled = (vendorId: string, orderId: string, reason?: string) =>
  createVendorNotification({
    vendorId,
    type: 'order_status',
    title: 'Order Cancelled',
    body: `Order #${orderId.slice(-6)} was cancelled by the buyer.${reason ? ` Reason: ${reason}` : ''}`,
    data: { orderId },
  }).catch((err) => console.warn('notifyVendorOrderCancelled failed:', err.message));

export const notifyVendorReturnRequest = (vendorId: string, orderId: string, returnId: string) =>
  createVendorNotification({
    vendorId,
    type: 'return_request',
    title: 'Return Request Received 🔄',
    body: `A buyer has raised a return request for order #${orderId.slice(-6)}.`,
    data: { orderId, returnId },
  }).catch((err) => console.warn('notifyVendorReturnRequest failed:', err.message));

export const notifyVendorKycApproved = (vendorId: string) =>
  createVendorNotification({
    vendorId,
    type: 'kyc_approved',
    title: 'KYC Approved! 🎉',
    body: 'Your store has been verified. You can now start selling on Shopsyy.',
    data: {},
  }).catch((err) => console.warn('notifyVendorKycApproved failed:', err.message));

export const notifyVendorKycRejected = (vendorId: string, reason?: string) =>
  createVendorNotification({
    vendorId,
    type: 'kyc_rejected',
    title: 'KYC Application Rejected',
    body: `Your verification was unsuccessful.${reason ? ` Reason: ${reason}` : ' Please contact support.'}`,
    data: { reason: reason || '' },
  }).catch((err) => console.warn('notifyVendorKycRejected failed:', err.message));

export const notifyVendorPayoutProcessed = (vendorId: string, amount: number) =>
  createVendorNotification({
    vendorId,
    type: 'payout_processed',
    title: 'Payout Sent! 💸',
    body: `₹${amount.toLocaleString('en-IN')} has been transferred to your bank account.`,
    data: { amount: String(amount) },
  }).catch((err) => console.warn('notifyVendorPayoutProcessed failed:', err.message));

export const notifyVendorPaymentReleased = (vendorId: string, orderId: string, amount: number) =>
  createVendorNotification({
    vendorId,
    type: 'payout_processed',
    title: 'Payment Released 💰',
    body: `Payment of ₹${amount.toLocaleString('en-IN')} for order #${orderId.slice(-6)} has been released.`,
    data: { orderId, amount: String(amount) },
  }).catch((err) => console.warn('notifyVendorPaymentReleased failed:', err.message));
