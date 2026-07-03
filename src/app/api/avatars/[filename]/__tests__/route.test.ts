import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockReadFile = vi.hoisted(() => vi.fn());
vi.mock('node:fs/promises', () => ({ default: { readFile: mockReadFile }, readFile: mockReadFile }));

vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://t:t@localhost:5432/t',
    NODE_ENV: 'test',
    PHOTO_STORAGE_PATH: './uploads',
  },
}));

import { GET } from '../route';

function call(filename: string) {
  const req = new NextRequest('http://localhost/api/avatars/' + encodeURIComponent(filename));
  return GET(req, { params: Promise.resolve({ filename }) });
}

describe('GET /api/avatars/[filename]', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it('AV-01: serves a stored JPEG with image content-type and long cache', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('jpeg-bytes'));
    const res = await call('u1-abc.jpg');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('cache-control')).toMatch(/max-age=31536000/);
  });

  it('AV-02: rejects path traversal with 400 and never reads the filesystem', async () => {
    const res = await call('../../etc/passwd');
    expect(res.status).toBe(400);
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('AV-03: returns 404 when the file does not exist', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('nope'), { code: 'ENOENT' }));
    const res = await call('missing.png');
    expect(res.status).toBe(404);
  });

  it('AV-04: rejects a non-image extension with 400', async () => {
    const res = await call('secrets.txt');
    expect(res.status).toBe(400);
    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
