"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delhiveryClient = void 0;
const axios_1 = __importDefault(require("axios"));
// Default to test environment if not set
const isProd = process.env.DELHIVERY_ENV === 'production';
const BASE_URL = isProd
    ? 'https://ltl-clients-api.delhivery.com'
    : 'https://ltl-clients-api-dev.delhivery.com';
const API_TOKEN = process.env.DELHIVERY_API_TOKEN || 'dummy_delhivery_token';
exports.delhiveryClient = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${API_TOKEN}`,
    },
});
//# sourceMappingURL=config.js.map