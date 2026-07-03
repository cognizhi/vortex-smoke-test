import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mock variables — defined at module scope (bun/vitest compatible)
// ---------------------------------------------------------------------------

const mockFindFirst = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockCreateMerchantSchema = vi.hoisted(() => vi.fn(() => ({ staff: {}, services: {} })));
const mockDrizzleInstance = vi.hoisted(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() }));
const mockDrizzle = vi.hoisted(() => vi.fn(() => mockDrizzleInstance));
const mockPoolQuery = vi.hoisted(() => vi.fn());
const mockPoolEnd = vi.hoisted(() => vi.fn());
const MockPool = vi.hoisted(() => vi.fn(() => ({ query: mockPoolQuery, end: mockPoolEnd })));
const mockEq = vi.hoisted(() => vi.fn((col: unknown, val: unknown) => ({ col, val })));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/platform-client', () => ({
  platformDb: {
    query: {
      merchants: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionFromCookieHeader: mockGetSession,
}));

vi.mock('@/lib/db/platform-schema', () => ({
  merchants: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: mockEq,
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockDrizzle,
}));

vi.mock('pg', () => ({
  Pool: MockPool,
}));

vi.mock('@/lib/db/merchant-schema', () => ({
  createMerchantSchema: mockCreateMerchantSchema,
}));

vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost/test',
    AUTH_SECRET: '0'.repeat(32),
    NODE_ENV: 'test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    PLATFORM_DOMAIN: 'platform.com',
    PHOTO_STORAGE_PATH: './uploads',
    MAX_BOOKING_DAYS_AHEAD: 90,
    SLUG_EXPIRY_GRACE_DAYS: 30,
  },
}));

// ---------------------------------------------------------------------------
// Import module under test — after all mocks are registered
// ---------------------------------------------------------------------------

import {
  requireAdminAuth,
  requireOwnerAuth,
  apiError,
  apiSuccess,
} from '../admin-guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(slug?: string, cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (slug !== undefined) {
    headers['x-merchant-slug'] = slug;
  }
  if (cookie !== undefined) {
    headers['cookie'] = cookie;
  }
  return new NextRequest('http://localhost:3000/api/test', { headers });
}

const VALID_SESSION = {
  userId: 'user-uuid-001',
  merchantId: 'merchant-uuid-001',
  slug: 'test-shop',
  role: 'owner' as const,
};

const ACTIVE_MERCHANT = {
  id: 'merchant-uuid-001',
  schemaName: 'merchant_abc123',
  status: 'active',
};

// ---------------------------------------------------------------------------
// beforeEach — reset all mocks to a known good state before every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue(VALID_SESSION);
  mockFindFirst.mockResolvedValue(ACTIVE_MERCHANT);
  mockCreateMerchantSchema.mockReturnValue({ staff: {}, services: {} });
  mockDrizzle.mockReturnValue(mockDrizzleInstance);
});

// ---------------------------------------------------------------------------
// requireAdminAuth
// ---------------------------------------------------------------------------

describe('requireAdminAuth', () => {
  it('returns NOT_FOUND 404 when no x-merchant-slug header is present', async () => {
    const request = makeRequest(/* no slug */);
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.data).toBeNull();
    }
  });

  it('returns UNAUTHENTICATED 401 when session is null (bad or missing cookie)', async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest('test-shop', 'admin_session=bad-token');
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(401);
      expect(body.error.code).toBe('UNAUTHENTICATED');
      expect(body.data).toBeNull();
    }
  });

  it('returns FORBIDDEN 403 when session.slug does not match request slug', async () => {
    mockGetSession.mockResolvedValue({ ...VALID_SESSION, slug: 'other-shop' });

    const request = makeRequest('test-shop');
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.data).toBeNull();
    }
  });

  it('returns NOT_FOUND 404 when merchant is not found in the platform DB', async () => {
    mockFindFirst.mockResolvedValue(undefined);

    const request = makeRequest('test-shop');
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.data).toBeNull();
    }
  });

  it('returns NOT_FOUND 404 when merchant status is suspended', async () => {
    mockFindFirst.mockResolvedValue({ ...ACTIVE_MERCHANT, status: 'suspended' });

    const request = makeRequest('test-shop');
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.data).toBeNull();
    }
  });

  it('returns ok:true with correct context when all checks pass', async () => {
    const mockSchema = { staff: { id: 'col' }, services: { name: 'col' } };
    mockCreateMerchantSchema.mockReturnValue(mockSchema);
    mockDrizzle.mockReturnValue(mockDrizzleInstance);

    const request = makeRequest('test-shop');
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toEqual(VALID_SESSION);
      expect(result.slug).toBe('test-shop');
      expect(result.merchantId).toBe(ACTIVE_MERCHANT.id);
      expect(result.schemaName).toBe(ACTIVE_MERCHANT.schemaName);
      expect(result.schema).toBe(mockSchema);
      expect(result.db).toBe(mockDrizzleInstance);
    }

    expect(mockCreateMerchantSchema).toHaveBeenCalledWith(ACTIVE_MERCHANT.schemaName);
    expect(mockDrizzle).toHaveBeenCalledWith(expect.anything(), { schema: mockSchema });
  });

  it('returns INTERNAL 500 when the platform DB query throws', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB connection refused'));

    const request = makeRequest('test-shop');
    const result = await requireAdminAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(500);
      expect(body.error.code).toBe('INTERNAL');
      expect(body.data).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// requireOwnerAuth
// ---------------------------------------------------------------------------

describe('requireOwnerAuth', () => {
  it('returns FORBIDDEN 403 when role is admin (not owner)', async () => {
    mockGetSession.mockResolvedValue({ ...VALID_SESSION, role: 'admin' });

    const request = makeRequest('test-shop');
    const result = await requireOwnerAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toMatch(/owner/i);
      expect(body.data).toBeNull();
    }
  });

  it('returns ok:true when role is owner', async () => {
    mockGetSession.mockResolvedValue({ ...VALID_SESSION, role: 'owner' });

    const request = makeRequest('test-shop');
    const result = await requireOwnerAuth(request);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.role).toBe('owner');
      expect(result.slug).toBe('test-shop');
      expect(result.merchantId).toBe(ACTIVE_MERCHANT.id);
    }
  });

  it('propagates auth failures from requireAdminAuth (missing slug)', async () => {
    const request = makeRequest(/* no slug */);
    const result = await requireOwnerAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(404);
    }
  });

  it('propagates UNAUTHENTICATED when session is null', async () => {
    mockGetSession.mockResolvedValue(null);

    const request = makeRequest('test-shop');
    const result = await requireOwnerAuth(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(401);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    }
  });
});

// ---------------------------------------------------------------------------
// apiError
// ---------------------------------------------------------------------------

describe('apiError', () => {
  it('returns JSON with { data: null, error: { code, message } } and given status', async () => {
    const response = apiError('NOT_FOUND', 'Resource not found.', 404);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.data).toBeNull();
    expect(body.error).toEqual({ code: 'NOT_FOUND', message: 'Resource not found.' });
  });

  it('uses the provided status code for 401', async () => {
    const response = apiError('UNAUTHENTICATED', 'Please log in.', 401);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.error.message).toBe('Please log in.');
  });

  it('uses the provided status code for 403', async () => {
    const response = apiError('FORBIDDEN', 'Access denied.', 403);

    expect(response.status).toBe(403);
  });

  it('uses the provided status code for 500', async () => {
    const response = apiError('INTERNAL', 'Unexpected error.', 500);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL');
  });

  it('sets Content-Type to application/json', async () => {
    const response = apiError('TEST', 'Test error.', 400);

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});

// ---------------------------------------------------------------------------
// apiSuccess
// ---------------------------------------------------------------------------

describe('apiSuccess', () => {
  it('returns JSON with { data, error: null } and default status 200', async () => {
    const payload = { id: '123', name: 'Test' };
    const response = apiSuccess(payload);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(payload);
    expect(body.error).toBeNull();
  });

  it('uses the provided status code when specified', async () => {
    const response = apiSuccess({ created: true }, 201);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual({ created: true });
    expect(body.error).toBeNull();
  });

  it('handles null data', async () => {
    const response = apiSuccess(null);
    const body = await response.json();

    expect(body.data).toBeNull();
    expect(body.error).toBeNull();
  });

  it('handles array data', async () => {
    const payload = [{ id: '1' }, { id: '2' }];
    const response = apiSuccess(payload);
    const body = await response.json();

    expect(body.data).toEqual(payload);
    expect(body.error).toBeNull();
  });

  it('sets Content-Type to application/json', async () => {
    const response = apiSuccess({ ok: true });

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
