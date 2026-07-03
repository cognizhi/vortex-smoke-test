/**
 * Unit tests for GET /api/admin/settings and PUT /api/admin/settings
 *
 * requireAdminAuth is fully mocked so tests exercise only the route handler
 * logic: DB calls, validation, and response shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Shared mock DB — chainable select / update builder stubs
// ---------------------------------------------------------------------------

const mockSelectLimit = vi.fn();
const mockSelectFrom = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
};

// ---------------------------------------------------------------------------
// Mock schema — only the shape the route accesses is needed
// ---------------------------------------------------------------------------

const mockSchema = {
  merchantSettings: { id: 'merchant_settings.id' },
};

// ---------------------------------------------------------------------------
// Mock @/lib/auth/admin-guard
// ---------------------------------------------------------------------------

const mockRequireAdminAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/admin-guard', () => ({
  requireAdminAuth: mockRequireAdminAuth,
  apiError: (code: string, message: string, status: number) => {
    const { NextResponse } = require('next/server') as typeof import('next/server');
    return NextResponse.json({ data: null, error: { code, message } }, { status });
  },
  apiSuccess: <T>(data: T, status = 200) => {
    const { NextResponse } = require('next/server') as typeof import('next/server');
    return NextResponse.json({ data, error: null }, { status });
  },
}));

// ---------------------------------------------------------------------------
// drizzle-orm eq — used by the route in .where(); return value is not tested
// ---------------------------------------------------------------------------

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq-condition'),
}));

// ---------------------------------------------------------------------------
// Import route under test (AFTER mocks are registered)
// ---------------------------------------------------------------------------

import { GET, PUT } from '../route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_SETTINGS = {
  id: 'settings-1',
  slotDurationMinutes: 30,
  bookingExpiryMinutes: 15,
  displayLanguage: 'en',
};

function makeAuthenticatedCtx() {
  return {
    ok: true as const,
    session: { slug: 'test-shop', role: 'owner' },
    slug: 'test-shop',
    merchantId: 'merchant-1',
    schemaName: 'merchant_abc123',
    schema: mockSchema,
    db: mockDb,
  };
}

function makeGetRequest(): NextRequest {
  return new NextRequest('http://test-shop.platform.com/api/admin/settings', {
    method: 'GET',
    headers: { 'x-merchant-slug': 'test-shop' },
  });
}

function makePutRequest(body: unknown): NextRequest {
  return new NextRequest('http://test-shop.platform.com/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-merchant-slug': 'test-shop',
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/admin/settings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-wire chainable stubs after resetAllMocks
    mockSelectFrom.mockReturnValue({ limit: mockSelectLimit });
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockRequireAdminAuth.mockResolvedValue(makeAuthenticatedCtx());
  });

  it('returns 200 with settings when a row exists', async () => {
    mockSelectLimit.mockResolvedValue([BASE_SETTINGS]);

    const res = await GET(makeGetRequest());
    const json = await res.json() as {
      data: { settings: typeof BASE_SETTINGS };
      error: null;
    };

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.settings).toEqual(BASE_SETTINGS);
    expect(json.data.settings.slotDurationMinutes).toBe(30);
    expect(json.data.settings.bookingExpiryMinutes).toBe(15);
    expect(json.data.settings.displayLanguage).toBe('en');
  });

  it('returns 404 when no settings row exists', async () => {
    mockSelectLimit.mockResolvedValue([]);

    const res = await GET(makeGetRequest());
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(404);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAdminAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { data: null, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      ),
    });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/settings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-wire all chainable stubs after resetAllMocks
    mockSelectFrom.mockReturnValue({ limit: mockSelectLimit });
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockReturning.mockResolvedValue([{ ...BASE_SETTINGS }]);
    mockWhere.mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockRequireAdminAuth.mockResolvedValue(makeAuthenticatedCtx());
    // Default: settings row found for id lookup
    mockSelectLimit.mockResolvedValue([{ id: 'settings-1' }]);
  });

  it('returns 200 with updated settings for valid slotDurationMinutes: 60', async () => {
    const updatedSettings = { ...BASE_SETTINGS, slotDurationMinutes: 60 };
    mockReturning.mockResolvedValue([updatedSettings]);

    const res = await PUT(makePutRequest({ slotDurationMinutes: 60 }));
    const json = await res.json() as {
      data: { settings: typeof updatedSettings };
      error: null;
    };

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.settings.slotDurationMinutes).toBe(60);
  });

  it('returns 200 with updated settings for valid bookingExpiryMinutes within range', async () => {
    const updatedSettings = { ...BASE_SETTINGS, bookingExpiryMinutes: 45 };
    mockReturning.mockResolvedValue([updatedSettings]);

    const res = await PUT(makePutRequest({ bookingExpiryMinutes: 45 }));
    const json = await res.json() as {
      data: { settings: typeof updatedSettings };
      error: null;
    };

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.settings.bookingExpiryMinutes).toBe(45);
  });

  it('returns 400 for invalid slotDurationMinutes: 45 (not 15|30|60)', async () => {
    const res = await PUT(makePutRequest({ slotDurationMinutes: 45 }));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for bookingExpiryMinutes: 4 (below minimum of 5)', async () => {
    const res = await PUT(makePutRequest({ bookingExpiryMinutes: 4 }));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for bookingExpiryMinutes: 61 (above maximum of 60)', async () => {
    const res = await PUT(makePutRequest({ bookingExpiryMinutes: 61 }));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAdminAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { data: null, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      ),
    });

    const res = await PUT(makePutRequest({ slotDurationMinutes: 30 }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an empty update body (no recognised fields)', async () => {
    const res = await PUT(makePutRequest({}));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 404 when settings row does not exist in DB', async () => {
    // Validation passes (valid payload) but no row found
    mockSelectLimit.mockResolvedValue([]);

    const res = await PUT(makePutRequest({ slotDurationMinutes: 30 }));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://test-shop.platform.com/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-slug': 'test-shop',
      },
      body: 'not valid json {{',
    });

    const res = await PUT(req);
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_JSON');
  });
});
