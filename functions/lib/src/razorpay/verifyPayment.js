"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
exports.verifyPayment = functions.https.onCall({ region: 'asia-south1', enforceAppCheck: false }, async (request) => {
    try {
        const auth = request.auth;
        if (!auth)
            throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
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
            paymentStatus: 'paid',
            status: 'confirmed',
            razorpayPaymentId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, orderId: firestoreOrderId };
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        throw new functions.https.HttpsError('internal', 'Unable to verify payment.');
    }
});
//# sourceMappingURL=verifyPayment.js.map