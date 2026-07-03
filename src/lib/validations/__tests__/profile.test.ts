import { describe, it, expect } from 'vitest';
import {
  avatarUploadSchema,
  MAX_AVATAR_BYTES,
  ALLOWED_AVATAR_MIME,
  extensionForMime,
} from '@/lib/validations/profile';

describe('avatarUploadSchema', () => {
  it('VP-01: accepts a JPEG under 5MB', () => {
    const r = avatarUploadSchema.safeParse({ mimeType: 'image/jpeg', sizeBytes: 1024 });
    expect(r.success).toBe(true);
  });

  it('VP-02: accepts a PNG exactly at the 5MB limit', () => {
    const r = avatarUploadSchema.safeParse({ mimeType: 'image/png', sizeBytes: MAX_AVATAR_BYTES });
    expect(r.success).toBe(true);
  });

  it('VP-03: rejects an unsupported mime type (gif)', () => {
    const r = avatarUploadSchema.safeParse({ mimeType: 'image/gif', sizeBytes: 1024 });
    expect(r.success).toBe(false);
  });

  it('VP-04: rejects a file over 5MB', () => {
    const r = avatarUploadSchema.safeParse({ mimeType: 'image/jpeg', sizeBytes: MAX_AVATAR_BYTES + 1 });
    expect(r.success).toBe(false);
  });

  it('VP-05: rejects a zero-byte file', () => {
    const r = avatarUploadSchema.safeParse({ mimeType: 'image/png', sizeBytes: 0 });
    expect(r.success).toBe(false);
  });

  it('VP-06: exposes the allowed mime constants', () => {
    expect(ALLOWED_AVATAR_MIME).toEqual(['image/jpeg', 'image/png']);
  });

  it('VP-07: maps mime types to file extensions', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/png')).toBe('png');
  });
});
