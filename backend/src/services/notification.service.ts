import { messaging } from '../lib/firestore/client';
import { createNotification } from '../lib/firestore/notifications';

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

/**
 * Order status notification helpers
 */
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

export const notifyNewOrder = (vendorFcmToken: string, orderId: string) => {
  if (!vendorFcmToken) return Promise.resolve();
  return messaging.send({
    token: vendorFcmToken,
    notification: { title: 'New Order! 🛍️', body: `Order #${orderId.slice(-6)} just came in.` },
    data: { orderId, type: 'new_order' },
    android: { priority: 'high' },
  }).catch((err) => console.warn('Vendor FCM failed:', err.message));
};
