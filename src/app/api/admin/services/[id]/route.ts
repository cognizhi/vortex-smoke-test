/**
 * GET    /api/admin/services/:id  — get a single service
 * PUT    /api/admin/services/:id  — update a service
 * DELETE /api/admin/services/:id  — delete (only if no future confirmed bookings)
 */
import { NextRequest } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { updateServiceSchema } from '@/lib/validations/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, id));

  if (!service) return apiError('NOT_FOUND', 'Service not found.', 404);
  return apiSuccess({ service });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [existing] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, id));
  if (!existing) return apiError('NOT_FOUND', 'Service not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = updateServiceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
  if (parsed.data.durationMinutes !== undefined) updates.durationMinutes = parsed.data.durationMinutes;
  if (parsed.data.priceCents !== undefined) updates.priceCents = parsed.data.priceCents ?? null;
  if (parsed.data.isEnabled !== undefined) updates.isEnabled = parsed.data.isEnabled;

  if (Object.keys(updates).length === 0) {
    return apiError('INVALID_INPUT', 'No fields to update.', 400);
  }

  const [updated] = await db
    .update(schema.services)
    .set(updates)
    .where(eq(schema.services.id, id))
    .returning();

  return apiSuccess({ service: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [existing] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, id));
  if (!existing) return apiError('NOT_FOUND', 'Service not found.', 404);

  // Block deletion if any future confirmed bookings reference this service
  const now = new Date();
  const futureBookings = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.serviceId, id),
        eq(schema.bookings.status, 'confirmed'),
        gt(schema.bookings.startTime, now)
      )
    )
    .limit(1);

  if (futureBookings.length > 0) {
    return apiError(
      'CONFLICT',
      'Service cannot be deleted while it has future confirmed bookings.',
      409
    );
  }

  await db.delete(schema.services).where(eq(schema.services.id, id));
  return apiSuccess({ deleted: true });
}
