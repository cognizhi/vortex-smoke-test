/**
 * GET /api/admin/settings  — get merchant settings
 * PUT /api/admin/settings  — update merchant settings
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { updateSettingsSchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const rows = await db.select().from(schema.merchantSettings).limit(1);
  const settings = rows[0] ?? null;

  if (!settings) {
    return apiError('NOT_FOUND', 'Settings not found. Re-provision this merchant.', 404);
  }

  return apiSuccess({ settings });
}

export async function PUT(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const rows = await db.select({ id: schema.merchantSettings.id }).from(schema.merchantSettings).limit(1);
  const settingsId = rows[0]?.id;

  if (!settingsId) {
    return apiError('NOT_FOUND', 'Settings not found. Re-provision this merchant.', 404);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.slotDurationMinutes !== undefined)
    updates.slotDurationMinutes = parsed.data.slotDurationMinutes;
  if (parsed.data.bookingExpiryMinutes !== undefined)
    updates.bookingExpiryMinutes = parsed.data.bookingExpiryMinutes;
  if (parsed.data.displayLanguage !== undefined)
    updates.displayLanguage = parsed.data.displayLanguage;

  if (Object.keys(updates).length === 0) {
    return apiError('INVALID_INPUT', 'No fields to update.', 400);
  }

  const [updated] = await db
    .update(schema.merchantSettings)
    .set(updates)
    .where(eq(schema.merchantSettings.id, settingsId))
    .returning();

  return apiSuccess({ settings: updated });
}
