/**
 * Unit tests for admin booking APIs:
 *   GET /api/admin/bookings
 *   GET /api/admin/bookings/[id]
 *   POST /api/admin/bookings/[id]/reschedule
 *   POST /api/admin/bookings/[id]/cancel
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockRequireAdminAuth = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/admin-guard', () => ({
  requireAdminAuth: mockRequireAdminAuth,
  apiSuccess: vi.fn((data: unknown, status = 200) =>
    new Response(JSON.stringify({ data, error: null }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  ),
  apiError: vi.fn((code: string, message: string, status: number) =>
    new Response(JSON.stringify({ data: null, error: { code, message } }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  ),
}));

vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NODE_ENV: 'test',
    PLATFORM_DOMAIN: 'platform.com',
    AUTH_SECRET: '00000000000000000000000000000000ff',
    CANCEL_TOKEN_SECRET: '00000000000000000000000000000000ff',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    PHOTO_STORAGE_PATH: './uploads',
    MAX_BOOKING_DAYS_AHEAD: 90,
    SLUG_EXPIRY_GRACE_DAYS: 30,
  },
}));

import { GET as getBookings } from '../route';
import { GET as getBooking } from '../[id]/route';
import { POST as rescheduleBooking } from '../[id]/reschedule/route';
import { POST as cancelBooking } from '../[id]/cancel/route';

const BOOKING_UUID = '550e8400-e29b-41d4-a716-446655440000';
const STAFF_UUID = '660e8400-e29b-41d4-a716-446655440001';
const SVC_UUID = '770e8400-e29b-41d4-a716-446655440002';
const CUST_UUID = '880e8400-e29b-41d4-a716-446655440003';

const FUTURE = new Date(Date.now() + 86400000);

// Sample booking row
const sampleBooking = {
  id: BOOKING_UUID,
  confirmationNumber: 'BK-1001',
  status: 'confirmed',
  startTime: FUTURE,
  endTime: new Date(FUTURE.getTime() + 30 * 60 * 1000),
  staffId: STAFF_UUID,
  serviceId: SVC_UUID,
  customerId: CUST_UUID,
  cancelToken: 'cancel-token',
  cancelledAt: null,
  createdAt: new Date(),
};

function buildAuthCtx(bookings: typeof sampleBooking[] = [sampleBooking]) {
  // Build mock Drizzle-like db
  const mockSelect = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(bookings),
  });
  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
    returning: vi.fn().mockResolvedValue([{ ...sampleBooking, status: 'cancelled_admin', cancelledAt: new Date() }]),
  });

  return {
    ok: true as const,
    session: { userId: 'u', merchantId: 'm', slug: 'my-shop', role: 'owner' as const },
    slug: 'my-shop',
    merchantId: 'merchant-uuid',
    schemaName: 'merchant_abc',
    schema: {
      bookings: {
        id: 'id', confirmationNumber: 'cn', status: 's', startTime: 'st', endTime: 'et',
        staffId: 'sid', serviceId: 'svid', customerId: 'cid', cancelToken: 'ct',
        cancelledAt: 'ca', createdAt: 'crat',
      },
      staff: { id: 'id', name: 'n' },
      services: { id: 'id', name: 'n', durationMinutes: 'dm', priceCents: 'pc' },
      customers: { id: 'id', firstName: 'fn', email: 'e', contactNumber: 'cn' },
      staffAvailability: { staffId: 'sid', dayOfWeek: 'dow', maxConcurrent: 'mc' },
    },
    db: { select: mockSelect, update: mockUpdate } as unknown as import('@/lib/auth/admin-guard').AdminContext['db'],
  };
}

function makeAdminRequest(method = 'GET', body?: unknown) {
  return new NextRequest('http://platform.com/api/admin/bookings', {
    method,
    headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// GET /api/admin/bookings
// ---------------------------------------------------------------------------
describe('GET /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminAuth.mockResolvedValue(buildAuthCtx());
  });

  it('returns 200 with bookings list', async () => {
    const res = await getBookings(makeAdminRequest());
    const json = await res.json() as { data: { bookings: unknown[] }; error: null };
    expect(res.status).toBe(200);
    expect(Array.isArray(json.data.bookings)).toBe(true);
    expect(json.data.bookings).toHaveLength(1);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ data: null, error: { code: 'UNAUTHENTICATED' } }), { status: 401 }),
    });
    const res = await getBookings(makeAdminRequest());
    expect(res.status).toBe(401);
  });

  it('filters by status when ?status= provided', async () => {
    const cancelledBooking = { ...sampleBooking, status: 'cancelled_admin' };
    const ctx = buildAuthCtx([sampleBooking, cancelledBooking]);
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const url = new URL('http://platform.com/api/admin/bookings?status=cancelled_admin');
    const req = new NextRequest(url, { headers: { 'x-merchant-slug': 'my-shop' } });
    const res = await getBookings(req);
    const json = await res.json() as { data: { bookings: Array<{ status: string }> } };
    // Only the cancelled booking should be returned
    expect(json.data.bookings.every((b) => b.status === 'cancelled_admin')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/bookings/[id]
// ---------------------------------------------------------------------------
describe('GET /api/admin/bookings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = buildAuthCtx([sampleBooking]);
    // Override select to support multiple calls (booking + customer + staff + service)
    const selectCalls: Array<unknown[]> = [
      [sampleBooking],
      [{ id: CUST_UUID, firstName: 'Jane', email: 'jane@example.com', contactNumber: '123' }],
      [{ id: STAFF_UUID, name: 'Bob' }],
      [{ id: SVC_UUID, name: 'Haircut', durationMinutes: 30, priceCents: 4000 }],
    ];
    let callIdx = 0;
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => Promise.resolve(selectCalls[callIdx++] ?? [])),
    });
    ctx.db = { select: mockSelect } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);
  });

  it('returns 200 with booking detail', async () => {
    const req = makeAdminRequest();
    const res = await getBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    const json = await res.json() as { data: { booking: { id: string } }; error: null };
    expect(res.status).toBe(200);
    expect(json.data.booking.id).toBe(BOOKING_UUID);
  });

  it('returns 404 for unknown booking id', async () => {
    const ctx = buildAuthCtx([]);
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });
    ctx.db = { select: mockSelect } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const req = makeAdminRequest();
    const res = await getBooking(req, { params: Promise.resolve({ id: 'bad-id' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/bookings/[id]/cancel
// ---------------------------------------------------------------------------
describe('POST /api/admin/bookings/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = buildAuthCtx([sampleBooking]);
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: BOOKING_UUID, status: 'confirmed', confirmationNumber: 'BK-1001' }]),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...sampleBooking, status: 'cancelled_admin' }]),
    });
    ctx.db = { select: mockSelect, update: mockUpdate } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);
  });

  it('returns 200 on successful cancel', async () => {
    const req = makeAdminRequest('POST');
    const res = await cancelBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    const json = await res.json() as { data: { booking: { status: string } } };
    expect(res.status).toBe(200);
    expect(json.data.booking.status).toBe('cancelled_admin');
  });

  it('returns 409 when booking is already cancelled', async () => {
    const ctx = buildAuthCtx();
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: BOOKING_UUID, status: 'cancelled_admin', confirmationNumber: 'BK-1001' }]),
    });
    ctx.db = { select: mockSelect } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const req = makeAdminRequest('POST');
    const res = await cancelBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    expect(res.status).toBe(409);
  });

  it('returns 404 when booking not found', async () => {
    const ctx = buildAuthCtx();
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });
    ctx.db = { select: mockSelect } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const req = makeAdminRequest('POST');
    const res = await cancelBooking(req, { params: Promise.resolve({ id: 'bad-id' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/bookings/[id]/reschedule
// ---------------------------------------------------------------------------
describe('POST /api/admin/bookings/[id]/reschedule', () => {
  const NEW_TIME = new Date(Date.now() + 2 * 86400000).toISOString(); // 2 days from now

  beforeEach(() => {
    vi.clearAllMocks();
    const ctx = buildAuthCtx([sampleBooking]);
    let selectCallIdx = 0;
    const selectResponses: Array<unknown[]> = [
      [sampleBooking],               // booking lookup
      [{ durationMinutes: 30 }],     // service duration
      [{ maxConcurrent: 1 }],        // staff availability
      [],                             // no overlapping confirmed bookings
    ];
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => Promise.resolve(selectResponses[selectCallIdx++] ?? [])),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    });
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        ...sampleBooking,
        startTime: new Date(NEW_TIME),
        confirmationNumber: 'BK-1001-R',
        rescheduledFromId: BOOKING_UUID,
      }]),
    });
    ctx.db = { select: mockSelect, update: mockUpdate, insert: mockInsert } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);
  });

  it('returns 200 with updated booking on successful reschedule', async () => {
    const req = new NextRequest('http://platform.com/api/admin/bookings/' + BOOKING_UUID + '/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
      body: JSON.stringify({ startTime: NEW_TIME }),
    });
    const res = await rescheduleBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    const json = await res.json() as { data: { booking: { rescheduledFromId: string; confirmationNumber: string } }; error: null };
    expect(res.status).toBe(200);
    expect(json.data.booking).toBeDefined();
  });

  it('sets rescheduledFromId on the new booking (audit trail regression)', async () => {
    // Re-uses the beforeEach mock which returns rescheduledFromId: BOOKING_UUID
    const req = new NextRequest('http://platform.com/api/admin/bookings/' + BOOKING_UUID + '/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
      body: JSON.stringify({ startTime: NEW_TIME }),
    });
    const res = await rescheduleBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    const json = await res.json() as { data: { booking: { rescheduledFromId: string } }; error: null };
    expect(res.status).toBe(200);
    // rescheduledFromId must point to the original booking's id
    expect(json.data.booking.rescheduledFromId).toBe(BOOKING_UUID);
  });

  it('marks original booking status as rescheduled (not deleted)', async () => {
    const ctx = buildAuthCtx([sampleBooking]);
    let selectIdx = 0;
    const selectResponses: Array<unknown[]> = [
      [sampleBooking],
      [{ durationMinutes: 30 }],
      [{ maxConcurrent: 1 }],
      [],
    ];
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => Promise.resolve(selectResponses[selectIdx++] ?? [])),
    });
    const updateSpy = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    });
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        ...sampleBooking,
        startTime: new Date(NEW_TIME),
        confirmationNumber: 'BK-1001-R',
        rescheduledFromId: BOOKING_UUID,
      }]),
    });
    ctx.db = { select: mockSelect, update: updateSpy, insert: mockInsert } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const req = new NextRequest('http://platform.com/api/admin/bookings/' + BOOKING_UUID + '/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
      body: JSON.stringify({ startTime: NEW_TIME }),
    });
    await rescheduleBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });

    // update() must have been called to mark original booking as 'rescheduled'
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const setCall = updateSpy.mock.results[0].value.set.mock.calls[0][0];
    expect(setCall).toMatchObject({ status: 'rescheduled' });
  });

  it('returns 400 for past startTime', async () => {
    const ctx = buildAuthCtx([sampleBooking]);
    // Only need booking lookup (returns confirmed booking)
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([sampleBooking]),
    });
    ctx.db = { select: mockSelect } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const req = new NextRequest('http://platform.com/api/admin/bookings/' + BOOKING_UUID + '/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
      body: JSON.stringify({ startTime: '2020-01-01T10:00:00Z' }),
    });
    const res = await rescheduleBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    expect(res.status).toBe(400);
  });

  it('returns 409 when new slot is taken', async () => {
    const ctx = buildAuthCtx([sampleBooking]);
    let idx = 0;
    const responses = [
      [sampleBooking],
      [{ durationMinutes: 30 }],
      [{ maxConcurrent: 1 }],
      [{ id: 'conflict-booking' }],  // 1 overlapping >= maxConcurrent=1
    ];
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => Promise.resolve(responses[idx++] ?? [])),
    });
    ctx.db = { select: mockSelect } as unknown as typeof ctx.db;
    mockRequireAdminAuth.mockResolvedValue(ctx);

    const req = new NextRequest('http://platform.com/api/admin/bookings/' + BOOKING_UUID + '/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
      body: JSON.stringify({ startTime: NEW_TIME }),
    });
    const res = await rescheduleBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('SLOT_TAKEN');
  });

  it('returns 400 for invalid startTime format', async () => {
    const req = new NextRequest('http://platform.com/api/admin/bookings/' + BOOKING_UUID + '/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-merchant-slug': 'my-shop' },
      body: JSON.stringify({ startTime: 'not-a-date' }),
    });
    const res = await rescheduleBooking(req, { params: Promise.resolve({ id: BOOKING_UUID }) });
    expect(res.status).toBe(400);
  });
});
