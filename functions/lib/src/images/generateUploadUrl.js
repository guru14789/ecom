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
exports.generateUploadUrl = void 0;
const functions = __importStar(require("firebase-functions/v2"));
exports.generateUploadUrl = functions.https.onCall({ region: 'asia-south1', enforceAppCheck: false }, async (request) => {
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
    }
    catch (error) {
        console.error('Error in generateUploadUrl:', error);
        throw new functions.https.HttpsError('internal', 'Unable to process image upload request.');
    }
});
//# sourceMappingURL=generateUploadUrl.js.map