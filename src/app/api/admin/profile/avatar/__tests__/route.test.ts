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

const mockSavePhoto = vi.hoisted(() => vi.fn());
const mockDeletePhoto = vi.hoisted(() => vi.fn());
vi.mock('@/lib/storage/photo-storage', () => ({
  savePhoto: mockSavePhoto,
  deletePhoto: mockDeletePhoto,
  PhotoStorageError: class PhotoStorageError extends Error {},
}));

import { POST } from '../route';

const SESSION = { userId: 'u1', merchantId: 'm1', slug: 'test', role: 'owner' as const };

function buildMockDb(current: string | null = null) {
  const selWhere = vi.fn().mockResolvedValue([{ avatarUrl: current }]);
  const select = vi.fn().mockReturnValue({ from: () => ({ where: selWhere }) });
  const updWhere = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockReturnValue({ set: () => ({ where: updWhere }) });
  return { select, update };
}

function buildAuthOk(db: ReturnType<typeof buildMockDb>) {
  return {
    ok: true as const,
    session: SESSION,
    slug: 'test',
    merchantId: 'm1',
    schemaName: 'merchant_abc',
    schema: { adminUsers: { id: {}, avatarUrl: {}, role: {} } as never },
    db,
  };
}

function buildAuthFail() {
  return {
    ok: false as const,
    response: NextResponse.json({ data: null, error: { code: 'UNAUTHENTICATED' } }, { status: 401 }),
  };
}

// requireAdminAuth is mocked (it ignores the request), so the handler only ever
// touches request.formData(). A stub avoids the jsdom↔undici multipart round-trip
// that drops the File's type/size, keeping this test in the default jsdom env.
function makeUpload(file: File): NextRequest {
  const form = new FormData();
  form.set('file', file);
  return { formData: async (): Promise<FormData> => form } as unknown as NextRequest;
}

describe('POST /api/admin/profile/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSavePhoto.mockResolvedValue('/api/avatars/u1-abc.jpg');
    mockDeletePhoto.mockResolvedValue(undefined);
  });

  it('RH-01: stores a valid JPEG and returns 200 + avatarUrl', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(buildMockDb()));
    const res = await POST(makeUpload(new File(['jpeg'], 'p.jpg', { type: 'image/jpeg' })));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.avatarUrl).toMatch(/avatars\//);
    expect(mockSavePhoto).toHaveBeenCalledOnce();
  });

  it('RH-02: rejects an unsupported mime type with 400 before touching storage', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(buildMockDb()));
    const res = await POST(makeUpload(new File(['gif'], 'a.gif', { type: 'image/gif' })));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('INVALID_INPUT');
    expect(mockSavePhoto).not.toHaveBeenCalled();
  });

  it('RH-03: rejects a file over 5MB with 400 before touching storage', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(buildMockDb()));
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const res = await POST(makeUpload(big));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('INVALID_INPUT');
    expect(mockSavePhoto).not.toHaveBeenCalled();
  });

  it('RH-04: returns 401 when auth fails', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthFail());
    const res = await POST(makeUpload(new File(['jpeg'], 'p.jpg', { type: 'image/jpeg' })));
    expect(res.status).toBe(401);
  });

  it('RH-05: replaces the previous avatar (deletes the old file)', async () => {
    mockRequireAdminAuth.mockResolvedValue(buildAuthOk(buildMockDb('/api/avatars/old.jpg')));
    await POST(makeUpload(new File(['jpeg'], 'p.jpg', { type: 'image/jpeg' })));
    expect(mockDeletePhoto).toHaveBeenCalledWith('/api/avatars/old.jpg');
  });
});
