import { db, fromDoc, fromQuery, now } from './client';
import admin from './client';

export type NotificationType =
  | 'order_new'
  | 'order_status'
  | 'return_request'
  | 'low_stock'
  | 'out_of_stock'
  | 'payout_processed'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'review_received'
  | 'message_received'
  | 'system';

export interface VendorNotification {
  id: string;
  vendorId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  readAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('vendor_notifications');

export async function createVendorNotification(
  data: Omit<VendorNotification, 'id' | 'read' | 'createdAt'>
): Promise<VendorNotification> {
  const ref = col().doc();
  const payload = { ...data, read: false, createdAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as VendorNotification;
}

export async function listVendorNotifications(
  vendorId: string,
  opts: { limit?: number; unreadOnly?: boolean; startAfter?: string }
): Promise<VendorNotification[]> {
  let q = col()
    .where('vendorId', '==', vendorId) as FirebaseFirestore.Query;
  if (opts.unreadOnly) q = q.where('read', '==', false);
  
  const snapshot = await q.get();
  let notifications = fromQuery<VendorNotification>(snapshot);

  notifications.sort((a, b) => {
    const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
    const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
    return bTime - aTime;
  });

  if (opts.startAfter) {
    const startIdx = notifications.findIndex(n => n.id === opts.startAfter);
    if (startIdx !== -1) notifications = notifications.slice(startIdx + 1);
  }
  if (opts.limit) {
    notifications = notifications.slice(0, opts.limit);
  }
  return notifications;
}

export async function countUnreadNotifications(vendorId: string): Promise<number> {
  const snap = await col()
    .where('vendorId', '==', vendorId)
    .where('read', '==', false)
    .count()
    .get();
  return snap.data().count;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await col().doc(notificationId).update({ read: true, readAt: now() });
}

export async function markAllNotificationsRead(vendorId: string): Promise<void> {
  const snap = await col()
    .where('vendorId', '==', vendorId)
    .where('read', '==', false)
    .get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true, readAt: now() }));
  await batch.commit();
}
