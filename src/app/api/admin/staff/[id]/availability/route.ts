/**
 * GET /api/admin/staff/:id/availability  — get weekly availability schedule
 * PUT /api/admin/staff/:id/availability  — replace the full availability schedule
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { setAvailabilitySchema } from '@/lib/validations/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [staff] = await db
    .select({ id: schema.staff.id })
    .from(schema.staff)
    .where(eq(schema.staff.id, id));
  if (!staff) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  const availability = await db
    .select()
    .from(schema.staffAvailability)
    .where(eq(schema.staffAvailability.staffId, id))
    .orderBy(schema.staffAvailability.dayOfWeek);

  return apiSuccess({ availability });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [staff] = await db
    .select({ id: schema.staff.id })
    .from(schema.staff)
    .where(eq(schema.staff.id, id));
  if (!staff) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = setAvailabilitySchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  // Validate start < end for each enabled day
  for (const day of parsed.data.availability) {
    if (day.enabled && day.startTime >= day.endTime) {
      return apiError(
        'INVALID_INPUT',
        `startTime must be before endTime for day ${day.dayOfWeek}`,
        400
      );
    }
  }

  // Replace all availability rows for this staff member atomically
  await db.delete(schema.staffAvailability).where(eq(schema.staffAvailability.staffId, id));

  const enabled = parsed.data.availability.filter((d) => d.enabled);
  let inserted: typeof schema.staffAvailability.$inferSelect[] = [];

  if (enabled.length > 0) {
    inserted = await db
      .insert(schema.staffAvailability)
      .values(
        enabled.map((d) => ({
          staffId: id,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          maxConcurrent: d.maxConcurrent ?? 1,
        }))
      )
      .returning();
  }

  return apiSuccess({ availability: inserted });
}
