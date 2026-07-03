/**
 * POST /api/admin/bookings/[id]/cancel
 *
 * Admin-initiated cancellation of a booking.
 *
 * Request body: (empty body accepted)
 *
 * Response:
 *   200 { data: { booking }, error: null }
 *   404 Booking not found
 *   409 Booking already cancelled
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { sendCancellationToCustomer, sendCancellationAlertToMerchant } from '@/lib/email/email-service';
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

  // Fetch booking (extra fields for email)
  const bookingRows = await db
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      confirmationNumber: schema.bookings.confirmationNumber,
      startTime: schema.bookings.startTime,
      endTime: schema.bookings.endTime,
      customerId: schema.bookings.customerId,
      staffId: schema.bookings.staffId,
      serviceId: schema.bookings.serviceId,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  if (bookingRows.length === 0) {
    return apiError('NOT_FOUND', 'Booking not found.', 404);
  }

  const booking = bookingRows[0];

  if (booking.status !== 'confirmed') {
    return apiError(
      'ALREADY_CANCELLED',
      'This booking has already been cancelled or rescheduled.',
      409
    );
  }

  const [updated] = await db
    .update(schema.bookings)
    .set({
      status: 'cancelled_admin',
      cancelledAt: new Date(),
    })
    .where(eq(schema.bookings.id, id))
    .returning();

  // Fire-and-forget: send cancellation emails
  void (async () => {
    try {
      const [customerRows, staffRows, serviceRows, merchantRow] = await Promise.all([
        db.select({ firstName: schema.customers.firstName, email: schema.customers.email })
          .from(schema.customers)
          .where(eq(schema.customers.id, booking.customerId)),
        db.select({ name: schema.staff.name })
          .from(schema.staff)
          .where(eq(schema.staff.id, booking.staffId)),
        db.select({ name: schema.services.name })
          .from(schema.services)
          .where(eq(schema.services.id, booking.serviceId)),
        platformDb.query.merchants.findFirst({
          where: eq(merchants.slug, ctx.slug),
          columns: { businessName: true, ownerEmail: true },
        }),
      ]);

      if (!customerRows[0] || !merchantRow) return;

      const sharedData = {
        customer: customerRows[0],
        booking: {
          confirmationNumber: booking.confirmationNumber,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
        staff: { name: staffRows[0]?.name ?? 'Staff' },
        service: { name: serviceRows[0]?.name ?? 'Service' },
        cancelledBy: 'admin' as const,
      };

      await Promise.allSettled([
        sendCancellationToCustomer({ ...sharedData, merchant: { businessName: merchantRow.businessName } }),
        sendCancellationAlertToMerchant({ ...sharedData, merchant: merchantRow }),
      ]);
    } catch (err) {
      console.error('[admin/bookings/cancel] Email dispatch error:', err);
    }
  })();

  return apiSuccess({ booking: updated });
}
