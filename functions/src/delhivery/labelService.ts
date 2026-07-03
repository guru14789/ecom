import * as functions from 'firebase-functions/v2';
import { delhiveryClient } from './config';

export const generateShippingLabel = functions.https.onCall(
  { region: 'asia-south1', enforceAppCheck: false },
  async (request) => {
    try {
      const auth = request.auth;
      if (!auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

      const { waybills } = request.data; // Array of waybills (LRNs)
      if (!waybills || waybills.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Waybills are required.');
      }

      // We use the Delhivery Label Generation API
      const waybillString = waybills.join(',');
      const response = await delhiveryClient.get(`/label/get_urls/A4/${waybillString}`);
      
      // Response returns a PDF URL
      if (response.data && response.data.packages) {
        return {
          success: true,
          pdfUrls: response.data.packages.map((pkg: any) => pkg.pdf_url),
        };
      }

      throw new Error('No PDF URL returned');
    } catch (error: any) {
      console.error('Delhivery Label Error:', error.response?.data || error.message);
      // Fallback for demo
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 400) {
        return {
          success: true,
          pdfUrls: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'], // Mock PDF
          isMock: true
        };
      }
      throw new functions.https.HttpsError('internal', 'Unable to generate shipping label.');
    }
  }
);
