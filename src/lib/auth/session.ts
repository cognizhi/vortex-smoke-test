/**
 * JWT-based admin session management.
 *
 * Sessions are stored as httpOnly, sameSite:strict cookies.
 * Token payload: { userId, merchantId, slug, role }
 * Signed with HS256 using AUTH_SECRET from env.ts.
 * TTL: 7 days.
 */
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'admin_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AdminSession {
  /** admin_users.id in the merchant schema */
  userId: string;
  /** platform.merchants.id */
  merchantId: string;
  /** Merchant URL slug */
  slug: string;
  /** Role within the merchant account */
  role: 'owner' | 'admin';
}

/**
 * Thrown when a request requires authentication but none is present or valid.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Sign a new JWT session token.
 *
 * @param session  Session payload
 * @param secret   The AUTH_SECRET value (passed explicitly to keep this
 *                 function pure / testable without mocking `env`)
 */
export async function createSessionToken(
  session: AdminSession,
  secret: string
): Promise<string> {
  const payload: Record<string, unknown> = {
    userId: session.userId,
    merchantId: session.merchantId,
    slug: session.slug,
    role: session.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey(secret));
}

/**
 * Verify a JWT session token and return the decoded payload.
 * Returns `null` if the token is invalid or expired.
 *
 * @param token   The raw JWT string
 * @param secret  The AUTH_SECRET value
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret));
    const { userId, merchantId, slug, role } = payload as Record<string, unknown>;
    if (
      typeof userId !== 'string' ||
      typeof merchantId !== 'string' ||
      typeof slug !== 'string' ||
      (role !== 'owner' && role !== 'admin')
    ) {
      return null;
    }
    return { userId, merchantId, slug, role };
  } catch {
    return null;
  }
}

/**
 * Build cookie attributes for the session cookie.
 * Used by API routes when setting the `Set-Cookie` header.
 */
export function buildSessionCookieAttributes(options?: {
  maxAge?: number;
  expires?: Date;
}): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
  ];
  if (options?.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options?.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }
  return parts.join('; ');
}

/**
 * Extract and verify the session token from a `Cookie` header string.
 * Returns the decoded session or null if absent/invalid.
 *
 * @param cookieHeader  The raw `Cookie` header value from the request
 * @param secret        The AUTH_SECRET value
 */
export async function getSessionFromCookieHeader(
  cookieHeader: string | null,
  secret: string
): Promise<AdminSession | null> {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((part) => {
      const [k, ...rest] = part.trim().split('=');
      return [k.trim(), rest.join('=').trim()];
    })
  );

  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  return verifySessionToken(token, secret);
}
