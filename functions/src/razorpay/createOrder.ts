import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';

export const createRazorpayOrder = functions.https.onCall(
  { region: 'asia-south1', enforceAppCheck: false },
  async (request) => {
    try {
      const auth = request.auth;
      if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
      }

      const { items, deliveryAddress, totalAmount, vendorId } = request.data;
      if (!items || !totalAmount || !vendorId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid order details.');
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
      });

      // Create Razorpay Order
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });

      // Save Initial Order Document as "pending"
      const orderRef = await admin.firestore().collection('orders').add({
        buyerId: auth.uid,
        vendorId,
        items,
        deliveryAddress,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'razorpay',
        razorpayOrderId: rzpOrder.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        firestoreOrderId: orderRef.id,
      };
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new functions.https.HttpsError('internal', 'Unable to process payment order.');
    }
  }
);
