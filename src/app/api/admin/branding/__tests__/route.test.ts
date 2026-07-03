/**
 * Tests for FormData handling in POST /api/admin/branding
 *
 * Tests cover:
 * - Happy path: file + siteName together
 * - Partial updates: file only, siteName only
 * - Validation errors: invalid file type, oversized file
 * - Error cases: no data, storage failure, database error
 *
 * All tests use Vitest with mocked dependencies.
 * No actual files or database operations are performed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// Mock dependencies
const mockGuard = vi.hoisted(() => vi.fn());
const mockSavePhoto = vi.hoisted(() => vi.fn());
const mockDeletePhoto = vi.hoisted(() => vi.fn());
const mockUpsertBranding = vi.hoisted(() => vi.fn());
const mockGetBranding = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/admin-guard', () => {
  return {
    requireAdminAuth: mockGuard,
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ data, error: null }, { status }),
    apiError: (code: string, message: string, status: number) =>
      NextResponse.json({ data: null, error: { code, message } }, { status }),
  };
});

vi.mock('@/lib/storage/photo-storage', () => ({
  savePhoto: mockSavePhoto,
  deletePhoto: mockDeletePhoto,
  PhotoStorageError: class PhotoStorageError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PhotoStorageError';
    }
  },
}));

vi.mock('@/lib/db/branding-queries', () => ({
  upsertBranding: mockUpsertBranding,
  getBranding: mockGetBranding,
}));

vi.mock('@/lib/validations/profile', () => ({
  avatarUploadSchema: {
    safeParse: (input: { mimeType: string; sizeBytes: number }) => {
      const allowed = [
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/webp',
      ];
      if (!allowed.includes(input.mimeType)) {
        return { success: false, error: { errors: [] } };
      }
      if (input.sizeBytes > 5 * 1024 * 1024) {
        return { success: false, error: { errors: [] } };
      }
      return { success: true, data: input };
    },
  },
}));

// Helper to create a request with FormData
function createRequest(fields: Record<string, string | File>): NextRequest {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return {
    formData: async () => formData,
  } as unknown as NextRequest;
}

// Helper to create a test File
function createFile(
  name: string,
  size: number,
  type: string = 'image/jpeg'
): File {
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type });
}

describe('POST /api/admin/branding - FormData handling', () => {
  let mockDb: any;
  let mockSchema: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {};
    mockSchema = {};

    // Default: authenticated admin context
    mockGuard.mockResolvedValue({
      ok: true,
      db: mockDb,
      schema: mockSchema,
      merchantId: 'merchant-123',
      response: null,
    });

    // Default: successful storage save
    mockSavePhoto.mockResolvedValue('https://storage.example.com/avatars/abc123.jpg');

    // Default: successful database upsert
    mockUpsertBranding.mockResolvedValue({
      id: 'branding-1',
      merchantId: 'merchant-123',
      siteName: 'Test Brand',
      avatarUrl: 'https://storage.example.com/avatars/abc123.jpg',
      updatedAt: new Date(),
    });

    // Default: no existing branding (cleanup not needed)
    mockGetBranding.mockResolvedValue(null);
  });

  describe('Happy Path', () => {
    it('RT-01: Upload file + siteName together → both saved, 200 OK', async () => {
      const request = createRequest({
        siteName: 'My Brand',
        avatar: createFile('logo.jpg', 3 * 1024 * 1024, 'image/jpeg'),
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.branding).toBeDefined();
      expect(mockSavePhoto).toHaveBeenCalled();
      expect(mockUpsertBranding).toHaveBeenCalledWith(
        mockDb,
        mockSchema,
        'My Brand',
        'https://storage.example.com/avatars/abc123.jpg'
      );
    });
  });

  describe('Partial Updates', () => {
    it('RT-02: Upload file only → avatarUrl saved, siteName unchanged', async () => {
      const request = createRequest({
        avatar: createFile('logo.jpg', 2 * 1024 * 1024, 'image/png'),
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.data.branding).toBeDefined();
      expect(mockSavePhoto).toHaveBeenCalled();
      expect(mockUpsertBranding).toHaveBeenCalledWith(
        mockDb,
        mockSchema,
        undefined,
        'https://storage.example.com/avatars/abc123.jpg'
      );
    });

    it('RT-03: Update siteName only → siteName saved, avatarUrl unchanged', async () => {
      const request = createRequest({
        siteName: 'Updated Brand',
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.data.branding).toBeDefined();
      expect(mockSavePhoto).not.toHaveBeenCalled();
      expect(mockUpsertBranding).toHaveBeenCalledWith(
        mockDb,
        mockSchema,
        'Updated Brand',
        undefined
      );
    });
  });

  describe('Validation Errors', () => {
    it('RT-04: Invalid file type (.pdf) → 400 error', async () => {
      const request = createRequest({
        avatar: createFile('document.pdf', 1 * 1024 * 1024, 'application/pdf'),
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_INPUT');
      expect(data.error.message).toContain('JPEG');
      expect(mockSavePhoto).not.toHaveBeenCalled();
      expect(mockUpsertBranding).not.toHaveBeenCalled();
    });

    it('RT-05: File too large (>5MB) → 400 error', async () => {
      const request = createRequest({
        avatar: createFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg'),
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_INPUT');
      expect(data.error.message).toContain('5MB');
      expect(mockSavePhoto).not.toHaveBeenCalled();
      expect(mockUpsertBranding).not.toHaveBeenCalled();
    });

    it('RT-06: No siteName AND no file → 400 error', async () => {
      const request = createRequest({});

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_INPUT');
      expect(data.error.message).toContain('At least one');
      expect(mockSavePhoto).not.toHaveBeenCalled();
      expect(mockUpsertBranding).not.toHaveBeenCalled();
    });
  });

  describe('Server Errors', () => {
    it('RT-07: Storage failure during upload → 500 error', async () => {
      mockSavePhoto.mockRejectedValue(
        new Error('Storage service down')
      );

      const request = createRequest({
        avatar: createFile('logo.jpg', 2 * 1024 * 1024, 'image/jpeg'),
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('failed');
      expect(mockUpsertBranding).not.toHaveBeenCalled();
    });

    it('RT-08: Database error during upsert → 500 error', async () => {
      mockUpsertBranding.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createRequest({
        siteName: 'Test Brand',
      });

      const response = await POST(request);
      const data = await response.json() as any;

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Database');
    });
  });
});
