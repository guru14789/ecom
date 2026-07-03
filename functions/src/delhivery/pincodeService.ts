import * as functions from 'firebase-functions/v2';
import { delhiveryClient } from './config';

export const checkPincodeServiceability = functions.https.onCall(
  { region: 'asia-south1', enforceAppCheck: false },
  async (request) => {
    try {
      const { pincode } = request.data;
      if (!pincode) {
        throw new functions.https.HttpsError('invalid-argument', 'Pincode is required.');
      }

      // Check serviceability
      const response = await delhiveryClient.get(`/pincode-service/${pincode}`);
      
      // Delhivery returns an array of facilities or an empty array/error if unserviceable
      if (response.data && response.data.length > 0) {
        return {
          isServiceable: true,
          details: response.data[0],
        };
      }

      return {
        isServiceable: false,
        message: 'Delivery not available for this pincode.',
      };
    } catch (error: any) {
      console.error('Delhivery Pincode Error:', error.response?.data || error.message);
      // Fallback for demo purposes if API token is invalid
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 400) {
        return {
          isServiceable: true, // Mock success if unauthorized for UI demo
          isMock: true,
          details: { state: 'Mock State', city: 'Mock City' }
        };
      }
      throw new functions.https.HttpsError('internal', 'Unable to verify pincode serviceability.');
    }
  }
);
