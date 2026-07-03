/**
 * Unit tests for branding-queries module
 *
 * Covers:
 * - upsertBranding with only siteName (update path)
 * - upsertBranding with only avatarUrl (update path)
 * - upsertBranding with both fields (update path)
 * - upsertBranding insert path (when no existing record)
 * - Conditional field updates (only provided fields are updated)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertBranding, getBranding } from '../branding-queries';

// ---------------------------------------------------------------------------
// Mock Drizzle ORM chains
// ---------------------------------------------------------------------------

// For insert operations
const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

// For update operations
const mockUpdateReturning = vi.fn();
const mockUpdateSet = vi.fn(() => ({ returning: mockUpdateReturning }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

// For select operations (checking if branding exists)
const mockSelectLimit = vi.fn();
const mockSelectFrom = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

// For getBranding
const mockGetBrandingLimit = vi.fn();
const mockGetBrandingFrom = vi.fn(() => ({ limit: mockGetBrandingLimit }));
const mockGetBrandingSelect = vi.fn(() => ({ from: mockGetBrandingFrom }));

const mockDb = {
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
} as never;

const mockBrandingTable = {
  id: { name: 'id' },
  siteName: { name: 'siteName' },
  avatarUrl: { name: 'avatarUrl' },
  updatedAt: { name: 'updatedAt' },
} as never;

const mockSchema = {
  merchantBranding: mockBrandingTable,
} as never;

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  mockInsertReturning.mockReset();
  mockInsertValues.mockReset().mockReturnValue({ returning: mockInsertReturning });
  mockInsert.mockReset().mockReturnValue({ values: mockInsertValues });

  mockUpdateReturning.mockReset();
  mockUpdateSet.mockReset().mockReturnValue({ returning: mockUpdateReturning });
  mockUpdate.mockReset().mockReturnValue({ set: mockUpdateSet });

  mockSelectLimit.mockReset();
  mockSelectFrom.mockReset().mockReturnValue({ limit: mockSelectLimit });
  mockSelect.mockReset().mockReturnValue({ from: mockSelectFrom });

  mockGetBrandingLimit.mockReset();
  mockGetBrandingFrom.mockReset().mockReturnValue({ limit: mockGetBrandingLimit });
  mockGetBrandingSelect.mockReset().mockReturnValue({ from: mockGetBrandingFrom });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('upsertBranding', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('UT-01: updates existing record with only siteName field', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'Old Salon',
      avatarUrl: 'https://old.com/avatar.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      id: 'branding-1',
      siteName: 'New Salon',
      avatarUrl: 'https://old.com/avatar.png',
      updatedAt: new Date(),
    };

    // Mock select to return existing branding
    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    // Mock update to return updated branding
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    const result = await upsertBranding(mockDb, mockSchema, 'New Salon', undefined);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(result.siteName).toBe('New Salon');
    expect(result.avatarUrl).toBe('https://old.com/avatar.png');
  });

  it('UT-02: updates existing record with only avatarUrl field', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'My Salon',
      avatarUrl: 'https://old.com/avatar.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      id: 'branding-1',
      siteName: 'My Salon',
      avatarUrl: 'https://new.com/avatar.png',
      updatedAt: new Date(),
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    const result = await upsertBranding(mockDb, mockSchema, undefined, 'https://new.com/avatar.png');

    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(result.avatarUrl).toBe('https://new.com/avatar.png');
  });

  it('UT-03: updates existing record with both siteName and avatarUrl', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'Old Salon',
      avatarUrl: 'https://old.com/avatar.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      id: 'branding-1',
      siteName: 'New Salon',
      avatarUrl: 'https://new.com/avatar.png',
      updatedAt: new Date(),
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    const result = await upsertBranding(mockDb, mockSchema, 'New Salon', 'https://new.com/avatar.png');

    expect(result.siteName).toBe('New Salon');
    expect(result.avatarUrl).toBe('https://new.com/avatar.png');
  });

  it('UT-04: inserts new record when none exists', async () => {
    const newRow = {
      id: 'branding-1',
      siteName: 'My Salon',
      avatarUrl: 'https://example.com/avatar.png',
      updatedAt: new Date(),
    };

    // Mock select to return empty (no existing branding)
    mockSelectLimit.mockResolvedValueOnce([]);
    // Mock insert to return new branding
    mockInsertReturning.mockResolvedValueOnce([newRow]);

    const result = await upsertBranding(mockDb, mockSchema, 'My Salon', 'https://example.com/avatar.png');

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result).toEqual(newRow);
  });

  it('UT-05: only updates provided fields (no undefined values sent)', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'Old Name',
      avatarUrl: 'https://old.com/avatar.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      ...existingBranding,
      siteName: 'Updated Name',
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    await upsertBranding(mockDb, mockSchema, 'Updated Name', undefined);

    expect(mockUpdateSet).toHaveBeenCalledOnce();
    const updateSet = mockUpdateSet.mock.calls[0][0] as Record<string, any>;

    // Should have updatedAt and siteName but not avatarUrl
    expect(updateSet).toHaveProperty('updatedAt');
    expect(updateSet).toHaveProperty('siteName');
    expect(updateSet).not.toHaveProperty('avatarUrl');

    Object.values(updateSet).forEach((val) => {
      expect(val).not.toBeUndefined();
    });
  });

  it('UT-06: includes updatedAt timestamp in every update', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'Old Name',
      avatarUrl: null,
      updatedAt: new Date(),
    };
    const updatedRow = {
      ...existingBranding,
      siteName: 'My Salon',
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    await upsertBranding(mockDb, mockSchema, 'My Salon', undefined);

    const updateSet = mockUpdateSet.mock.calls[0][0] as Record<string, any>;
    expect(updateSet).toHaveProperty('updatedAt');
  });

  it('UT-07: handles empty string as provided (conditional on undefined check)', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: '',
      avatarUrl: 'https://example.com/avatar.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      ...existingBranding,
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    await upsertBranding(mockDb, mockSchema, '', 'https://example.com/avatar.png');

    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('UT-08: updates existing record when both fields provided', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'Old Salon',
      avatarUrl: 'https://old.com/avatar.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      id: 'branding-1',
      siteName: 'New Salon',
      avatarUrl: 'https://new.com/avatar.png',
      updatedAt: new Date(),
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    const result = await upsertBranding(mockDb, mockSchema, 'New Salon', 'https://new.com/avatar.png');

    expect(result.siteName).toBe('New Salon');
    expect(result.avatarUrl).toBe('https://new.com/avatar.png');
  });

  it('UT-09: only includes defined fields in update set', async () => {
    const existingBranding = {
      id: 'branding-1',
      siteName: 'Old Name',
      avatarUrl: 'https://example.com/logo.png',
      updatedAt: new Date(),
    };
    const updatedRow = {
      ...existingBranding,
      siteName: 'Updated',
    };

    mockSelectLimit.mockResolvedValueOnce([existingBranding]);
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);

    await upsertBranding(mockDb, mockSchema, 'Updated', undefined);

    expect(mockUpdateSet).toHaveBeenCalled();
    const updateSet = mockUpdateSet.mock.calls[0][0] as Record<string, any>;

    // Should only have updatedAt and siteName (avatarUrl not included)
    expect(updateSet).toHaveProperty('updatedAt');
    expect(updateSet).toHaveProperty('siteName');

    // Verify NO undefined values are present
    Object.entries(updateSet).forEach(([key, val]) => {
      expect(val).not.toBeUndefined();
    });
  });
});

describe('getBranding', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('UT-10: returns branding row when found', async () => {
    const expectedRow = {
      id: 'branding-1',
      siteName: 'My Salon',
      avatarUrl: 'https://example.com/avatar.png',
      updatedAt: new Date(),
    };

    // getBranding uses the main select mocks
    mockSelectLimit.mockResolvedValueOnce([expectedRow]);

    const result = await getBranding(mockDb, mockSchema);

    expect(result).toEqual(expectedRow);
  });

  it('UT-11: returns null when branding not found', async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const result = await getBranding(mockDb, mockSchema);

    expect(result).toBeNull();
  });
});
