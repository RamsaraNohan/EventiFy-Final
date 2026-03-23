import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.string().default('3306'),
  MYSQL_USER: z.string().default('eventify_user'),
  MYSQL_PASSWORD: z.string().default('eventify_password'),
  MYSQL_DB: z.string().default('eventify'),

  JWT_SECRET: z.string().default('super-secret-jwt-key'),
  COOKIE_SECRET: z.string().default('super-secret-cookie-key'),

  ADMIN_EMAIL: z.string().email().default('admin@eventify.local'),
  
  PAYHERE_MERCHANT_ID: z.string().default('1234614'),
  PAYHERE_SECRET: z.string().default('Mzk5NDg0NzE1MzE2MDM3Mjk1MzQ2NTcyMzcxOTY5OTg2MTA0NDU='),
  
  // New env vars for Phase 0
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@eventify.com'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  ENCRYPTION_KEY: z.string().default('this-is-a-32-character-dummy-key'), // 32 chars exactly
  OPENAI_API_KEY: z.string().optional(),
  
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
