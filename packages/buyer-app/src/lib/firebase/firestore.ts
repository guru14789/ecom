import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './index';

export const db = getFirestore(app);

export { Timestamp, serverTimestamp };

export async function getDocument<T = DocumentData>(collectionName: string, docId: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

export async function setDocument(collectionName: string, docId: string, data: DocumentData) {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function createDocument(collectionName: string, data: DocumentData) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(collectionName: string, docId: string, data: Partial<DocumentData>) {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function queryDocuments<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function getUserProfile(userId: string) {
  return getDocument<{
    id: string;
    phoneNumber?: string;
    email?: string;
    fullName?: string;
    avatar?: string;
    addresses?: Array<{
      houseNo: string;
      area: string;
      pincode: string;
      landmark: string;
      city?: string;
      state?: string;
      tag: string;
    }>;
    createdAt?: Timestamp;
  }>('users', userId);
}

export async function createUserProfile(userId: string, data: {
  phoneNumber?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
}) {
  await setDocument('users', userId, {
    ...data,
    createdAt: serverTimestamp(),
  });
}
