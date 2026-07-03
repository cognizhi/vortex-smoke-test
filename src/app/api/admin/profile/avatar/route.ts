/**
 * POST /api/admin/profile/avatar — upload (replace) the signed-in admin's avatar.
 *
 * Flow: validate (mirrors client rules) → store via photo-storage → persist the
 * URL on `admin_users.avatar_url` → best-effort delete of the previous file.
 * The user id always comes from the session cookie, never the request body.
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { avatarUploadSchema } from '@/lib/validations/profile';
import { savePhoto, deletePhoto, PhotoStorageError } from '@/lib/storage/photo-storage';

export async function POST(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema, session } = ctx;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError('INVALID_INPUT', 'Expected multipart form data.', 400);
  }

  // Narrow FormDataEntryValue (File | string | null). Avoid `instanceof File`
  // because the runtime File (undici) and the test/global File can differ.
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return apiError('INVALID_INPUT', 'No file provided.', 400);
  }

  // Server-side validation mirrors the client rules (type + size).
  const parsed = avatarUploadSchema.safeParse({ mimeType: file.type, sizeBytes: file.size });
  if (!parsed.success) {
    return apiError('INVALID_INPUT', 'Only JPEG and PNG files up to 5MB are supported.', 400);
  }

  // Capture the current avatar so we can remove it after a successful replace.
  let previousUrl: string | null = null;
  try {
    const [row] = await db
      .select({ avatarUrl: schema.adminUsers.avatarUrl })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.role, 'owner'));
    previousUrl = row?.avatarUrl ?? null;
  } catch {
    previousUrl = null;
  }

  let avatarUrl: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    avatarUrl = await savePhoto({ buffer, mimeType: file.type, userId: session.userId });
  } catch (err) {
    if (err instanceof PhotoStorageError) {
      return apiError('UPLOAD_FAILED', 'Upload failed. Please try again.', 500);
    }
    return apiError('INTERNAL', 'Unexpected error during upload.', 500);
  }

  try {
    await db
      .update(schema.adminUsers)
      .set({ avatarUrl })
      .where(eq(schema.adminUsers.role, 'owner'));
  } catch {
    // The file was written but never referenced — clean it up so it doesn't leak.
    await deletePhoto(avatarUrl);
    return apiError('UPLOAD_FAILED', 'Upload failed. Please try again.', 500);
  }

  if (previousUrl && previousUrl !== avatarUrl) {
    await deletePhoto(previousUrl);
  }

  return apiSuccess({ avatarUrl });
}
