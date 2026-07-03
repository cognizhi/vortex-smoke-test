/**
 * Validation schemas for admin profile / avatar upload (PROJ-42).
 *
 * The same size/type rules are enforced client-side (UX, fail fast) and
 * server-side (security) — this module is the single source of truth for both.
 */
import { z } from 'zod';

/** Maximum avatar file size: 5MB. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Avatar MIME types accepted by the uploader. */
export const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png'] as const;
export type AllowedAvatarMime = (typeof ALLOWED_AVATAR_MIME)[number];

/**
 * Validates the metadata of an avatar upload. The file bytes themselves are
 * handled by the storage layer; here we only gate type and size.
 */
export const avatarUploadSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png']),
  sizeBytes: z.number().int().positive().max(MAX_AVATAR_BYTES),
});

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

const MIME_TO_EXT: Record<AllowedAvatarMime, 'jpg' | 'png'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/** Map a validated avatar MIME type to its stored file extension. */
export function extensionForMime(mime: AllowedAvatarMime): 'jpg' | 'png' {
  return MIME_TO_EXT[mime];
}
