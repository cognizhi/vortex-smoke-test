/**
 * Rate limiting utility for auth endpoints.
 *
 * Uses @upstash/ratelimit with @upstash/redis (Vercel KV) in production.
 * Falls back gracefully when KV env vars are not set (local dev / test) — all
 * requests are allowed and a warning is logged once.
 *
 * Usage:
 *   import { loginLimiter, registerLimiter } from '@/lib/ratelimit';
 *
 *   const result = await loginLimiter('ip:192.168.1.1');
 *   if (!result.success) {
 *     return new Response('Too many requests', { status: 429 });
 *   }
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean;
  /** Epoch seconds when the rate limit window resets (for Retry-After header). */
  resetAt: number;
}

// ---------------------------------------------------------------------------
// No-op limiter for local dev / test environments without KV credentials
// ---------------------------------------------------------------------------

let _warnedAboutMissingKv = false;

function noopLimiter(): { limit: (_key: string) => Promise<RateLimitResult> } {
  return {
    async limit(_key: string): Promise<RateLimitResult> {
      if (!_warnedAboutMissingKv) {
        console.warn(
          '[ratelimit] KV_REST_API_URL or KV_REST_API_TOKEN is not set. ' +
            'Rate limiting is DISABLED — configure Vercel KV (or Upstash Redis) in production.'
        );
        _warnedAboutMissingKv = true;
      }
      return { success: true, resetAt: Math.floor(Date.now() / 1000) + 60 };
    },
  };
}

// ---------------------------------------------------------------------------
// Build a real Upstash limiter, or fall back to no-op
// ---------------------------------------------------------------------------

function buildLimiter(
  limiterFactory: (redis: Redis) => Ratelimit
): { limit: (key: string) => Promise<RateLimitResult> } {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return noopLimiter();
  }

  const redis = new Redis({ url, token });
  const ratelimit = limiterFactory(redis);

  return {
    async limit(key: string): Promise<RateLimitResult> {
      const result = await ratelimit.limit(key);
      return {
        success: result.success,
        resetAt: Math.floor(result.reset / 1000),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Login limiter: 10 requests per minute per IP (sliding window)
// ---------------------------------------------------------------------------

export const loginLimiter = buildLimiter(
  (redis) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: '@upstash/ratelimit:login',
    })
);

// ---------------------------------------------------------------------------
// Register limiter: 5 requests per hour per IP (sliding window)
// ---------------------------------------------------------------------------

export const registerLimiter = buildLimiter(
  (redis) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: '@upstash/ratelimit:register',
    })
);

// ---------------------------------------------------------------------------
// Per-email register limiter: 3 requests per day per email (sliding window)
// ---------------------------------------------------------------------------

export const registerEmailLimiter = buildLimiter(
  (redis) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '24 h'),
      prefix: '@upstash/ratelimit:register:email',
    })
);
