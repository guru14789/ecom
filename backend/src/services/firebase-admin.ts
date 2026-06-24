import admin from 'firebase-admin';
import path from 'path';

let app: admin.app.App | null = null;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  const credential = serviceAccountPath
    ? admin.credential.cert(require(path.resolve(serviceAccountPath)))
    : admin.credential.applicationDefault();

  app = admin.initializeApp({ credential });
  console.log('Firebase Admin initialized' + (serviceAccountPath ? ' with service account' : ''));
} catch (err) {
  console.warn('Firebase Admin initialization failed (non-fatal):', (err as Error).message);
}

export async function verifyFirebaseToken(token: string): Promise<{
  uid: string;
  phone_number?: string;
  email?: string;
  name?: string;
  picture?: string;
}> {
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }
  const decoded = await admin.auth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    phone_number: decoded.phone_number,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
}

export default app;
