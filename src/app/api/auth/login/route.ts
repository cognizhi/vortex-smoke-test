/**
 * POST /api/auth/login
 *
 * Admin login endpoint.
 *
 * Looks up the merchant by owner email in `platform.merchants`, verifies the
 * password, creates a JWT session, and sets an httpOnly cookie.
 *
 * Request body:
 *   { email, password }
 *
 * Response:
 *   200 { data: { merchantId, slug, role }, error: null }
 *   400 { data: null, error: { code: "INVALID_INPUT", message } }
 *   401 { data: null, error: { code: "INVALID_CREDENTIALS", message } }
 *   500 { data: null, error: { code: "INTERNAL", message } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { loginSchema } from '@/lib/validations/auth';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/auth/session';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { env } from '@/lib/env';
import { loginLimiter } from '@/lib/ratelimit';

/** Extract the best-effort client IP from request headers. */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** Generic invalid-credentials message — never reveal which field is wrong. */
function invalidCredsResponse(): NextResponse {
  return NextResponse.json(
    {
      data: null,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    },
    { status: 401 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 0. Rate limit by IP: 10 requests per minute
  const ip = getClientIp(request);
  const rateLimitResult = await loginLimiter.limit(`ip:${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { data: null, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.resetAt - Math.floor(Date.now() / 1000)) },
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

  const parsed = loginSchema.safeParse(body);
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

  const { email, password } = parsed.data;

  // 2. Look up merchant by owner email
  let merchant: {
    id: string;
    slug: string;
    passwordHash: string;
    schemaName: string;
    status: string;
  } | undefined;

  try {
    merchant = await platformDb.query.merchants.findFirst({
      where: eq(merchants.ownerEmail, email),
      columns: {
        id: true,
        slug: true,
        passwordHash: true,
        schemaName: true,
        status: true,
      },
    });
  } catch (err) {
    console.error('[login] DB lookup failed:', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Login failed. Please try again.' } },
      { status: 500 }
    );
  }

  if (!merchant) {
    return invalidCredsResponse();
  }

  // 3. Check merchant is active
  if (merchant.status !== 'active') {
    // Return the same message to avoid leaking account state
    return invalidCredsResponse();
  }

  // 4. Verify password
  const passwordOk = await verifyPassword(password, merchant.passwordHash);
  if (!passwordOk) {
    return invalidCredsResponse();
  }

  // 5. Use merchantId as userId in the session.
  // Full admin user lookup (for multi-admin) will be added in a later sprint.
  const userId = merchant.id;

  // 6. Check AUTH_SECRET
  const authSecret = env.AUTH_SECRET;
  if (!authSecret) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Server configuration error.' } },
      { status: 500 }
    );
  }

  // 7. Create JWT session
  const token = await createSessionToken(
    {
      userId,
      merchantId: merchant.id,
      slug: merchant.slug,
      role: 'owner',
    },
    authSecret
  );

  const response = NextResponse.json(
    {
      data: {
        merchantId: merchant.id,
        slug: merchant.slug,
        role: 'owner',
      },
      error: null,
    },
    { status: 200 }
  );

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
    secure: env.NODE_ENV === 'production',
  });

  return response;
}
