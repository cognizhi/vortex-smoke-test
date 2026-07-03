/**
 * GET /api/avatars/[filename] — serve a stored avatar.
 *
 * Public (avatars are not secret). The filename is sanitised to prevent path
 * traversal, and only image extensions are served. Files are immutable (the URL
 * changes on every upload) so they are cached aggressively.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/lib/env';

type Params = { params: Promise<{ filename: string }> };

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

function badRequest(message: string): NextResponse {
  return NextResponse.json({ data: null, error: { code: 'INVALID_INPUT', message } }, { status: 400 });
}

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const { filename } = await params;

  if (
    !filename ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('..') ||
    filename.startsWith('.')
  ) {
    return badRequest('Invalid filename.');
  }

  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) {
    return badRequest('Unsupported file type.');
  }

  try {
    const bytes = await readFile(path.join(env.PHOTO_STORAGE_PATH, 'avatars', filename));
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Avatar not found.' } },
      { status: 404 },
    );
  }
}
