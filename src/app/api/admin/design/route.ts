/**
 * GET /api/admin/design  — get merchant design settings
 * PUT /api/admin/design  — update merchant design settings
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { updateDesignSchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const rows = await db.select().from(schema.merchantDesign).limit(1);
  const design = rows[0] ?? null;

  if (!design) {
    return apiError('NOT_FOUND', 'Design settings not found. Re-provision this merchant.', 404);
  }

  return apiSuccess({ design });
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

  const parsed = updateDesignSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const rows = await db.select({ id: schema.merchantDesign.id }).from(schema.merchantDesign).limit(1);
  const designId = rows[0]?.id;

  if (!designId) {
    return apiError('NOT_FOUND', 'Design settings not found. Re-provision this merchant.', 404);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const d = parsed.data;
  if (d.pageHeadline !== undefined) updates.pageHeadline = d.pageHeadline;
  if (d.pageSubheadline !== undefined) updates.pageSubheadline = d.pageSubheadline;
  if (d.slotAvailableBg !== undefined) updates.slotAvailableBg = d.slotAvailableBg;
  if (d.slotAvailableText !== undefined) updates.slotAvailableText = d.slotAvailableText;
  if (d.slotUnavailableBg !== undefined) updates.slotUnavailableBg = d.slotUnavailableBg;
  if (d.slotUnavailableText !== undefined) updates.slotUnavailableText = d.slotUnavailableText;
  if (d.calendarBorderWidth !== undefined) updates.calendarBorderWidth = d.calendarBorderWidth;
  if (d.calendarBorderColor !== undefined) updates.calendarBorderColor = d.calendarBorderColor;
  if (d.calendarBorderRadius !== undefined) updates.calendarBorderRadius = d.calendarBorderRadius;
  if (d.calendarFontSize !== undefined) updates.calendarFontSize = d.calendarFontSize;

  const [updated] = await db
    .update(schema.merchantDesign)
    .set(updates)
    .where(eq(schema.merchantDesign.id, designId))
    .returning();

  return apiSuccess({ design: updated });
}
