/**
 * POST /api/admin/bookings/[id]/reschedule
 *
 * Admin-initiated reschedule of an existing booking.
 *
 * Steps:
 *   1. Auth check (admin session)
 *   2. Verify booking exists and is in 'confirmed' status
 *   3. Fetch service duration for the new endTime
 *   4. Slot availability check for the new time (maxConcurrent-aware,
 *      excluding the booking being rescheduled from the conflict count)
 *   5. Update booking: new startTime, endTime; set rescheduledFromId to own id
 *      (documents the previous time), status stays 'confirmed'
 *
 * Request body:
 *   { startTime: ISO 8601, staffId?: UUID (optional reassign) }
 *
 * Response:
 *   200 { data: { booking }, error: null }
 *   400 Validation error
 *   404 Booking not found
 *   409 New slot is taken
 */
import { NextRequest } from 'next/server';
import { eq, and, lt, gt, ne } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { rescheduleBookingSchema } from '@/lib/validations/booking';
import { sendReschedulingNotification } from '@/lib/email/email-service';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;
  const { id } = await params;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = rescheduleBookingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const { startTime: newStartStr, staffId: newStaffId } = parsed.data;

  // Fetch existing booking
  const bookingRows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  if (bookingRows.length === 0) {
    return apiError('NOT_FOUND', 'Booking not found.', 404);
  }

  const booking = bookingRows[0];

  if (booking.status !== 'confirmed') {
    return apiError(
      'INVALID_STATE',
      'Only confirmed bookings can be rescheduled.',
      409
    );
  }

  // Determine the effective staffId (allow optional staff reassignment)
  const effectiveStaffId = newStaffId ?? booking.staffId;

  // Fetch service duration
  const serviceRows = await db
    .select({ durationMinutes: schema.services.durationMinutes })
    .from(schema.services)
    .where(eq(schema.services.id, booking.serviceId));

  if (serviceRows.length === 0) {
    return apiError('NOT_FOUND', 'Associated service not found.', 404);
  }

  const durationMinutes = serviceRows[0].durationMinutes;
  const newStart = new Date(newStartStr);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60 * 1000);

  // Validate new time is in the future
  if (newStart <= new Date()) {
    return apiError('INVALID_INPUT', 'New booking time must be in the future.', 400);
  }

  // Slot availability check — exclude THIS booking from the conflict count
  // (so rescheduling to the same slot is allowed)
  const availRows = await db
    .select({ maxConcurrent: schema.staffAvailability.maxConcurrent })
    .from(schema.staffAvailability)
    .where(
      and(
        eq(schema.staffAvailability.staffId, effectiveStaffId),
        eq(schema.staffAvailability.dayOfWeek, newStart.getUTCDay())
      )
    );

  const maxConcurrent = availRows[0]?.maxConcurrent ?? 1;

  // Count confirmed bookings overlapping the new slot, excluding this booking
  const overlapping = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.staffId, effectiveStaffId),
        eq(schema.bookings.status, 'confirmed'),
        ne(schema.bookings.id, id),
        lt(schema.bookings.startTime, newEnd),
        gt(schema.bookings.endTime, newStart)
      )
    );

  if (overlapping.length >= maxConcurrent) {
    return apiError(
      'SLOT_TAKEN',
      'The new time slot is not available. Please choose a different time.',
      409
    );
  }

  // Capture old start time before updating for the reschedule email
  const oldStartTime = booking.startTime;

  // Mark original booking as rescheduled (audit trail step 1).
  await db
    .update(schema.bookings)
    .set({ status: 'rescheduled' })
    .where(eq(schema.bookings.id, id));

  // Create the new confirmed booking that supersedes the original (audit trail step 2).
  // confirmationNumber keeps the same base ref with an -R suffix to preserve recognisability.
  const newConfirmationNumber = `${booking.confirmationNumber}-R`;
  const [updated] = await db
    .insert(schema.bookings)
    .values({
      customerId: booking.customerId,
      staffId: effectiveStaffId,
      serviceId: booking.serviceId,
      startTime: newStart,
      endTime: newEnd,
      status: 'confirmed',
      cancelToken: crypto.randomUUID(),
      confirmationNumber: newConfirmationNumber,
      rescheduledFromId: booking.id,
    })
    .returning();

  // Fire-and-forget: send reschedule notification to customer
  void (async () => {
    try {
      const [customerRows, staffRows, serviceRows, merchantRow] = await Promise.all([
        db.select({ firstName: schema.customers.firstName, email: schema.customers.email })
          .from(schema.customers)
          .where(eq(schema.customers.id, booking.customerId)),
        db.select({ name: schema.staff.name })
          .from(schema.staff)
          .where(eq(schema.staff.id, effectiveStaffId)),
        db.select({ name: schema.services.name })
          .from(schema.services)
          .where(eq(schema.services.id, booking.serviceId)),
        platformDb.query.merchants.findFirst({
          where: eq(merchants.slug, ctx.slug),
          columns: { businessName: true },
        }),
      ]);

      if (!customerRows[0]) return;

      await sendReschedulingNotification({
        customer: customerRows[0],
        booking: {
          confirmationNumber: booking.confirmationNumber,
          newStartTime: newStart,
          newEndTime: newEnd,
        },
        oldStartTime,
        staff: { name: staffRows[0]?.name ?? 'Staff' },
        service: { name: serviceRows[0]?.name ?? 'Service' },
        merchant: { businessName: merchantRow?.businessName ?? ctx.slug },
      });
    } catch (err) {
      console.error('[admin/bookings/reschedule] Email dispatch error:', err);
    }
  })();

  return apiSuccess({ booking: updated });
}
