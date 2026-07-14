import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  console.log("FIREBASE_SERVICE_ACCOUNT_PATH is:", serviceAccountPath);
  console.log("CWD is:", process.cwd());
  
  const credential = serviceAccountPath
    ? admin.credential.cert(require(serviceAccountPath))
    : admin.credential.applicationDefault();

  admin.initializeApp({
    credential,
    storageBucket: 'sree-projects-78f50.appspot.com'
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();

// ─── Helpers ──────────────────────────────────────────────────────────────────
export type FirestoreDoc = admin.firestore.DocumentData;
export type Timestamp = admin.firestore.Timestamp;

/** Convert Firestore doc snapshot to plain object with `id` field */
export function fromDoc<T>(snap: admin.firestore.DocumentSnapshot): T | null {
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as unknown as T;
}

/** Convert a query snapshot to an array of typed objects */
export function fromQuery<T>(snap: admin.firestore.QuerySnapshot): T[] {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
}

/** Current server timestamp */
export const now = () => admin.firestore.FieldValue.serverTimestamp();

/** Increment a numeric field */
export const increment = (n: number) => admin.firestore.FieldValue.increment(n);

/** Array union / remove helpers */
export const arrayUnion = (...items: unknown[]) => admin.firestore.FieldValue.arrayUnion(...items);
export const arrayRemove = (...items: unknown[]) => admin.firestore.FieldValue.arrayRemove(...items);

export default admin;
