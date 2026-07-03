import axios from 'axios';

// Default to test environment if not set
const isProd = process.env.DELHIVERY_ENV === 'production';
const BASE_URL = isProd 
  ? 'https://ltl-clients-api.delhivery.com' 
  : 'https://ltl-clients-api-dev.delhivery.com';

const API_TOKEN = process.env.DELHIVERY_API_TOKEN || 'dummy_delhivery_token';

export const delhiveryClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${API_TOKEN}`,
  },
});
