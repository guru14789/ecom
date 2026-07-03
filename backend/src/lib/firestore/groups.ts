import { db, fromDoc, fromQuery, now, increment } from './client';

export interface GroupSession {
  id: string;
  productId: string;
  hostUserId: string;
  targetCount: number;
  currentCount: number;
  shareCode: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  participants: string[];
  endsAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('group_sessions');
export const getGroupById = (id: string) => fromDoc<GroupSession>(col().doc(id).get() as any);
export const getGroupByShareCode = async (code: string) => {
  const snap = await col().where('shareCode', '==', code).where('status', '==', 'active').limit(1).get();
  return snap.empty ? null : fromDoc<GroupSession>(snap.docs[0]);
};
export const createGroup = async (data: Omit<GroupSession, 'id' | 'createdAt'>) => {
  const ref = col().doc();
  await ref.set({ ...data, createdAt: now() });
  return { id: ref.id, ...data } as GroupSession;
};
export const joinGroup = async (id: string, userId: string) => {
  const admin2 = require('firebase-admin');
  await col().doc(id).update({
    currentCount: increment(1),
    participants: admin2.firestore.FieldValue.arrayUnion(userId),
  });
};
export const updateGroupStatus = (id: string, status: GroupSession['status']) =>
  col().doc(id).update({ status, ...(status === 'completed' ? { completedAt: now() } : {}) });
