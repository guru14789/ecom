import * as admin from 'firebase-admin';

// Load service account explicitly to avoid environment variable issues
const serviceAccount = require('../../shopyng-32aa3-firebase-adminsdk-fbsvc-590e9081ed.json');

// Initialize the Admin SDK once
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Export Razorpay Functions
export * from './razorpay/createOrder';
export * from './razorpay/verifyPayment';
export * from './razorpay/webhook';

// Export Auth Functions
export * from './auth/setCustomClaims';

// Export Image Upload Functions
export * from './images/generateUploadUrl';

// Export Delhivery Functions
export * from './delhivery/pincodeService';
export * from './delhivery/shipmentService';
export * from './delhivery/labelService';
