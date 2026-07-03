/**
 * GET    /api/admin/staff/:id  — get a single staff member
 * PUT    /api/admin/staff/:id  — update a staff member
 * DELETE /api/admin/staff/:id  — soft-delete (if future bookings) or hard-delete
 */
import { NextRequest } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { updateStaffSchema } from '@/lib/validations/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;
  const [staff] = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.id, id));

  if (!staff) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  const availability = await db
    .select()
    .from(schema.staffAvailability)
    .where(eq(schema.staffAvailability.staffId, id));

  return apiSuccess({ staff: { ...staff, availability } });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  // Check staff exists
  const [existing] = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.id, id));
  if (!existing) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.contactNumber !== undefined) updates.contactNumber = parsed.data.contactNumber ?? null;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email || null;
  if (parsed.data.isVisible !== undefined) updates.isVisible = parsed.data.isVisible;

  if (Object.keys(updates).length === 0) {
    return apiError('INVALID_INPUT', 'No fields to update.', 400);
  }

  const [updated] = await db
    .update(schema.staff)
    .set(updates)
    .where(eq(schema.staff.id, id))
    .returning();

  return apiSuccess({ staff: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [existing] = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.id, id));
  if (!existing) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  // Check for future confirmed bookings
  const now = new Date();
  const futureBookings = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.staffId, id),
        eq(schema.bookings.status, 'confirmed'),
        gt(schema.bookings.startTime, now)
      )
    )
    .limit(1);

  if (futureBookings.length > 0) {
    // Soft-delete: hide from booking page but retain data
    const [updated] = await db
      .update(schema.staff)
      .set({ isVisible: false })
      .where(eq(schema.staff.id, id))
      .returning();
    return apiSuccess({ staff: updated, softDeleted: true });
  }

  // Hard-delete: no future bookings
  await db.delete(schema.staff).where(eq(schema.staff.id, id));
  return apiSuccess({ deleted: true });
}
