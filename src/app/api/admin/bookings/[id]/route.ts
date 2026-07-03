/**
 * GET   /api/admin/bookings/[id]  — get single booking detail
 * PATCH /api/admin/bookings/[id]  — update merchant notes
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { patchBookingSchema } from '@/lib/validations/booking';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;
  const { id } = await params;

  const rows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  if (rows.length === 0) {
    return apiError('NOT_FOUND', 'Booking not found.', 404);
  }

  const booking = rows[0];

  // Load related records for detail view
  const [customerRows, staffRows, serviceRows] = await Promise.all([
    db
      .select({ id: schema.customers.id, firstName: schema.customers.firstName, email: schema.customers.email, contactNumber: schema.customers.contactNumber })
      .from(schema.customers)
      .where(eq(schema.customers.id, booking.customerId)),
    db
      .select({ id: schema.staff.id, name: schema.staff.name })
      .from(schema.staff)
      .where(eq(schema.staff.id, booking.staffId)),
    db
      .select({ id: schema.services.id, name: schema.services.name, durationMinutes: schema.services.durationMinutes, priceCents: schema.services.priceCents })
      .from(schema.services)
      .where(eq(schema.services.id, booking.serviceId)),
  ]);

  return apiSuccess({
    booking: {
      ...booking,
      customer: customerRows[0] ?? null,
      staff: staffRows[0] ?? null,
      service: serviceRows[0] ?? null,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = patchBookingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  // Verify booking exists
  const existing = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  if (existing.length === 0) {
    return apiError('NOT_FOUND', 'Booking not found.', 404);
  }

  // Apply patch (currently only merchantNotes is patchable)
  // The schema doesn't have a merchantNotes column yet; this is a no-op that
  // returns the booking as-is and documents the extension point.
  // TODO: add merchantNotes column in a schema migration.

  const rows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  return apiSuccess({ booking: rows[0] });
}
