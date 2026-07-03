import { db, fromQuery, now } from './client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('notifications');

export const createNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
  const ref = col().doc();
  await ref.set({ ...data, isRead: false, createdAt: now() });
  return { id: ref.id, ...data, isRead: false } as Notification;
};
export const getUserNotifications = async (userId: string, limit = 20) =>
  fromQuery<Notification>(await col().where('userId', '==', userId).orderBy('createdAt', 'desc').limit(limit).get());
export const markRead = (id: string) => col().doc(id).update({ isRead: true });
export const markAllRead = async (userId: string) => {
  const snap = await col().where('userId', '==', userId).where('isRead', '==', false).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
  await batch.commit();
};
