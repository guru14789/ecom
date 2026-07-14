import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // Cloudflare R2
  CF_R2_ACCESS_KEY_ID: process.env.CF_R2_ACCESS_KEY_ID || '',
  CF_R2_SECRET_ACCESS_KEY: process.env.CF_R2_SECRET_ACCESS_KEY || '',
  CF_R2_BUCKET_NAME: process.env.CF_R2_BUCKET_NAME || '',
  CF_R2_ENDPOINT: process.env.CF_R2_ENDPOINT || '', // e.g. https://<accountId>.r2.cloudflarestorage.com
  CF_R2_PUBLIC_URL: process.env.CF_R2_PUBLIC_URL || '',   // e.g. https://cdn.shopsyy.com

  // SMS (optional fallback)
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'console',
  MSG91_API_KEY: process.env.MSG91_API_KEY || '',
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || '',

  // Logistics
  DELHIVERY_API_KEY: process.env.DELHIVERY_API_KEY || '',
  DELHIVERY_API_SECRET: process.env.DELHIVERY_API_SECRET || '',

  // SMTP (optional email)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',

  // JWT (kept for existing frontend token flow if needed)
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  
  // Verification APIs
  GST_VERIFY_API_KEY: process.env.GST_VERIFY_API_KEY || '',

  // Cloudflare Images
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_IMAGES_API_TOKEN: process.env.CLOUDFLARE_IMAGES_API_TOKEN || '',
  CLOUDFLARE_IMAGE_HASH: process.env.CLOUDFLARE_IMAGE_HASH || '',
};
