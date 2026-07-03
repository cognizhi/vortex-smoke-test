/**
 * Unit tests for GET /api/check-slug
 *
 * The DB lookup is mocked — we test:
 *   - Invalid slug formats → 200 {available: false, reason: 'invalid'}
 *   - Reserved slugs       → 200 {available: false, reason: 'reserved'}
 *   - Available slug       → 200 {available: true}
 *   - Taken slug           → 200 {available: false, reason: 'taken'}
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mock the platform-client so no real DB connections are made
// ---------------------------------------------------------------------------
const mockFindFirst = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/platform-client', () => ({
  platformDb: {
    query: {
      merchants: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

// Must import after mocks
import { GET } from '../route';

function makeRequest(slug: string): NextRequest {
  return new NextRequest(`http://platform.com/api/check-slug?slug=${encodeURIComponent(slug)}`);
}

describe('GET /api/check-slug', () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns available=true for a free slug', async () => {
    mockFindFirst.mockResolvedValueOnce(undefined);
    const res = await GET(makeRequest('glamour-studio'));
    const json = await res.json() as { data: { available: boolean } };
    expect(res.status).toBe(200);
    expect(json.data.available).toBe(true);
  });

  it('returns available=false (taken) for a taken slug', async () => {
    mockFindFirst.mockResolvedValueOnce({ slug: 'glamour-studio' });
    const res = await GET(makeRequest('glamour-studio'));
    const json = await res.json() as { data: { available: boolean; reason: string } };
    expect(res.status).toBe(200);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('taken');
  });

  it('returns available=false (invalid) for an invalid slug without hitting DB', async () => {
    const res = await GET(makeRequest('UPPERCASE'));
    const json = await res.json() as { data: { available: boolean; reason: string } };
    expect(res.status).toBe(200);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('invalid');
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('returns available=false (invalid) for a too-short slug', async () => {
    const res = await GET(makeRequest('ab'));
    const json = await res.json() as { data: { available: boolean; reason: string } };
    expect(json.data.reason).toBe('invalid');
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('returns available=false (reserved) for reserved slug "admin"', async () => {
    const res = await GET(makeRequest('admin'));
    const json = await res.json() as { data: { available: boolean; reason: string } };
    expect(res.status).toBe(200);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('reserved');
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('returns available=false (reserved) for all reserved slugs', async () => {
    const reserved = ['www', 'api', 'admin', 'app', 'mail', 'static', 'support', 'help', 'billing', 'status'];
    for (const slug of reserved) {
      const res = await GET(makeRequest(slug));
      const json = await res.json() as { data: { available: boolean; reason: string } };
      expect(json.data.reason).toBe('reserved');
    }
  });

  it('handles DB errors gracefully (treats as available)', async () => {
    mockFindFirst.mockRejectedValueOnce(new Error('DB connection refused'));
    const res = await GET(makeRequest('valid-slug'));
    const json = await res.json() as { data: { available: boolean } };
    expect(res.status).toBe(200);
    expect(json.data.available).toBe(true);
  });

  it('returns the slug in the response', async () => {
    mockFindFirst.mockResolvedValueOnce(undefined);
    const res = await GET(makeRequest('my-shop'));
    const json = await res.json() as { data: { slug: string; available: boolean } };
    expect(json.data.slug).toBe('my-shop');
  });
});
