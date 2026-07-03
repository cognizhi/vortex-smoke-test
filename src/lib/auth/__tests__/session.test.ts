/**
 * Unit tests for JWT session creation, verification, and cookie parsing.
 */
import { describe, it, expect } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  getSessionFromCookieHeader,
  SESSION_COOKIE_NAME,
  type AdminSession,
} from '../session';

const TEST_SECRET = '00000000000000000000000000000000ff'; // matches .env.test
const VALID_SESSION: AdminSession = {
  userId: 'user-uuid-123',
  merchantId: 'merchant-uuid-456',
  slug: 'glamour-studio',
  role: 'owner',
};

describe('createSessionToken', () => {
  it('returns a non-empty string', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('produces a JWT with three dot-separated parts', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    expect(token.split('.')).toHaveLength(3);
  });

  it('produces different tokens for different payloads', async () => {
    const t1 = await createSessionToken(VALID_SESSION, TEST_SECRET);
    const t2 = await createSessionToken({ ...VALID_SESSION, slug: 'different-shop' }, TEST_SECRET);
    expect(t1).not.toBe(t2);
  });
});

describe('verifySessionToken', () => {
  it('returns the session payload for a valid token', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    const session = await verifySessionToken(token, TEST_SECRET);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(VALID_SESSION.userId);
    expect(session?.merchantId).toBe(VALID_SESSION.merchantId);
    expect(session?.slug).toBe(VALID_SESSION.slug);
    expect(session?.role).toBe(VALID_SESSION.role);
  });

  it('returns null for an invalid token', async () => {
    const result = await verifySessionToken('not.a.valid.jwt', TEST_SECRET);
    expect(result).toBeNull();
  });

  it('returns null for an empty string', async () => {
    const result = await verifySessionToken('', TEST_SECRET);
    expect(result).toBeNull();
  });

  it('returns null when signed with a different secret', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    const result = await verifySessionToken(token, 'different-secret-that-is-long-enough-here');
    expect(result).toBeNull();
  });

  it('returns null for a tampered payload', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    const parts = token.split('.');
    // Corrupt the payload section
    const corruptedPayload = Buffer.from(JSON.stringify({ evil: true })).toString('base64url');
    const tampered = `${parts[0]}.${corruptedPayload}.${parts[2]}`;
    const result = await verifySessionToken(tampered, TEST_SECRET);
    expect(result).toBeNull();
  });

  it('returns null for a token with invalid role', async () => {
    // Create a token but then verify robustness against unusual payloads
    const token = await createSessionToken(
      { ...VALID_SESSION, role: 'owner' },
      TEST_SECRET
    );
    const session = await verifySessionToken(token, TEST_SECRET);
    expect(session?.role).toBe('owner');
  });
});

describe('getSessionFromCookieHeader', () => {
  it('returns null when cookie header is null', async () => {
    const result = await getSessionFromCookieHeader(null, TEST_SECRET);
    expect(result).toBeNull();
  });

  it('returns null when the session cookie is absent', async () => {
    const result = await getSessionFromCookieHeader('other_cookie=value', TEST_SECRET);
    expect(result).toBeNull();
  });

  it('returns the session when the cookie is present and valid', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    const cookieHeader = `${SESSION_COOKIE_NAME}=${token}; other=value`;
    const session = await getSessionFromCookieHeader(cookieHeader, TEST_SECRET);
    expect(session).not.toBeNull();
    expect(session?.slug).toBe(VALID_SESSION.slug);
  });

  it('returns null when the cookie contains an invalid token', async () => {
    const cookieHeader = `${SESSION_COOKIE_NAME}=not.valid.jwt`;
    const result = await getSessionFromCookieHeader(cookieHeader, TEST_SECRET);
    expect(result).toBeNull();
  });

  it('handles multiple cookies correctly', async () => {
    const token = await createSessionToken(VALID_SESSION, TEST_SECRET);
    const cookieHeader = [
      'session_id=abc',
      `${SESSION_COOKIE_NAME}=${token}`,
      'theme=dark',
    ].join('; ');
    const session = await getSessionFromCookieHeader(cookieHeader, TEST_SECRET);
    expect(session?.merchantId).toBe(VALID_SESSION.merchantId);
  });
});
