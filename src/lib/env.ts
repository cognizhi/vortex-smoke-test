import { z } from 'zod';

// During `next build`, Next.js sets NODE_ENV=production but no requests are served yet —
// runtime secrets are not needed for static analysis. Only enforce them at server startup.
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Fail fast in production if AUTH_SECRET is absent.
// A missing secret causes every login/register to 500 silently; a weak one allows JWT forgery (CVSS ~8.8).
if (!isNextBuild && process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  console.error(
    '[FATAL] AUTH_SECRET is not set. ' +
      'The server cannot start in production without a JWT signing secret. ' +
      'Generate one with: openssl rand -hex 32',
  );
  process.exit(1);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid database URL'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Multi-tenant platform domain (e.g. "platform.com")
  PLATFORM_DOMAIN: z.string().min(1).default('platform.com'),

  // Admin JWT signing secret (min 32 hex chars, generate with: openssl rand -hex 32)
  // Required at server startup — the pre-parse guard above ensures it is set in production.
  // Made optional here so `next build` (which sets NODE_ENV=production but serves no requests)
  // does not abort with a missing-secret error during static analysis.
  AUTH_SECRET: z.string().min(32).optional(),

  // HMAC secret for cancel tokens (same length requirement as AUTH_SECRET)
  CANCEL_TOKEN_SECRET: z.string().min(32).optional(),

  // SendGrid transactional email
  SENDGRID_API_KEY: z.string().min(1).optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().default('Booking'),

  // Photo storage (local path in dev, object-store URL in prod)
  PHOTO_STORAGE_PATH: z.string().default('./uploads'),

  // How far ahead (days) customers can book (default: 90 days)
  MAX_BOOKING_DAYS_AHEAD: z.coerce.number().int().positive().default(90),

  // Grace period (days) before cancelled merchant schema is dropped
  SLUG_EXPIRY_GRACE_DAYS: z.coerce.number().int().positive().default(30),

  // Vercel KV / Upstash Redis — used for rate limiting on auth endpoints.
  // Not required in local dev; all rate limiting is skipped when absent.
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
});

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  PLATFORM_DOMAIN: process.env.PLATFORM_DOMAIN,
  AUTH_SECRET: process.env.AUTH_SECRET,
  CANCEL_TOKEN_SECRET: process.env.CANCEL_TOKEN_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME,
  PHOTO_STORAGE_PATH: process.env.PHOTO_STORAGE_PATH,
  MAX_BOOKING_DAYS_AHEAD: process.env.MAX_BOOKING_DAYS_AHEAD,
  SLUG_EXPIRY_GRACE_DAYS: process.env.SLUG_EXPIRY_GRACE_DAYS,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
});

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.issues);
  if (!isNextBuild && process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  if (!isNextBuild) {
    throw new Error('Invalid environment variables');
  }
}

// During `next build`, parsed.data may be undefined (missing runtime-only vars) — that is
// acceptable since no DB queries or auth operations run during static analysis. At server
// startup the pre-parse guards above ensure all required vars are present before any request
// is served.
export const env: Env = (parsed.data ?? {}) as Env;
