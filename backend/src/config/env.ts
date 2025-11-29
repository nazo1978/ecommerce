import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  },

  aws: {
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    s3Region: process.env.AWS_S3_REGION || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
  },

  firebase: {
    serverKey: process.env.FIREBASE_SERVER_KEY || '',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3002',
};
