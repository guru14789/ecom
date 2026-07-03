import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Triggers whenever a document in 'users/{uid}' is created or updated
export const setCustomClaims = functions.firestore.onDocumentWritten(
  'users/{uid}',
  async (event) => {
    const snap = event.data?.after;
    if (!snap || !snap.exists) return; // Deleted document

    const data = snap.data();
    const uid = event.params.uid;
    const role = data.role || 'buyer';

    try {
      await admin.auth().setCustomUserClaims(uid, { role });
      console.log(`Custom claims set for user ${uid} with role ${role}`);
    } catch (error) {
      console.error('Error setting custom claims:', error);
    }
  }
);
