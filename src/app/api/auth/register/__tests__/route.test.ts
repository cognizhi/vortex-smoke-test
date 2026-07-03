/**
 * Unit tests for POST /api/auth/register
 *
 * All external dependencies (DB, provisionMerchant, getMerchantDb) are mocked.
 * We test the request/response contract and error handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

const mockPlatformFindFirst = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/platform-client', () => ({
  platformDb: {
    query: {
      merchants: {
        findFirst: mockPlatformFindFirst,
      },
    },
  },
}));

const mockProvisionMerchant = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/provision-merchant', () => ({
  provisionMerchant: mockProvisionMerchant,
}));

const mockGetMerchantDb = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/get-merchant-db', () => ({
  getMerchantDb: mockGetMerchantDb,
}));

vi.mock('@/lib/db/merchant-schema', () => ({
  createMerchantSchema: vi.fn(() => ({
    adminUsers: {},
  })),
}));

// Mock env to ensure AUTH_SECRET is set in tests
vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
    PLATFORM_DOMAIN: 'platform.com',
    AUTH_SECRET: '00000000000000000000000000000000ff',
    CANCEL_TOKEN_SECRET: '00000000000000000000000000000000ff',
    PHOTO_STORAGE_PATH: './uploads',
    MAX_BOOKING_DAYS_AHEAD: 90,
    SLUG_EXPIRY_GRACE_DAYS: 30,
  },
}));

import { POST } from '../route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://platform.com/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  businessName: 'Glamour Studio',
  slug: 'glamour-studio',
  ownerEmail: 'owner@example.com',
  ownerName: 'Jane Smith',
  password: 'securepass123',
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: slug not taken, email not taken
    mockPlatformFindFirst.mockResolvedValue(undefined);
    // Default provision result
    mockProvisionMerchant.mockResolvedValue({
      merchantId: 'merchant-uuid',
      schemaName: 'merchant_abc123',
      dashboardUrl: 'https://glamour-studio.platform.com/admin',
      bookingPageUrl: 'https://glamour-studio.platform.com',
    });
    // Default merchant DB (admin_users query)
    const mockAdminDb = {
      query: {
        adminUsers: {
          findFirst: vi.fn().mockResolvedValue({ id: 'admin-user-uuid', role: 'owner' }),
        },
      },
    };
    mockGetMerchantDb.mockResolvedValue(mockAdminDb);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 201 with merchantId and slug on success', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: { merchantId: string; slug: string }; error: null };
    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.slug).toBe('glamour-studio');
    expect(json.data.merchantId).toBe('merchant-uuid');
  });

  it('sets the admin_session cookie on success', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('admin_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toMatch(/SameSite=strict/i);
  });

  it('returns 400 for invalid input (missing fields)', async () => {
    const res = await POST(makeRequest({ businessName: 'Test' }));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for a password shorter than 8 chars', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid email', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, ownerEmail: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when slug is already taken', async () => {
    // First call (slug check) returns a record; second call (email check) returns undefined
    mockPlatformFindFirst
      .mockResolvedValueOnce({ slug: 'glamour-studio' }) // slug taken
      .mockResolvedValueOnce(undefined); // email free
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('SLUG_TAKEN');
  });

  it('returns 409 when email is already registered', async () => {
    mockPlatformFindFirst
      .mockResolvedValueOnce(undefined) // slug free
      .mockResolvedValueOnce({ ownerEmail: 'owner@example.com' }); // email taken
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('EMAIL_TAKEN');
  });

  it('returns 500 when provisionMerchant throws an unexpected error', async () => {
    mockProvisionMerchant.mockRejectedValueOnce(new Error('Unexpected DB failure'));
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(500);
    expect(json.error.code).toBe('INTERNAL');
  });

  it('returns 409 when provisionMerchant throws a unique constraint error', async () => {
    mockProvisionMerchant.mockRejectedValueOnce(new Error('unique constraint violation'));
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('SLUG_TAKEN');
  });

  it('returns 400 for a reserved slug', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, slug: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://platform.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
