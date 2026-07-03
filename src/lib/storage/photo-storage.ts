/**
 * Photo storage abstraction (PROJ-42).
 *
 * Avatars are written under `${PHOTO_STORAGE_PATH}/avatars/` and served back
 * through the `/api/avatars/[filename]` route. `PHOTO_STORAGE_PATH` is a local
 * directory in development and an object-store-backed path in production.
 *
 * This module is the single integration point for storage. A future S3 (or
 * other object-store) driver can replace the `node:fs` calls below without any
 * change to callers — `savePhoto` / `deletePhoto` are the stable contract.
 */
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { env } from '@/lib/env';
import {
  ALLOWED_AVATAR_MIME,
  MAX_AVATAR_BYTES,
  extensionForMime,
  type AllowedAvatarMime,
} from '@/lib/validations/profile';

/** Thrown for any storage-layer failure (validation, write, etc.). */
export class PhotoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoStorageError';
  }
}

const AVATARS_SUBDIR = 'avatars';
const PUBLIC_PREFIX = '/api/avatars/';

/** Absolute (or configured-relative) directory where avatars are stored. */
export function avatarsDir(): string {
  return path.join(env.PHOTO_STORAGE_PATH, AVATARS_SUBDIR);
}

interface SavePhotoArgs {
  buffer: Buffer;
  mimeType: string;
  /** Scopes the filename so avatars are attributable and collision-free. */
  userId: string;
}

/**
 * Persist an avatar and return the public URL used to serve it.
 * The filename embeds a random token so each upload yields a new, cache-busting
 * URL (the previous file is removed separately via {@link deletePhoto}).
 *
 * @throws {PhotoStorageError} for an unsupported type, oversized file, or write failure.
 */
export async function savePhoto({ buffer, mimeType, userId }: SavePhotoArgs): Promise<string> {
  if (!ALLOWED_AVATAR_MIME.includes(mimeType as AllowedAvatarMime)) {
    throw new PhotoStorageError(`Unsupported file type: ${mimeType}. Only JPEG and PNG are allowed.`);
  }
  if (buffer.byteLength > MAX_AVATAR_BYTES) {
    throw new PhotoStorageError('File must be under 5MB.');
  }

  const ext = extensionForMime(mimeType as AllowedAvatarMime);
  const filename = `${userId}-${randomBytes(8).toString('hex')}.${ext}`;

  try {
    await mkdir(avatarsDir(), { recursive: true });
    await writeFile(path.join(avatarsDir(), filename), buffer);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    throw new PhotoStorageError(`Failed to store avatar: ${reason}`);
  }

  return `${PUBLIC_PREFIX}${filename}`;
}

/**
 * Best-effort removal of a previously stored avatar. Safe to call with `null`,
 * an external URL, or a stale path — anything outside the avatars namespace is
 * ignored, and a missing file is not treated as an error.
 */
export async function deletePhoto(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(PUBLIC_PREFIX)) return;

  const filename = url.slice(PUBLIC_PREFIX.length);
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return;
  }

  try {
    await unlink(path.join(avatarsDir(), filename));
  } catch {
    // File already gone or never written — nothing to clean up.
  }
}
