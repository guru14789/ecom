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

      const { items, deliveryAddress, totalAmount, vendorId, pointsUsed } = request.data;
      if (!items || !totalAmount || !vendorId) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid order details.');
      }

      let pointsDiscount = 0;
      const parsedPointsUsed = pointsUsed ? parseInt(pointsUsed, 10) : 0;
      const pointsEarned = Math.floor(totalAmount / 100) * 10;

      if (parsedPointsUsed > 0) {
        const userRef = admin.firestore().collection('users').doc(auth.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'User not found.');
        }
        
        const currentPoints = userDoc.data()?.pointsBalance || 0;
        if (parsedPointsUsed > currentPoints) {
          throw new functions.https.HttpsError('failed-precondition', 'Insufficient points balance.');
        }

        pointsDiscount = parsedPointsUsed / 10;
        
        // Deduct points
        await userRef.update({
          pointsBalance: FieldValue.increment(-parsedPointsUsed)
        });
      }

      const finalAmount = Math.max(0, totalAmount - pointsDiscount);

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
      });

      // Create Razorpay Order
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100), // paise
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
        pointsUsed: parsedPointsUsed,
        pointsEarned,
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
