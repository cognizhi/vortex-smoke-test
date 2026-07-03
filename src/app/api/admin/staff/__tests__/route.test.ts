/**
 * Unit tests for GET /api/admin/staff and POST /api/admin/staff
 *
 * Mocking strategy:
 *  - '@/lib/auth/admin-guard' is fully mocked so requireAdminAuth can be
 *    controlled per test; apiSuccess / apiError are re-exported from the real
 *    module so response shapes stay correct.
 *  - mockDb simulates the Drizzle fluent-chain API used in the route.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types we need before the mock factory runs
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock '@/lib/auth/admin-guard'
// Define the mock function at module scope so it's accessible from the factory.
// ---------------------------------------------------------------------------

const mockRequireAdminAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/admin-guard', () => {
  const { NextResponse } = require('next/server') as typeof import('next/server');
  return {
    requireAdminAuth: mockRequireAdminAuth,
    apiSuccess: <T>(data: T, status = 200) =>
      NextResponse.json({ data, error: null }, { status }),
    apiError: (code: string, message: string, status: number) =>
      NextResponse.json({ data: null, error: { code, message } }, { status }),
  };
});

// ---------------------------------------------------------------------------
// Import the handlers AFTER the mock is registered
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const SESSION = {
  userId: 'u1',
  merchantId: 'm1',
  slug: 'test',
  role: 'owner' as const,
};

const STAFF_ROWS = [
  { id: 's1', name: 'Alice', contactNumber: null, email: null, isVisible: true },
  { id: 's2', name: 'Bob', contactNumber: '555-1234', email: 'bob@test.com', isVisible: true },
];

const AVAILABILITY_ROWS = [
  { id: 'a1', staffId: 's1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', enabled: true },
];

// ---------------------------------------------------------------------------
// mockDb factory
// ---------------------------------------------------------------------------

function buildMockDb(
  staffRows: typeof STAFF_ROWS = STAFF_ROWS,
  availabilityRows: typeof AVAILABILITY_ROWS = AVAILABILITY_ROWS,
  insertedStaff: (typeof STAFF_ROWS)[0] = STAFF_ROWS[0]
) {
  const orderByFn = vi.fn().mockResolvedValue(staffRows);
  const fromSelectFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
  // second .from() call for staffAvailability returns rows directly
  const fromAvailFn = vi.fn().mockResolvedValue(availabilityRows);

  let selectCallCount = 0;
  const selectFn = vi.fn().mockImplementation(() => {
    selectCallCount += 1;
    // First select() -> staff chain; second select() -> availability chain
    if (selectCallCount === 1) {
      return { from: fromSelectFn };
    }
    return { from: fromAvailFn };
  });

  const returningFn = vi.fn().mockResolvedValue([insertedStaff]);
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
  const insertFn = vi.fn().mockReturnValue({ values: valuesFn });

  return { select: selectFn, insert: insertFn };
}

// ---------------------------------------------------------------------------
// Auth context builder
// ---------------------------------------------------------------------------

function buildAuthOk(db: ReturnType<typeof buildMockDb>) {
  return {
    ok: true as const,
    session: SESSION,
    slug: 'test',
    merchantId: 'm1',
    schemaName: 'merchant_abc',
    schema: { staff: {} as never, staffAvailability: {} as never },
    db,
  };
}

function buildAuthFail() {
  return {
    ok: false as const,
    response: NextResponse.json(
      { data: null, error: { code: 'UNAUTHENTICATED' } },
      { status: 401 }
    ),
  };
}

// ---------------------------------------------------------------------------
// Helper: build a NextRequest with an optional JSON body
// ---------------------------------------------------------------------------

function makeRequest(method: string, body?: unknown): NextRequest {
  const url = 'http://test.localhost/api/admin/staff';
  if (body !== undefined) {
    return new NextRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  return new NextRequest(url, { method });
}

// ---------------------------------------------------------------------------
// GET /api/admin/staff
// ---------------------------------------------------------------------------

describe('GET /api/admin/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with staff array including availability when auth passes', async () => {
    const mockDb = buildMockDb(STAFF_ROWS, AVAILABILITY_ROWS);
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(mockDb));

    const req = makeRequest('GET');
    const res = await GET(req);

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.staff).toHaveLength(2);

    // Alice should have one availability entry
    const alice = json.data.staff.find((s: { id: string }) => s.id === 's1');
    expect(alice).toBeDefined();
    expect(alice.availability).toHaveLength(1);
    expect(alice.availability[0].dayOfWeek).toBe(1);

    // Bob should have zero availability entries
    const bob = json.data.staff.find((s: { id: string }) => s.id === 's2');
    expect(bob).toBeDefined();
    expect(bob.availability).toHaveLength(0);
  });

  it('returns 401 when requireAdminAuth fails', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthFail());

    const req = makeRequest('GET');
    const res = await GET(req);

    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/staff
// ---------------------------------------------------------------------------

describe('POST /api/admin/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a staff member and returns 201 with the staff object', async () => {
    const newStaff = { id: 's3', name: 'Carol', contactNumber: null, email: null, isVisible: true };
    const mockDb = buildMockDb([], [], newStaff);
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(mockDb));

    const req = makeRequest('POST', { name: 'Carol' });
    const res = await POST(req);

    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.staff.id).toBe('s3');
    expect(json.data.staff.name).toBe('Carol');

    // Ensure insert was called
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when name is missing from the request body', async () => {
    const mockDb = buildMockDb();
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(mockDb));

    const req = makeRequest('POST', { email: 'nope@test.com' });
    const res = await POST(req);

    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for an invalid (non-JSON) request body', async () => {
    const mockDb = buildMockDb();
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(mockDb));

    // Craft a request with a malformed body that cannot be parsed as JSON
    const req = new NextRequest('http://test.localhost/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json }{',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_JSON');
  });

  it('returns 401 when requireAdminAuth fails', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthFail());

    const req = makeRequest('POST', { name: 'Dave' });
    const res = await POST(req);

    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });
});
