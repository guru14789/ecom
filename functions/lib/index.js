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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
// Load service account explicitly to avoid environment variable issues
const serviceAccount = require('../../shopyng-32aa3-firebase-adminsdk-fbsvc-590e9081ed.json');
// Initialize the Admin SDK once
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// Export Razorpay Functions
__exportStar(require("./razorpay/createOrder"), exports);
__exportStar(require("./razorpay/verifyPayment"), exports);
__exportStar(require("./razorpay/webhook"), exports);
// Export Auth Functions
__exportStar(require("./auth/setCustomClaims"), exports);
// Export Image Upload Functions
__exportStar(require("./images/generateUploadUrl"), exports);
// Export Delhivery Functions
__exportStar(require("./delhivery/pincodeService"), exports);
__exportStar(require("./delhivery/shipmentService"), exports);
__exportStar(require("./delhivery/labelService"), exports);
//# sourceMappingURL=index.js.map