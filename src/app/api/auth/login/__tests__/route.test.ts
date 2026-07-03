/**
 * Unit tests for POST /api/auth/login
 *
 * Password verification uses real bcryptjs (no mock) since it's a pure
 * computation.  DB lookups are mocked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { hashPassword } from '@/lib/auth/password';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockMerchantFindFirst = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/platform-client', () => ({
  platformDb: {
    query: {
      merchants: {
        findFirst: mockMerchantFindFirst,
      },
    },
  },
}));

const mockGetMerchantDb = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/get-merchant-db', () => ({
  getMerchantDb: mockGetMerchantDb,
}));

vi.mock('@/lib/db/merchant-schema', () => ({
  createMerchantSchema: vi.fn(() => ({ adminUsers: {} })),
}));

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
  return new NextRequest('http://platform.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  let hashedPassword: string;

  beforeEach(async () => {
    vi.resetAllMocks();
    hashedPassword = await hashPassword('correctpassword');

    const mockAdminDb = {
      query: {
        adminUsers: {
          findFirst: vi.fn().mockResolvedValue({ id: 'admin-uuid', role: 'owner' }),
        },
      },
    };
    mockGetMerchantDb.mockResolvedValue(mockAdminDb);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 200 and sets session cookie on successful login', async () => {
    mockMerchantFindFirst.mockResolvedValueOnce({
      id: 'merchant-uuid',
      slug: 'my-shop',
      passwordHash: hashedPassword,
      schemaName: 'merchant_abc123',
      status: 'active',
    });

    const res = await POST(makeRequest({ email: 'owner@example.com', password: 'correctpassword' }));
    const json = await res.json() as { data: { slug: string; role: string }; error: null };
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.slug).toBe('my-shop');
    expect(json.data.role).toBe('owner');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('admin_session=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('returns 401 for a wrong password', async () => {
    mockMerchantFindFirst.mockResolvedValueOnce({
      id: 'merchant-uuid',
      slug: 'my-shop',
      passwordHash: hashedPassword,
      schemaName: 'merchant_abc123',
      status: 'active',
    });

    const res = await POST(makeRequest({ email: 'owner@example.com', password: 'wrongpassword' }));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(401);
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for an unknown email', async () => {
    mockMerchantFindFirst.mockResolvedValueOnce(undefined);

    const res = await POST(makeRequest({ email: 'nobody@example.com', password: 'anything' }));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(401);
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for a suspended merchant', async () => {
    mockMerchantFindFirst.mockResolvedValueOnce({
      id: 'merchant-uuid',
      slug: 'my-shop',
      passwordHash: hashedPassword,
      schemaName: 'merchant_abc123',
      status: 'suspended',
    });

    const res = await POST(makeRequest({ email: 'owner@example.com', password: 'correctpassword' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 for a cancelled merchant', async () => {
    mockMerchantFindFirst.mockResolvedValueOnce({
      id: 'merchant-uuid',
      slug: 'my-shop',
      passwordHash: hashedPassword,
      schemaName: 'merchant_abc123',
      status: 'cancelled',
    });

    const res = await POST(makeRequest({ email: 'owner@example.com', password: 'correctpassword' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email', password: 'password123' }));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for an empty password', async () => {
    const res = await POST(makeRequest({ email: 'owner@example.com', password: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const req = new NextRequest('http://platform.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when DB throws an unexpected error', async () => {
    mockMerchantFindFirst.mockRejectedValueOnce(new Error('DB down'));
    const res = await POST(makeRequest({ email: 'owner@example.com', password: 'password123' }));
    expect(res.status).toBe(500);
  });
});
