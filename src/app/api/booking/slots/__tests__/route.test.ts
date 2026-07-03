/**
 * Unit tests for GET /api/booking/slots
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/lib/db/platform-client', () => ({
  platformDb: { query: { merchants: { findFirst: vi.fn() } } },
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({})),
}));

vi.mock('@/lib/db/merchant-schema', () => ({
  createMerchantSchema: vi.fn(() => ({})),
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

const mockGetAvailableSlots = vi.hoisted(() => vi.fn());
vi.mock('@/lib/slots', () => ({ getAvailableSlots: mockGetAvailableSlots, isSlotAvailable: vi.fn() }));

import { GET } from '../route';
import { platformDb } from '@/lib/db/platform-client';

const mockMerchantFindFirst = platformDb.query.merchants.findFirst as ReturnType<typeof vi.fn>;

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://platform.com/api/booking/slots');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/booking/slots', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockMerchantFindFirst.mockResolvedValue({
      schemaName: 'merchant_abc',
      status: 'active',
    });
    mockGetAvailableSlots.mockResolvedValue([
      {
        startTime: new Date('2026-06-15T09:00:00Z'),
        endTime: new Date('2026-06-15T09:30:00Z'),
      },
    ]);
  });

  it('returns 200 with slots for valid params', async () => {
    const res = await GET(makeRequest({ staffId: UUID, serviceId: UUID, date: '2026-06-15', slug: 'my-shop' }));
    const json = await res.json() as { data: { slots: unknown[] }; error: null };
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(Array.isArray(json.data.slots)).toBe(true);
    expect(json.data.slots).toHaveLength(1);
  });

  it('returns 400 for invalid date format', async () => {
    const res = await GET(makeRequest({ staffId: UUID, serviceId: UUID, date: 'bad-date', slug: 'my-shop' }));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for non-UUID staffId', async () => {
    const res = await GET(makeRequest({ staffId: 'not-uuid', serviceId: UUID, date: '2026-06-15', slug: 'my-shop' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when merchant not found', async () => {
    mockMerchantFindFirst.mockResolvedValue(undefined);
    const res = await GET(makeRequest({ staffId: UUID, serviceId: UUID, date: '2026-06-15', slug: 'no-merchant' }));
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when merchant is suspended', async () => {
    mockMerchantFindFirst.mockResolvedValue({ schemaName: 'abc', status: 'suspended' });
    const res = await GET(makeRequest({ staffId: UUID, serviceId: UUID, date: '2026-06-15', slug: 'my-shop' }));
    expect(res.status).toBe(404);
  });

  it('returns empty slots array when no slots available', async () => {
    mockGetAvailableSlots.mockResolvedValue([]);
    const res = await GET(makeRequest({ staffId: UUID, serviceId: UUID, date: '2026-06-15', slug: 'my-shop' }));
    const json = await res.json() as { data: { slots: unknown[] } };
    expect(json.data.slots).toHaveLength(0);
  });

  it('sets Cache-Control: no-store header', async () => {
    const res = await GET(makeRequest({ staffId: UUID, serviceId: UUID, date: '2026-06-15', slug: 'my-shop' }));
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
