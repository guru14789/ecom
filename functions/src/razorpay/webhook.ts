import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  // Add webhook signature validation in a real app
  const event = req.body.event;
  const payload = req.body.payload;

  try {
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      // You'd typically find the order by razorpayOrderId and update it
      // For this mock implementation, we just log it
      console.log(`Payment captured for: ${payment.id}`);
    } else if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      console.log(`Payment failed for: ${payment.id}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Error');
  }
});
