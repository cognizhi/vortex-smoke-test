/**
 * Unit tests for the per-slug DB resolver.
 *
 * The actual database lookup is mocked — we test the caching behaviour,
 * error throwing, and cache eviction functions.
 *
 * Environment variables are provided by .env.test (loaded by bun test / vitest
 * globalSetup) so the env module validates cleanly without real credentials.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock pg Pool so no real TCP connections are made
// ---------------------------------------------------------------------------
vi.mock('pg', () => {
  const Pool = vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  }));
  return { Pool };
});

// ---------------------------------------------------------------------------
// Mock drizzle to return a controllable instance
// ---------------------------------------------------------------------------
const mockFindFirst = vi.fn();
const mockDrizzleInstance = {
  query: {
    merchants: {
      findFirst: mockFindFirst,
    },
  },
};
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => mockDrizzleInstance),
}));

// Mock drizzle-orm eq helper (avoids real DB expression building)
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks are declared
// ---------------------------------------------------------------------------
import {
  getMerchantDb,
  evictMerchantDbCache,
  clearMerchantDbCache,
  MerchantNotFoundError,
} from '@/lib/db/get-merchant-db';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getMerchantDb', () => {
  beforeEach(() => {
    clearMerchantDbCache();
    mockFindFirst.mockReset();
  });

  afterEach(() => {
    clearMerchantDbCache();
    vi.clearAllMocks();
  });

  it('returns a db instance for an active merchant', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'abc123',
      slug: 'glamour-studio',
      schemaName: 'merchant_abc123',
      status: 'active',
    });

    const db = await getMerchantDb('glamour-studio');
    expect(db).toBeDefined();
    expect(mockFindFirst).toHaveBeenCalledTimes(1);
  });

  it('caches the db instance on the second call', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'abc123',
      slug: 'glamour-studio',
      schemaName: 'merchant_abc123',
      status: 'active',
    });

    const db1 = await getMerchantDb('glamour-studio');
    const db2 = await getMerchantDb('glamour-studio');

    // Second call should use cache — query only called once
    expect(mockFindFirst).toHaveBeenCalledTimes(1);
    expect(db1).toBe(db2);
  });

  it('throws MerchantNotFoundError when merchant does not exist', async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    await expect(getMerchantDb('unknown-slug')).rejects.toThrow(MerchantNotFoundError);
  });

  it('throws MerchantNotFoundError when merchant is suspended', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'abc123',
      slug: 'suspended-merchant',
      schemaName: 'merchant_abc123',
      status: 'suspended',
    });

    await expect(getMerchantDb('suspended-merchant')).rejects.toThrow(MerchantNotFoundError);
  });

  it('throws MerchantNotFoundError when merchant is cancelled', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'abc123',
      slug: 'cancelled-merchant',
      schemaName: 'merchant_abc123',
      status: 'cancelled',
    });

    await expect(getMerchantDb('cancelled-merchant')).rejects.toThrow(MerchantNotFoundError);
  });

  it('throws MerchantNotFoundError when merchant is still provisioning', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'abc123',
      slug: 'new-merchant',
      schemaName: 'merchant_abc123',
      status: 'provisioning',
    });

    await expect(getMerchantDb('new-merchant')).rejects.toThrow(MerchantNotFoundError);
  });
});

describe('evictMerchantDbCache', () => {
  beforeEach(() => {
    clearMerchantDbCache();
    mockFindFirst.mockReset();
  });

  it('forces a fresh DB lookup after eviction', async () => {
    mockFindFirst
      .mockResolvedValueOnce({
        id: 'abc123',
        slug: 'glamour-studio',
        schemaName: 'merchant_abc123',
        status: 'active',
      })
      .mockResolvedValueOnce({
        id: 'abc123',
        slug: 'glamour-studio',
        schemaName: 'merchant_abc123',
        status: 'active',
      });

    await getMerchantDb('glamour-studio');
    evictMerchantDbCache('glamour-studio');
    await getMerchantDb('glamour-studio');

    expect(mockFindFirst).toHaveBeenCalledTimes(2);
  });
});

describe('clearMerchantDbCache', () => {
  beforeEach(() => {
    clearMerchantDbCache();
    mockFindFirst.mockReset();
  });

  it('clears all cached entries', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'abc123',
      slug: 'any-slug',
      schemaName: 'merchant_abc123',
      status: 'active',
    });

    await getMerchantDb('salon-a');
    await getMerchantDb('salon-b');
    clearMerchantDbCache();

    // After clearing, two new calls should hit DB again
    await getMerchantDb('salon-a');
    await getMerchantDb('salon-b');

    expect(mockFindFirst).toHaveBeenCalledTimes(4);
  });
});

describe('MerchantNotFoundError', () => {
  it('has the correct name property', () => {
    const err = new MerchantNotFoundError('my-slug');
    expect(err.name).toBe('MerchantNotFoundError');
  });

  it('includes the slug in the message', () => {
    const err = new MerchantNotFoundError('my-slug');
    expect(err.message).toContain('my-slug');
  });

  it('is an instance of Error', () => {
    const err = new MerchantNotFoundError('x');
    expect(err).toBeInstanceOf(Error);
  });
});
