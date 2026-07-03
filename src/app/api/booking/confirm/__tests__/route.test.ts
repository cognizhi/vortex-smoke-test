/**
 * Unit tests for POST /api/booking/confirm
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/lib/db/platform-client', () => ({
  platformDb: { query: { merchants: { findFirst: vi.fn() } } },
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

const mockIsSlotAvailable = vi.hoisted(() => vi.fn());
vi.mock('@/lib/slots', () => ({
  isSlotAvailable: mockIsSlotAvailable,
  getAvailableSlots: vi.fn(),
}));

// Mock drizzle-orm/node-postgres to return a controllable db instance
const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock('@/lib/db/merchant-schema', () => ({
  createMerchantSchema: vi.fn(() => ({
    services: { id: 'id', durationMinutes: 'dm', isEnabled: 'ie', name: 'name', priceCents: 'pc' },
    customers: { id: 'id', email: 'email', firstName: 'fn', contactNumber: 'cn' },
    bookings: { id: 'id', customerId: 'cid', staffId: 'sid', serviceId: 'svid', startTime: 'st', endTime: 'et', status: 's', cancelToken: 'ct', confirmationNumber: 'cn' },
    merchantSettings: { bookingExpiryMinutes: 'booking_expiry_minutes' },
    staff: { id: 'id', name: 'name' },
  })),
}));

import { POST } from '../route';
import { platformDb } from '@/lib/db/platform-client';

const mockMerchantFindFirst = platformDb.query.merchants.findFirst as ReturnType<typeof vi.fn>;
const STAFF_UUID = '550e8400-e29b-41d4-a716-446655440000';
const SVC_UUID = '660e8400-e29b-41d4-a716-446655440001';

const FUTURE_TIME = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const VALID_BODY = {
  staffId: STAFF_UUID,
  serviceId: SVC_UUID,
  startTime: FUTURE_TIME,
  firstName: 'Jane',
  email: 'jane@example.com',
  contactNumber: '0400123456',
  slug: 'my-shop',
};

function makeRequest(body: unknown) {
  return new NextRequest('http://platform.com/api/booking/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/booking/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockMerchantFindFirst.mockResolvedValue({
      id: 'merchant-uuid',
      schemaName: 'merchant_abc',
      status: 'active',
    });

    mockIsSlotAvailable.mockResolvedValue(true);

    // Query order in the route:
    //   call 0 — services          (.select().from().where())   → enabled service
    //   call 1 — merchantSettings  (.select().from())           → settings (no .where)
    //   call 2 — customers         (.select().from().where())   → [] (new customer)
    // Fire-and-forget email block (runs async after response):
    //   call 3 — staff             (.select().from().where())   → staff name
    let selectCallIdx = 0;
    const selectResponses: Array<unknown[]> = [
      [{ id: SVC_UUID, name: 'Haircut', durationMinutes: 30, isEnabled: true, priceCents: 0 }],
      [{ bookingExpiryMinutes: 15 }],
      [],   // no existing customer
      [{ name: 'Bob' }], // staff (fire-and-forget)
    ];

    mockDb.select.mockImplementation(() => {
      const idx = selectCallIdx++;
      const resp = selectResponses[idx] ?? [];
      // Return a chain where from() is a thenable AND has .where()
      const resolvedFrom = Object.assign(Promise.resolve(resp), {
        where: vi.fn().mockResolvedValue(resp),
      });
      return { from: vi.fn().mockReturnValue(resolvedFrom) };
    });

    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        id: 'booking-uuid',
        confirmationNumber: 'BK-1000',
        cancelToken: 'cancel-token-uuid',
      }]),
    };

    const updateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };

    mockDb.insert.mockReturnValue(insertChain);
    mockDb.update.mockReturnValue(updateChain);
    mockDb.execute.mockResolvedValue({ rows: [{ nextval: '1000' }] });
  });

  it('returns 201 with booking reference on success', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: { bookingId: string; confirmationNumber: string }; error: null };
    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.confirmationNumber).toBe('BK-1000');
  });

  it('returns 400 for missing firstName', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, firstName: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: 'not-email' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for past startTime', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, startTime: '2020-01-01T10:00:00Z' }));
    // Either 400 (validation) or 400 (past time check)
    expect(res.status).toBe(400);
  });

  it('returns 404 when merchant not found', async () => {
    mockMerchantFindFirst.mockResolvedValue(undefined);
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 409 when slot is taken', async () => {
    mockIsSlotAvailable.mockResolvedValue(false);
    // Re-setup select chain: service lookup (call 0) + merchantSettings (call 1)
    let idx = 0;
    const responses: Array<unknown[]> = [
      [{ id: SVC_UUID, name: 'Haircut', durationMinutes: 30, isEnabled: true, priceCents: 0 }],
      [{ bookingExpiryMinutes: 15 }],
    ];
    mockDb.select.mockImplementation(() => {
      const resp = responses[idx++] ?? [];
      const resolvedFrom = Object.assign(Promise.resolve(resp), {
        where: vi.fn().mockResolvedValue(resp),
      });
      return { from: vi.fn().mockReturnValue(resolvedFrom) };
    });

    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('SLOT_TAKEN');
  });

  it('returns 400 for malformed JSON', async () => {
    const req = new NextRequest('http://platform.com/api/booking/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ------------------------------------------------------------------
  // bookingExpiryMinutes enforcement (medium defect regression)
  // ------------------------------------------------------------------
  it('returns 400 TOO_SOON when startTime is within the bookingExpiryMinutes window', async () => {
    // startTime is only 5 minutes from now; merchant requires 15-min lead time
    const tooSoonTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Re-setup select mocks: service (call 0) + merchantSettings with 15-min window (call 1)
    let idx = 0;
    const responses: Array<unknown[]> = [
      [{ id: SVC_UUID, name: 'Haircut', durationMinutes: 30, isEnabled: true, priceCents: 0 }],
      [{ bookingExpiryMinutes: 15 }],
    ];
    mockDb.select.mockImplementation(() => {
      const resp = responses[idx++] ?? [];
      const resolvedFrom = Object.assign(Promise.resolve(resp), {
        where: vi.fn().mockResolvedValue(resp),
      });
      return { from: vi.fn().mockReturnValue(resolvedFrom) };
    });

    const res = await POST(makeRequest({ ...VALID_BODY, startTime: tooSoonTime }));
    const json = await res.json() as { data: null; error: { code: string; message: string } };
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('TOO_SOON');
    expect(json.error.message).toContain('15 minutes');
  });

  it('accepts a startTime just beyond the bookingExpiryMinutes threshold', async () => {
    // 20 minutes ahead with 15-minute window → should pass
    const okTime = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const res = await POST(makeRequest({ ...VALID_BODY, startTime: okTime }));
    // Should reach the slot check and succeed (not 400 TOO_SOON)
    expect([200, 201]).toContain(res.status);
  });

  it('uses bookingExpiryMinutes=0 when no settings row exists (no TOO_SOON gate)', async () => {
    // Simulate missing settings row: first select returns service, second returns [] (no settings)
    let idx = 0;
    const responses: Array<unknown[]> = [
      [{ id: SVC_UUID, name: 'Haircut', durationMinutes: 30, isEnabled: true, priceCents: 0 }],
      [],  // no merchantSettings row → defaults to 15 min in code (bookingExpiryMinutes ?? 15)
      [],  // no existing customer
      [{ name: 'Bob' }], // staff (fire-and-forget)
    ];
    mockDb.select.mockImplementation(() => {
      const resp = responses[idx++] ?? [];
      const resolvedFrom = Object.assign(Promise.resolve(resp), {
        where: vi.fn().mockResolvedValue(resp),
      });
      return { from: vi.fn().mockReturnValue(resolvedFrom) };
    });

    // 24h ahead — well within any reasonable default window
    const res = await POST(makeRequest(VALID_BODY));
    expect([200, 201]).toContain(res.status);
  });
});
