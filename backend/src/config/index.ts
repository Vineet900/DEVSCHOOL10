import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ─── Environment Schema (Zod-validated) ──────────────────────────────────────
// Every required variable is declared here. If any are missing at startup,
// the process exits immediately with a descriptive error — "fail fast" pattern.
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET: z.string().min(10),

  // Database (Prisma)
  DATABASE_URL: z.string().url(),

  // CORS / Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // JWT (custom tokens if needed)
  JWT_EXPIRE: z.string().default('30d'),

  // AI — loaded at boot. Admin can override at runtime via DB settings,
  // but we NEVER write back to this file.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  // Optional: OpenRouter fallback
  OPENROUTER_API_KEY: z.string().optional(),

  // Cloudinary (uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

type EnvVars = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Missing or invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const env: EnvVars = parsed.data;

// ─── Exported Config ──────────────────────────────────────────────────────────
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',

  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },

  database: {
    url: env.DATABASE_URL,
  },

  cors: {
    origin: env.FRONTEND_URL,
  },

  jwt: {
    expire: env.JWT_EXPIRE,
  },

  ai: {
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL,
    openRouterKey: env.OPENROUTER_API_KEY,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
} as const;
