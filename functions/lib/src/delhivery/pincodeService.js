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
exports.checkPincodeServiceability = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const config_1 = require("./config");
exports.checkPincodeServiceability = functions.https.onCall({ region: 'asia-south1', enforceAppCheck: false }, async (request) => {
    var _a, _b, _c;
    try {
        const { pincode } = request.data;
        if (!pincode) {
            throw new functions.https.HttpsError('invalid-argument', 'Pincode is required.');
        }
        // Check serviceability
        const response = await config_1.delhiveryClient.get(`/pincode-service/${pincode}`);
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
    }
    catch (error) {
        console.error('Delhivery Pincode Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        // Fallback for demo purposes if API token is invalid
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 401 || ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 403) {
            return {
                isServiceable: true, // Mock success if unauthorized for UI demo
                isMock: true,
                details: { state: 'Mock State', city: 'Mock City' }
            };
        }
        throw new functions.https.HttpsError('internal', 'Unable to verify pincode serviceability.');
    }
});
//# sourceMappingURL=pincodeService.js.map