/**
 * Unit tests for GET /api/admin/design and PUT /api/admin/design
 *
 * The admin-guard module is mocked entirely so no real DB connections,
 * JWT validation, or platform-DB queries are made.  The mock exposes:
 *   - requireAdminAuth  — returns ok:true with mockDb and schema stubs
 *   - apiSuccess / apiError — delegated to the real implementations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Shared mock DB plumbing — defined at module scope (bun/vitest compatible)
// ---------------------------------------------------------------------------

const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockLimit = vi.fn();
const mockFrom = vi.fn(() => ({ limit: mockLimit }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
};

// A minimal stub for schema.merchantDesign
const mockMerchantDesignTable = { id: 'merchantDesign.id' };

// ---------------------------------------------------------------------------
// Mock @/lib/auth/admin-guard
//
// apiSuccess and apiError are re-implemented here matching the real logic so
// the tests assert on realistic JSON responses.
// ---------------------------------------------------------------------------

// module-scope mock for requireAdminAuth — referenced in vi.mock factory below
const mockRequireAdminAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/admin-guard', () => {
  const apiError = (code: string, message: string, status: number): NextResponse =>
    NextResponse.json({ data: null, error: { code, message } }, { status });

  const apiSuccess = <T>(data: T, status = 200): NextResponse =>
    NextResponse.json({ data, error: null }, { status });

  return { requireAdminAuth: mockRequireAdminAuth, apiSuccess, apiError };
});

// Must import after mocks are registered.
import { GET, PUT } from '../route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'http://test-merchant.platform.com/api/admin/design';

function makeGet(): NextRequest {
  return new NextRequest(BASE_URL, { method: 'GET' });
}

function makePut(body: unknown): NextRequest {
  return new NextRequest(BASE_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const DESIGN_ROW = {
  id: 'design-1',
  pageHeadline: 'Book now',
  pageSubheadline: 'Pick a slot',
  slotAvailableBg: '#ECFDF5',
  slotAvailableText: '#065F46',
  slotUnavailableBg: '#F3F4F6',
  slotUnavailableText: '#9CA3AF',
  calendarBorderWidth: 1,
  calendarBorderColor: '#E5E7EB',
  calendarBorderRadius: 8,
  calendarFontSize: 14,
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('GET /api/admin/design', () => {
  beforeEach(() => {
    mockRequireAdminAuth.mockResolvedValue({
      ok: true,
      session: { slug: 'test-merchant', role: 'owner', staffId: null },
      slug: 'test-merchant',
      merchantId: 'merchant-uuid',
      schemaName: 'merchant_abc',
      schema: { merchantDesign: mockMerchantDesignTable } as never,
      db: mockDb as never,
    });

    // Reset select chain mocks
    mockLimit.mockReset();
    mockFrom.mockReset().mockReturnValue({ limit: mockLimit });
    mockSelect.mockReset().mockReturnValue({ from: mockFrom });
  });

  it('returns 200 with design data when a row exists', async () => {
    mockLimit.mockResolvedValueOnce([DESIGN_ROW]);

    const res = await GET(makeGet());
    const json = await res.json() as { data: { design: typeof DESIGN_ROW }; error: null };

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.design.id).toBe('design-1');
    expect(json.data.design.pageHeadline).toBe('Book now');
  });

  it('returns 404 when no design row exists', async () => {
    mockLimit.mockResolvedValueOnce([]);

    const res = await GET(makeGet());
    const json = await res.json() as { data: null; error: { code: string; message: string } };

    expect(res.status).toBe(404);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAdminAuth.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json(
        { data: null, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      ),
    });

    const res = await GET(makeGet());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/design', () => {
  beforeEach(() => {
    mockRequireAdminAuth.mockResolvedValue({
      ok: true,
      session: { slug: 'test-merchant', role: 'owner', staffId: null },
      slug: 'test-merchant',
      merchantId: 'merchant-uuid',
      schemaName: 'merchant_abc',
      schema: { merchantDesign: mockMerchantDesignTable } as never,
      db: mockDb as never,
    });

    // Reset all DB chain mocks
    mockLimit.mockReset();
    mockFrom.mockReset().mockReturnValue({ limit: mockLimit });
    mockSelect.mockReset().mockReturnValue({ from: mockFrom });
    mockReturning.mockReset();
    mockWhere.mockReset().mockReturnValue({ returning: mockReturning });
    mockSet.mockReset().mockReturnValue({ where: mockWhere });
    mockUpdate.mockReset().mockReturnValue({ set: mockSet });
  });

  it('returns 200 with updated design on success', async () => {
    const updatedRow = { ...DESIGN_ROW, pageHeadline: 'New headline' };

    // SELECT to find the existing design id
    mockLimit.mockResolvedValueOnce([{ id: 'design-1' }]);
    // UPDATE … returning
    mockReturning.mockResolvedValueOnce([updatedRow]);

    const res = await PUT(makePut({ pageHeadline: 'New headline' }));
    const json = await res.json() as { data: { design: typeof updatedRow }; error: null };

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.design.pageHeadline).toBe('New headline');
  });

  it('returns 400 for an invalid hex colour value', async () => {
    const res = await PUT(makePut({ slotAvailableBg: 'red' }));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{',
    });

    const res = await PUT(req);
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_JSON');
  });

  it('returns 404 when no design row exists', async () => {
    // SELECT returns no rows → designId is undefined
    mockLimit.mockResolvedValueOnce([]);

    const res = await PUT(makePut({ pageHeadline: 'Hello' }));
    const json = await res.json() as { data: null; error: { code: string } };

    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAdminAuth.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json(
        { data: null, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      ),
    });

    const res = await PUT(makePut({ pageHeadline: 'Hello' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid hex colour on all colour fields', async () => {
    const colourFields = [
      'slotAvailableBg',
      'slotAvailableText',
      'slotUnavailableBg',
      'slotUnavailableText',
      'calendarBorderColor',
    ] as const;

    for (const field of colourFields) {
      const res = await PUT(makePut({ [field]: 'not-a-hex' }));
      const json = await res.json() as { data: null; error: { code: string } };
      expect(res.status).toBe(400);
      expect(json.error.code).toBe('INVALID_INPUT');
    }
  });

  it('accepts a valid hex colour and calls DB update', async () => {
    const updatedRow = { ...DESIGN_ROW, slotAvailableBg: '#AABBCC' };
    mockLimit.mockResolvedValueOnce([{ id: 'design-1' }]);
    mockReturning.mockResolvedValueOnce([updatedRow]);

    const res = await PUT(makePut({ slotAvailableBg: '#AABBCC' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });
});
