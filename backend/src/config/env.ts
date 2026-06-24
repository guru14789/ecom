import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsyy_dev',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  ACCESS_TOKEN_EXPIRY: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '900', 10),
  REFRESH_TOKEN_EXPIRY: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10),

  SMS_PROVIDER: process.env.SMS_PROVIDER || 'console',
  MSG91_API_KEY: process.env.MSG91_API_KEY || '',
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE: process.env.TWILIO_PHONE || '',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  POSTGRES_URI: process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/shopyng',
  DELHIVERY_API_KEY: process.env.DELHIVERY_API_KEY || '',
  DELHIVERY_API_SECRET: process.env.DELHIVERY_API_SECRET || '',

  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
  COGNITO_REGION: process.env.COGNITO_REGION || 'ap-south-1',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_SECURE: process.env.SMTP_SECURE || 'false',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
};
