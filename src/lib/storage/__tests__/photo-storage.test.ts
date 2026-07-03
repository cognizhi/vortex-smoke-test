import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockUnlink = vi.hoisted(() => vi.fn());

vi.mock('node:fs/promises', () => ({
  default: { writeFile: mockWriteFile, mkdir: mockMkdir, unlink: mockUnlink },
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  unlink: mockUnlink,
}));

vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://t:t@localhost:5432/t',
    NODE_ENV: 'test',
    PHOTO_STORAGE_PATH: './uploads',
  },
}));

import { savePhoto, deletePhoto, PhotoStorageError } from '@/lib/storage/photo-storage';

describe('savePhoto', () => {
  beforeEach(() => {
    mockWriteFile.mockReset().mockResolvedValue(undefined);
    mockMkdir.mockReset().mockResolvedValue(undefined);
  });

  it('PS-01: returns an /api/avatars/ URL for a valid JPEG and scopes the name to the user', async () => {
    const url = await savePhoto({
      buffer: Buffer.from('jpeg-data'),
      mimeType: 'image/jpeg',
      userId: 'user-123',
    });
    expect(url).toMatch(/^\/api\/avatars\//);
    expect(url).toContain('user-123');
    expect(url).toMatch(/\.jpg$/);
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('PS-02: writes a .png for image/png', async () => {
    const url = await savePhoto({
      buffer: Buffer.from('png-data'),
      mimeType: 'image/png',
      userId: 'u1',
    });
    expect(url).toMatch(/\.png$/);
  });

  it('PS-03: throws PhotoStorageError for an unsupported mime type', async () => {
    await expect(
      savePhoto({ buffer: Buffer.from('gif'), mimeType: 'image/gif', userId: 'u1' }),
    ).rejects.toBeInstanceOf(PhotoStorageError);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('PS-04: throws (mentioning 5MB) when the file exceeds 5MB', async () => {
    await expect(
      savePhoto({ buffer: Buffer.alloc(6 * 1024 * 1024), mimeType: 'image/jpeg', userId: 'u1' }),
    ).rejects.toThrow(/5MB/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('PS-05: wraps a filesystem write failure in PhotoStorageError', async () => {
    mockWriteFile.mockRejectedValueOnce(new Error('disk full'));
    await expect(
      savePhoto({ buffer: Buffer.from('jpeg'), mimeType: 'image/jpeg', userId: 'u1' }),
    ).rejects.toBeInstanceOf(PhotoStorageError);
  });
});

describe('deletePhoto', () => {
  beforeEach(() => {
    mockUnlink.mockReset().mockResolvedValue(undefined);
  });

  it('PS-06: unlinks the file for a stored avatar URL', async () => {
    await deletePhoto('/api/avatars/user-123-abc.jpg');
    expect(mockUnlink).toHaveBeenCalledOnce();
  });

  it('PS-07: is a no-op for null', async () => {
    await deletePhoto(null);
    expect(mockUnlink).not.toHaveBeenCalled();
  });

  it('PS-08: ignores URLs outside the avatars namespace', async () => {
    await deletePhoto('https://cdn.example.com/evil/../../etc/passwd');
    expect(mockUnlink).not.toHaveBeenCalled();
  });

  it('PS-09: swallows a missing-file error', async () => {
    mockUnlink.mockRejectedValueOnce(Object.assign(new Error('nope'), { code: 'ENOENT' }));
    await expect(deletePhoto('/api/avatars/gone.png')).resolves.toBeUndefined();
  });
});
