/**
 * Unit tests for GET/POST /api/cancel/[token]
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

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock('@/lib/db/merchant-schema', () => ({
  createMerchantSchema: vi.fn(() => ({
    bookings: {
      id: 'id', status: 's', startTime: 'st', endTime: 'et',
      confirmationNumber: 'cn', cancelToken: 'ct', customerId: 'cid',
      staffId: 'sid', serviceId: 'svid', cancelledAt: 'ca',
    },
    customers: {
      id: 'id', firstName: 'first_name', email: 'email',
    },
    staff: {
      id: 'id', name: 'name',
    },
    services: {
      id: 'id', name: 'name',
    },
  })),
}));

const mockSendCancellationToCustomer = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSendCancellationAlertToMerchant = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/lib/email/email-service', () => ({
  sendCancellationToCustomer: mockSendCancellationToCustomer,
  sendCancellationAlertToMerchant: mockSendCancellationAlertToMerchant,
}));

import { GET, POST } from '../route';
import { platformDb } from '@/lib/db/platform-client';

const mockMerchantFindFirst = platformDb.query.merchants.findFirst as ReturnType<typeof vi.fn>;
const TOKEN = 'test-cancel-token-uuid';

function makeRequest(method = 'GET') {
  return new NextRequest(`http://glamour.platform.com/api/cancel/${TOKEN}`, {
    method,
    headers: { host: 'glamour.platform.com', 'x-merchant-slug': 'glamour' },
  });
}

const FUTURE_START = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
const PAST_START = new Date(Date.now() - 24 * 60 * 60 * 1000);   // yesterday

describe('GET /api/cancel/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMerchantFindFirst.mockResolvedValue({
      schemaName: 'merchant_abc',
      status: 'active',
      businessName: 'Glamour Studio',
      ownerEmail: 'owner@glamour.com',
    });

    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'booking-uuid',
        status: 'confirmed',
        startTime: FUTURE_START,
        endTime: new Date(FUTURE_START.getTime() + 30 * 60 * 1000),
        confirmationNumber: 'BK-1001',
        cancelToken: TOKEN,
        customerId: 'cust-1',
        staffId: 'staff-1',
        serviceId: 'svc-1',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);
  });

  it('returns 200 with booking and isExpired=false for a future booking', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ token: TOKEN }) });
    const json = await res.json() as { data: { booking: unknown; isExpired: boolean } };
    expect(res.status).toBe(200);
    expect(json.data.isExpired).toBe(false);
  });

  it('returns 200 with isExpired=true for a past booking', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'booking-uuid', status: 'confirmed',
        startTime: PAST_START,
        endTime: new Date(PAST_START.getTime() + 30 * 60 * 1000),
        confirmationNumber: 'BK-1001', cancelToken: TOKEN,
        customerId: 'c', staffId: 's', serviceId: 'sv',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);
    const res = await GET(makeRequest(), { params: Promise.resolve({ token: TOKEN }) });
    const json = await res.json() as { data: { isExpired: boolean } };
    expect(json.data.isExpired).toBe(true);
  });

  it('returns 404 when token not found', async () => {
    const selectChain = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue(selectChain);
    const res = await GET(makeRequest(), { params: Promise.resolve({ token: 'bad-token' }) });
    expect(res.status).toBe(404);
  });

  it('returns 409 when booking is already cancelled', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'bk', status: 'cancelled_customer', startTime: FUTURE_START,
        endTime: FUTURE_START, confirmationNumber: 'BK-1', cancelToken: TOKEN,
        customerId: 'c', staffId: 's', serviceId: 'sv',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);
    const res = await GET(makeRequest(), { params: Promise.resolve({ token: TOKEN }) });
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('ALREADY_CANCELLED');
  });

  it('returns 404 when no x-merchant-slug header', async () => {
    const req = new NextRequest(`http://platform.com/api/cancel/${TOKEN}`, { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ token: TOKEN }) });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/cancel/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMerchantFindFirst.mockResolvedValue({
      schemaName: 'merchant_abc',
      status: 'active',
      businessName: 'Glamour Studio',
      ownerEmail: 'owner@glamour.com',
    });

    // Default: single select mock that returns the booking row (works for most tests).
    // Tests that need extra select calls (email dispatching) set up their own chain.
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'bk', status: 'confirmed',
        startTime: FUTURE_START,
        endTime: new Date(FUTURE_START.getTime() + 30 * 60 * 1000),
        confirmationNumber: 'BK-1001', cancelToken: TOKEN,
        customerId: 'c', staffId: 's', serviceId: 'sv',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);

    const updateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    mockDb.update.mockReturnValue(updateChain);
  });

  it('returns 200 on successful cancellation', async () => {
    const res = await POST(makeRequest('POST'), { params: Promise.resolve({ token: TOKEN }) });
    const json = await res.json() as { data: { success: boolean; confirmationNumber: string } };
    expect(res.status).toBe(200);
    expect(json.data.success).toBe(true);
    expect(json.data.confirmationNumber).toBe('BK-1001');
  });

  it('fires cancellation emails to customer and merchant after successful cancellation (CRIT-1)', async () => {
    // Override select to handle all 4 calls: booking + customer + staff + service
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{
          id: 'bk', status: 'confirmed',
          startTime: FUTURE_START,
          endTime: new Date(FUTURE_START.getTime() + 30 * 60 * 1000),
          confirmationNumber: 'BK-1001', cancelToken: TOKEN,
          customerId: 'c', staffId: 's', serviceId: 'sv',
        }]),
      })
      .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ firstName: 'Alice', email: 'alice@example.com' }]) })
      .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ name: 'Bob' }]) })
      .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ name: 'Haircut' }]) });

    await POST(makeRequest('POST'), { params: Promise.resolve({ token: TOKEN }) });
    // Allow fire-and-forget microtasks to flush
    await new Promise<void>((resolve) => setTimeout(resolve, 20));

    expect(mockSendCancellationToCustomer).toHaveBeenCalledTimes(1);
    expect(mockSendCancellationAlertToMerchant).toHaveBeenCalledTimes(1);

    // Verify email recipients/content
    const customerCall = mockSendCancellationToCustomer.mock.calls[0][0];
    expect(customerCall.customer.email).toBe('alice@example.com');
    expect(customerCall.cancelledBy).toBe('customer');

    const merchantCall = mockSendCancellationAlertToMerchant.mock.calls[0][0];
    expect(merchantCall.merchant.ownerEmail).toBe('owner@glamour.com');
  });

  it('does NOT fire emails for a 409 (already cancelled)', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'bk', status: 'cancelled_customer', startTime: FUTURE_START,
        endTime: FUTURE_START, confirmationNumber: 'BK-1', cancelToken: TOKEN,
        customerId: 'c', staffId: 's', serviceId: 'sv',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);
    await POST(makeRequest('POST'), { params: Promise.resolve({ token: TOKEN }) });
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(mockSendCancellationToCustomer).not.toHaveBeenCalled();
    expect(mockSendCancellationAlertToMerchant).not.toHaveBeenCalled();
  });

  it('returns 409 when already cancelled', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'bk', status: 'cancelled_customer', startTime: FUTURE_START,
        endTime: FUTURE_START, confirmationNumber: 'BK-1', cancelToken: TOKEN,
        customerId: 'c', staffId: 's', serviceId: 'sv',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);
    const res = await POST(makeRequest('POST'), { params: Promise.resolve({ token: TOKEN }) });
    expect(res.status).toBe(409);
  });

  it('returns 410 when booking is expired (past startTime)', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{
        id: 'bk', status: 'confirmed',
        startTime: PAST_START,
        endTime: new Date(PAST_START.getTime() + 30 * 60 * 1000),
        confirmationNumber: 'BK-1', cancelToken: TOKEN,
        customerId: 'c', staffId: 's', serviceId: 'sv',
      }]),
    };
    mockDb.select.mockReturnValue(selectChain);
    const res = await POST(makeRequest('POST'), { params: Promise.resolve({ token: TOKEN }) });
    const json = await res.json() as { data: null; error: { code: string } };
    expect(res.status).toBe(410);
    expect(json.error.code).toBe('EXPIRED');
  });

  it('returns 404 when token not found', async () => {
    const selectChain = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue(selectChain);
    const res = await POST(makeRequest('POST'), { params: Promise.resolve({ token: 'bad' }) });
    expect(res.status).toBe(404);
  });
});
