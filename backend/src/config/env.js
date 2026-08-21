import dotenv from 'dotenv';
import { z } from 'zod';

// Load raw environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database Configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  
  // JWT Configuration (at least 16 characters for security)
  JWT_ACCESS_SECRET: z.string().min(16, "Access secret should be at least 16 characters for security"),
  JWT_REFRESH_SECRET: z.string().min(16, "Refresh secret should be at least 16 characters for security"),
  
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  
  // CORS Origin Configuration
  FRONTEND_URL: z.string().url().default('http://localhost:5173')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

// Export the validated variables
export const env = parsed.data;
