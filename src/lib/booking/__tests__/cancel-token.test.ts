/**
 * Unit tests for cancel-token utilities.
 *
 * Covers: buildCancelUrl, generateHmacCancelToken, verifyHmacCancelToken,
 * and isHmacTokenEnabled.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock env — must use vi.hoisted so the object exists when vi.mock is hoisted
// ---------------------------------------------------------------------------
const mockEnv = vi.hoisted(() => ({
  PLATFORM_DOMAIN: 'platform.com',
  CANCEL_TOKEN_SECRET: undefined as string | undefined,
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  PHOTO_STORAGE_PATH: './uploads',
  MAX_BOOKING_DAYS_AHEAD: 90,
  SLUG_EXPIRY_GRACE_DAYS: 30,
  SENDGRID_FROM_NAME: 'Booking',
}));

vi.mock('@/lib/env', () => ({ env: mockEnv }));

import {
  buildCancelUrl,
  generateHmacCancelToken,
  verifyHmacCancelToken,
  isHmacTokenEnabled,
} from '../cancel-token';

const BOOKING_ID = '11111111-1111-1111-1111-111111111111';
const START_TIME = new Date('2026-07-15T10:00:00.000Z');
const SECRET = '0'.repeat(32); // 32 chars — meets minimum

describe('buildCancelUrl', () => {
  it('builds a correctly-formatted cancel URL', () => {
    const url = buildCancelUrl('glamour-studio', 'test-token-abc');
    expect(url).toBe('https://glamour-studio.platform.com/cancel/test-token-abc');
  });

  it('uses a custom domain when provided', () => {
    const url = buildCancelUrl('my-salon', 'tok', 'booking.app');
    expect(url).toBe('https://my-salon.booking.app/cancel/tok');
  });

  it('uses the PLATFORM_DOMAIN env var by default', () => {
    mockEnv.PLATFORM_DOMAIN = 'mybooking.io';
    const url = buildCancelUrl('shop', 'tok');
    expect(url).toContain('mybooking.io');
    mockEnv.PLATFORM_DOMAIN = 'platform.com'; // reset
  });
});

describe('generateHmacCancelToken', () => {
  beforeEach(() => {
    mockEnv.CANCEL_TOKEN_SECRET = SECRET;
  });

  afterEach(() => {
    mockEnv.CANCEL_TOKEN_SECRET = undefined;
  });

  it('returns a token in {bookingId}.{hmac} format', () => {
    const token = generateHmacCancelToken(BOOKING_ID, START_TIME);
    expect(token.startsWith(`${BOOKING_ID}.`)).toBe(true);
    const parts = token.split('.');
    // UUID has 5 parts separated by hyphens; we split on the first '.' after the UUID
    // The token format is bookingId.base64url — base64url has no '.' so total dots = 1
    expect(parts.length).toBe(2);
  });

  it('produces different tokens for different booking IDs', () => {
    const t1 = generateHmacCancelToken(BOOKING_ID, START_TIME);
    const t2 = generateHmacCancelToken('22222222-2222-2222-2222-222222222222', START_TIME);
    expect(t1).not.toBe(t2);
  });

  it('produces different tokens for different start times', () => {
    const t1 = generateHmacCancelToken(BOOKING_ID, new Date('2026-07-15T10:00:00Z'));
    const t2 = generateHmacCancelToken(BOOKING_ID, new Date('2026-07-15T11:00:00Z'));
    expect(t1).not.toBe(t2);
  });

  it('throws when CANCEL_TOKEN_SECRET is not set', () => {
    mockEnv.CANCEL_TOKEN_SECRET = undefined;
    expect(() => generateHmacCancelToken(BOOKING_ID, START_TIME)).toThrow('CANCEL_TOKEN_SECRET');
  });

  it('produces deterministic output for the same inputs', () => {
    const t1 = generateHmacCancelToken(BOOKING_ID, START_TIME);
    const t2 = generateHmacCancelToken(BOOKING_ID, START_TIME);
    expect(t1).toBe(t2);
  });
});

describe('verifyHmacCancelToken', () => {
  beforeEach(() => {
    mockEnv.CANCEL_TOKEN_SECRET = SECRET;
  });

  afterEach(() => {
    mockEnv.CANCEL_TOKEN_SECRET = undefined;
  });

  it('returns true for a valid token', () => {
    const token = generateHmacCancelToken(BOOKING_ID, START_TIME);
    expect(verifyHmacCancelToken(token, BOOKING_ID, START_TIME)).toBe(true);
  });

  it('returns false for a tampered token (changed HMAC)', () => {
    const token = generateHmacCancelToken(BOOKING_ID, START_TIME);
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(verifyHmacCancelToken(tampered, BOOKING_ID, START_TIME)).toBe(false);
  });

  it('returns false when the start time does not match', () => {
    const token = generateHmacCancelToken(BOOKING_ID, START_TIME);
    const wrongTime = new Date('2026-07-15T11:00:00Z');
    expect(verifyHmacCancelToken(token, BOOKING_ID, wrongTime)).toBe(false);
  });

  it('returns false for a token with no dot separator', () => {
    expect(verifyHmacCancelToken('notadottedtoken', BOOKING_ID, START_TIME)).toBe(false);
  });

  it('returns false when CANCEL_TOKEN_SECRET is not set', () => {
    const token = generateHmacCancelToken(BOOKING_ID, START_TIME);
    mockEnv.CANCEL_TOKEN_SECRET = undefined;
    expect(verifyHmacCancelToken(token, BOOKING_ID, START_TIME)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(verifyHmacCancelToken('', BOOKING_ID, START_TIME)).toBe(false);
  });
});

describe('isHmacTokenEnabled', () => {
  it('returns false when CANCEL_TOKEN_SECRET is not set', () => {
    mockEnv.CANCEL_TOKEN_SECRET = undefined;
    expect(isHmacTokenEnabled()).toBe(false);
  });

  it('returns false when CANCEL_TOKEN_SECRET is too short', () => {
    mockEnv.CANCEL_TOKEN_SECRET = 'short';
    expect(isHmacTokenEnabled()).toBe(false);
  });

  it('returns true when CANCEL_TOKEN_SECRET meets minimum length', () => {
    mockEnv.CANCEL_TOKEN_SECRET = SECRET; // 32 chars
    expect(isHmacTokenEnabled()).toBe(true);
  });
});
