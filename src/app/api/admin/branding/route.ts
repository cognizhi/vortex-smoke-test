/**
 * GET /api/admin/branding — retrieve merchant branding settings
 * POST /api/admin/branding — upsert merchant branding settings with FormData (file upload)
 *
 * Accepts FormData with optional fields:
 * - siteName: string (optional, trimmed)
 * - avatar: File (optional, image file up to 5MB)
 *
 * Supports partial updates:
 * - { siteName: "..." } — update only site name
 * - { avatar: File } — update only avatar URL
 * - { siteName: "...", avatar: File } — update both
 *
 * File validation:
 * - Type: JPEG, PNG, SVG, or WebP only
 * - Size: Maximum 5MB
 *
 * Uses conditional field building to ensure partial updates work correctly
 * and undefined values are never sent to Drizzle ORM.
 */

import { NextRequest } from 'next/server';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { avatarUploadSchema } from '@/lib/validations/profile';
import { upsertBranding, getBranding } from '@/lib/db/branding-queries';
import { savePhoto, deletePhoto, PhotoStorageError } from '@/lib/storage/photo-storage';

/**
 * GET /api/admin/branding — retrieve current branding
 */
export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const branding = await getBranding(db, schema);

  if (!branding) {
    return apiError('NOT_FOUND', 'Branding not found.', 404);
  }

  return apiSuccess({ branding });
}

/**
 * POST /api/admin/branding — upsert branding settings with FormData file upload
 *
 * Accepts FormData with optional siteName and avatar file.
 * At least one field must be provided.
 *
 * Flow:
 * 1. Authenticate via admin guard
 * 2. Parse FormData from request
 * 3. Extract and validate siteName and avatar fields
 * 4. Validate file (if provided) using avatarUploadSchema
 * 5. Save file to storage (if valid)
 * 6. Clean up old avatar (if new avatar provided and differs from old)
 * 7. Update database with conditional fields
 * 8. Return success response with updated branding
 *
 * Error handling:
 * - 400: Invalid FormData, no fields provided, or invalid file
 * - 500: Storage failure or database failure
 */
export async function POST(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema, merchantId } = ctx;

  // Step 1: Parse FormData from request
  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    console.error('[POST /api/admin/branding] FormData parse error', err);
    return apiError('INVALID_FORM', 'Expected multipart form data', 400);
  }

  // Step 2: Extract fields from FormData
  const siteNameRaw = form.get('siteName');
  const avatarFile = form.get('avatar');

  // Step 3: Parse and validate siteName
  let siteName: string | undefined;
  if (siteNameRaw && typeof siteNameRaw === 'string') {
    siteName = siteNameRaw.trim();
    if (siteName === '') siteName = undefined;
  }

  // Step 4: Validate that at least one field is provided
  if (!siteName && !avatarFile) {
    return apiError(
      'INVALID_INPUT',
      'At least one field (siteName or avatar) must be provided',
      400
    );
  }

  // Step 5: Process file upload if provided
  let avatarUrl: string | undefined;

  if (avatarFile instanceof File) {
    // Validate file type and size
    const validated = avatarUploadSchema.safeParse({
      mimeType: avatarFile.type,
      sizeBytes: avatarFile.size,
    });

    if (!validated.success) {
      console.error('[POST /api/admin/branding] File validation failed', avatarFile.type, avatarFile.size);
      return apiError(
        'INVALID_INPUT',
        'Only JPEG and PNG files up to 5MB are supported.',
        400
      );
    }

    // Convert File to Buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await avatarFile.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err) {
      console.error('[POST /api/admin/branding] File read error', err);
      return apiError('INVALID_INPUT', 'Failed to read uploaded file', 400);
    }

    // Save photo to storage
    try {
      avatarUrl = await savePhoto({
        buffer,
        mimeType: avatarFile.type,
        userId: merchantId,
      });
    } catch (err) {
      if (err instanceof PhotoStorageError) {
        console.error('[POST /api/admin/branding] Storage error:', err.message);
        return apiError(
          'INTERNAL',
          'Avatar upload failed. Please try again.',
          500
        );
      }
      console.error('[POST /api/admin/branding] Unexpected storage error', err);
      return apiError('INTERNAL', 'Avatar upload failed. Please try again.', 500);
    }
  }

  // Step 6: Update database with conditional fields
  try {
    // Get current branding to retrieve old avatar URL for cleanup
    const currentBranding = await getBranding(db, schema);

    // Upsert branding with conditional fields
    const branding = await upsertBranding(db, schema, siteName, avatarUrl);

    // Step 7: Clean up old avatar if new avatar uploaded and differs
    if (
      avatarUrl &&
      currentBranding?.avatarUrl &&
      currentBranding.avatarUrl !== avatarUrl
    ) {
      try {
        await deletePhoto(currentBranding.avatarUrl);
      } catch (err) {
        console.warn('[POST /api/admin/branding] Failed to cleanup old avatar', err);
        // Don't fail the request; orphaned files are acceptable
      }
    }

    return apiSuccess({ branding });
  } catch (err) {
    console.error('[POST /api/admin/branding] Database error', err);
    return apiError('INTERNAL', 'Database error.', 500);
  }
}
