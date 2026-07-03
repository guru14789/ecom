import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

export const verifyPayment = functions.https.onCall(
  { region: 'asia-south1', enforceAppCheck: false },
  async (request) => {
    try {
      const auth = request.auth;
      if (!auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, firestoreOrderId } = request.data;
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !firestoreOrderId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing payment details.');
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
      
      // Verify HMAC Signature
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment verification failed.');
      }

      // Update Firestore Order
      const orderRef = admin.firestore().collection('orders').doc(firestoreOrderId);
      await orderRef.update({
        status: 'confirmed',
        paymentStatus: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, orderId: firestoreOrderId };
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw new functions.https.HttpsError('internal', 'Unable to verify payment.');
    }
  }
);
