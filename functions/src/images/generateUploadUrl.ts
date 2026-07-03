import * as functions from 'firebase-functions/v2';

export const generateUploadUrl = functions.https.onCall(
  { region: 'asia-south1', enforceAppCheck: false },
  async (request) => {
    try {
      const auth = request.auth;
      if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to upload images.');
      }

      // Cloudflare Account ID and API Token should be stored in environment variables
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (!accountId || !apiToken) {
        console.error('Cloudflare credentials missing in environment.');
        throw new functions.https.HttpsError('internal', 'Image upload service is not fully configured.');
      }

      // Request a direct upload URL from Cloudflare Images API
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudflare API Error:', errorText);
        throw new functions.https.HttpsError('internal', 'Failed to generate image upload URL.');
      }

      const data = await response.json();
      
      // Cloudflare returns uploadURL (where frontend posts the file) and id (image identifier)
      return {
        uploadUrl: data.result.uploadURL,
        imageId: data.result.id,
        // The public URL can usually be constructed based on your Cloudflare Image Delivery URL
        publicUrl: `https://imagedelivery.net/<YOUR_ACCOUNT_HASH>/${data.result.id}/public`
      };
    } catch (error: any) {
      console.error('Error in generateUploadUrl:', error);
      throw new functions.https.HttpsError('internal', 'Unable to process image upload request.');
    }
  }
);
