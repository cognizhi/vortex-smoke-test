import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

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

import { GET } from '../route';

const SESSION = { userId: 'u1', merchantId: 'm1', slug: 'test', role: 'owner' as const };

function buildMockDb(row: unknown) {
  const where = vi.fn().mockResolvedValue(row ? [row] : []);
  const select = vi.fn().mockReturnValue({ from: () => ({ where }) });
  return { select };
}

function buildAuthOk(db: ReturnType<typeof buildMockDb>) {
  return {
    ok: true as const,
    session: SESSION,
    slug: 'test',
    merchantId: 'm1',
    schemaName: 'merchant_abc',
    schema: { adminUsers: { id: {}, name: {}, email: {}, avatarUrl: {}, role: {} } as never },
    db,
  };
}

function makeRequest(): NextRequest {
  return new NextRequest('http://test.localhost/api/admin/profile', { method: 'GET' });
}

describe('GET /api/admin/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('RP-01: returns the current admin profile', async () => {
    const row = { id: 'u1', name: 'Jane', email: 'jane@acme.com', avatarUrl: '/api/avatars/j.jpg' };
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(buildMockDb(row)));
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toMatchObject(row);
  });

  it('RP-02: returns 401 when auth fails', async () => {
    mockRequireAdminAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED' } }, { status: 401 }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('RP-03: returns 404 when the admin row is missing', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(buildMockDb(null)));
    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });
});
