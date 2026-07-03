/**
 * Cancel token generation and URL construction.
 *
 * A cancel token is a URL-safe string embedded in the cancel link sent to
 * customers after a booking is confirmed.  The current implementation uses
 * the booking's UUID `cancelToken` column directly — no HMAC is required
 * because the UUID is already cryptographically random (122 bits of entropy),
 * which is sufficient for an opaque cancel link.
 *
 * The URL format is:
 *   https://{slug}.{domain}/cancel/{cancelToken}
 *
 * If the CANCEL_TOKEN_SECRET environment variable is set, the module will
 * produce a keyed HMAC token instead (`{bookingId}.{base64url(hmac)}`)
 * as specified in the architecture blueprint.  This provides an extra
 * integrity guarantee that binds the token to the booking's start time
 * (making it impossible to re-use a token after a reschedule).
 *
 * For MVP, the plain-UUID path is the default to keep provisioning simple
 * (no secret required in dev/staging).  Set CANCEL_TOKEN_SECRET to opt in
 * to the HMAC path in production.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../env';

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Build the full cancel URL for a booking.
 *
 * @param slug        Merchant subdomain (e.g. "glamour-studio")
 * @param cancelToken The token stored on the booking row
 * @param domain      The platform root domain (defaults to PLATFORM_DOMAIN env var)
 */
export function buildCancelUrl(
  slug: string,
  cancelToken: string,
  domain: string = env.PLATFORM_DOMAIN
): string {
  return `https://${slug}.${domain}/cancel/${cancelToken}`;
}

// ---------------------------------------------------------------------------
// HMAC token support (optional — activated by CANCEL_TOKEN_SECRET)
// ---------------------------------------------------------------------------

/**
 * Generate an HMAC-signed cancel token that binds the booking to its start time.
 *
 * Format: `{bookingId}.{base64url(HMAC-SHA256(bookingId:startTimeISO, secret))}`
 *
 * Only used when CANCEL_TOKEN_SECRET is set.
 */
export function generateHmacCancelToken(bookingId: string, startTime: Date): string {
  const secret = env.CANCEL_TOKEN_SECRET;
  if (!secret) {
    throw new Error('CANCEL_TOKEN_SECRET is required for HMAC token generation');
  }
  const message = `${bookingId}:${startTime.toISOString()}`;
  const hmac = createHmac('sha256', secret)
    .update(message)
    .digest('base64url');
  return `${bookingId}.${hmac}`;
}

/**
 * Verify an HMAC cancel token against a known booking ID and start time.
 *
 * Returns `true` if the token is authentic, `false` otherwise.
 * Uses `timingSafeEqual` to prevent timing-attack leakage.
 */
export function verifyHmacCancelToken(
  token: string,
  bookingId: string,
  startTime: Date
): boolean {
  const secret = env.CANCEL_TOKEN_SECRET;
  if (!secret) return false;

  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const providedHmac = token.substring(dotIndex + 1);
  const expectedHmac = createHmac('sha256', secret)
    .update(`${bookingId}:${startTime.toISOString()}`)
    .digest('base64url');

  try {
    return timingSafeEqual(
      Buffer.from(providedHmac, 'base64url'),
      Buffer.from(expectedHmac, 'base64url')
    );
  } catch {
    return false;
  }
}

/**
 * Check whether the platform is configured to use HMAC tokens.
 */
export function isHmacTokenEnabled(): boolean {
  return Boolean(env.CANCEL_TOKEN_SECRET && env.CANCEL_TOKEN_SECRET.length >= 32);
}
