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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
