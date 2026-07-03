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
exports.generateShippingLabel = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const config_1 = require("./config");
exports.generateShippingLabel = functions.https.onCall({ region: 'asia-south1', enforceAppCheck: false }, async (request) => {
    var _a, _b, _c;
    try {
        const auth = request.auth;
        if (!auth)
            throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
        const { waybills } = request.data; // Array of waybills (LRNs)
        if (!waybills || waybills.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Waybills are required.');
        }
        // We use the Delhivery Label Generation API
        const waybillString = waybills.join(',');
        const response = await config_1.delhiveryClient.get(`/label/get_urls/A4/${waybillString}`);
        // Response returns a PDF URL
        if (response.data && response.data.packages) {
            return {
                success: true,
                pdfUrls: response.data.packages.map((pkg) => pkg.pdf_url),
            };
        }
        throw new Error('No PDF URL returned');
    }
    catch (error) {
        console.error('Delhivery Label Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        // Fallback for demo
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 401 || ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 403) {
            return {
                success: true,
                pdfUrls: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'], // Mock PDF
                isMock: true
            };
        }
        throw new functions.https.HttpsError('internal', 'Unable to generate shipping label.');
    }
});
//# sourceMappingURL=labelService.js.map