/**
 * POST /api/auth/register
 *
 * Merchant registration endpoint.
 *
 * Steps:
 *   1. Validate input (Zod)
 *   2. Check slug uniqueness (authoritative DB check)
 *   3. Check email uniqueness
 *   4. Hash password (bcrypt 12)
 *   5. Provision merchant (platform.merchants + private schema + seed data)
 *   6. Create JWT session
 *   7. Set httpOnly cookie and return merchant info
 *
 * Request body:
 *   { businessName, slug, ownerEmail, ownerName, password }
 *
 * Response:
 *   201 { data: { merchantId, slug, dashboardUrl }, error: null }
 *   400 { data: null, error: { code, message, details? } }
 *   409 { data: null, error: { code: "SLUG_TAKEN" | "EMAIL_TAKEN", message } }
 *   500 { data: null, error: { code: "INTERNAL", message } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { registerSchema } from '@/lib/validations/auth';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/auth/session';
import { provisionMerchant } from '@/lib/db/provision-merchant';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { env } from '@/lib/env';
import { registerLimiter, registerEmailLimiter } from '@/lib/ratelimit';

/** Extract the best-effort client IP from request headers. */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 0. Rate limit by IP: 5 requests per hour
  const ip = getClientIp(request);
  const ipRateLimit = await registerLimiter.limit(`ip:${ip}`);
  if (!ipRateLimit.success) {
    return NextResponse.json(
      { data: null, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
      {
        status: 429,
        headers: { 'Retry-After': String(ipRateLimit.resetAt - Math.floor(Date.now() / 1000)) },
      }
    );
  }

  // 1. Parse + validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const { businessName, slug, ownerEmail, ownerName, password } = parsed.data;

  // 1a. Per-email rate limit: 3 requests per day per email address
  const emailRateLimit = await registerEmailLimiter.limit(`email:${ownerEmail}`);
  if (!emailRateLimit.success) {
    return NextResponse.json(
      { data: null, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
      {
        status: 429,
        headers: { 'Retry-After': String(emailRateLimit.resetAt - Math.floor(Date.now() / 1000)) },
      }
    );
  }

  // 2. Check slug uniqueness (authoritative)
  let slugConflict: { slug: string } | undefined;
  try {
    slugConflict = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, slug),
      columns: { slug: true },
    });
  } catch {
    slugConflict = undefined;
  }

  if (slugConflict) {
    return NextResponse.json(
      { data: null, error: { code: 'SLUG_TAKEN', message: 'This subdomain is already taken.' } },
      { status: 409 }
    );
  }

  // 3. Check email uniqueness
  let emailConflict: { ownerEmail: string } | undefined;
  try {
    emailConflict = await platformDb.query.merchants.findFirst({
      where: eq(merchants.ownerEmail, ownerEmail),
      columns: { ownerEmail: true },
    });
  } catch {
    emailConflict = undefined;
  }

  if (emailConflict) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' },
      },
      { status: 409 }
    );
  }

  // 4. Hash password
  const passwordHash = await hashPassword(password);

  // 5. Provision merchant (creates platform.merchants row + private schema)
  let provisionResult: Awaited<ReturnType<typeof provisionMerchant>>;
  try {
    provisionResult = await provisionMerchant({
      slug,
      businessName,
      ownerEmail,
      passwordHash,
      ownerName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Duplicate slug/email can race between our check and provisionMerchant
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json(
        { data: null, error: { code: 'SLUG_TAKEN', message: 'This subdomain is already taken.' } },
        { status: 409 }
      );
    }
    console.error('[register] provisionMerchant failed:', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Registration failed. Please try again.' } },
      { status: 500 }
    );
  }

  // 6. Use merchantId as userId in the session.
  // The admin_users record was seeded by provisionMerchant with the same email.
  // Full admin user lookup will be added when the admin panel expands to multi-admin.
  const userId = provisionResult.merchantId;

  // 7. Create JWT session
  const authSecret = env.AUTH_SECRET;
  if (!authSecret) {
    console.error('[register] AUTH_SECRET not set — cannot create session');
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Server configuration error.' } },
      { status: 500 }
    );
  }

  const token = await createSessionToken(
    {
      userId,
      merchantId: provisionResult.merchantId,
      slug,
      role: 'owner',
    },
    authSecret
  );

  // Build response
  const response = NextResponse.json(
    {
      data: {
        merchantId: provisionResult.merchantId,
        slug,
        dashboardUrl: provisionResult.dashboardUrl,
      },
      error: null,
    },
    { status: 201 }
  );

  // Set httpOnly session cookie
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
    secure: env.NODE_ENV === 'production',
  });

  return response;
}
