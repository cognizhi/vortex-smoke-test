/**
 * POST /api/booking/confirm
 *
 * Creates a new booking (guest checkout — no auth required).
 *
 * Steps:
 *   1. Validate input (Zod)
 *   2. Resolve merchant by slug
 *   3. Fetch service (validate exists + enabled, derive endTime)
 *   4. Optimistic slot availability check (maxConcurrent-aware)
 *   5. Upsert customer record (by email within merchant schema)
 *   6. Generate cancelToken (UUID) and confirmationNumber (BK-XXXX)
 *   7. Insert booking
 *   8. Send transactional emails (fire-and-forget; never blocks the response)
 *   9. Return booking reference
 *
 * Request body (JSON):
 *   { staffId, serviceId, startTime, firstName, email, contactNumber, slug }
 *
 * Response:
 *   201 { data: { bookingId, confirmationNumber, cancelToken }, error: null }
 *   400 Validation error
 *   404 Merchant / staff / service not found
 *   409 Slot taken (concurrent booking)
 *   500 Internal error
 */
import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { confirmBookingSchema } from '@/lib/validations/booking';
import { isSlotAvailable } from '@/lib/slots';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { env } from '@/lib/env';
import { sendBookingConfirmation, sendNewBookingAlert } from '@/lib/email/email-service';
import { buildCancelUrl } from '@/lib/booking/cancel-token';

let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
  return _pool;
}

/** Generate a human-readable confirmation number from a sequence value. */
function formatConfirmationNumber(seq: number): string {
  return `BK-${String(seq).padStart(4, '0')}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse + validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = confirmBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.errors[0]?.message ?? 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const { staffId, serviceId, startTime: startTimeStr, firstName, email, contactNumber, slug } =
    parsed.data;

  // 2. Resolve merchant (fetch extra fields for email notifications)
  let merchant: { id: string; schemaName: string; status: string; businessName: string; ownerEmail: string } | undefined;
  try {
    merchant = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, slug),
      columns: { id: true, schemaName: true, status: true, businessName: true, ownerEmail: true },
    });
  } catch {
    merchant = undefined;
  }

  if (!merchant || merchant.status !== 'active') {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Merchant not found.' } },
      { status: 404 }
    );
  }

  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });

  // 3. Fetch service to derive endTime (also fetch name for email)
  const serviceRows = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .select({
      id: schema.services.id,
      name: schema.services.name,
      durationMinutes: schema.services.durationMinutes,
      priceCents: schema.services.priceCents,
      isEnabled: schema.services.isEnabled,
    })
    .from(schema.services)
    .where(eq(schema.services.id, serviceId));

  if (serviceRows.length === 0 || !serviceRows[0].isEnabled) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Service not found or disabled.' } },
      { status: 404 }
    );
  }

  const service = serviceRows[0];
  const startTime = new Date(startTimeStr);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

  // Validate startTime is in the future (basic sanity check)
  if (startTime <= new Date()) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: 'Booking start time must be in the future.' } },
      { status: 400 }
    );
  }

  // Read merchant settings to apply configurable booking expiry window.
  // bookingExpiryMinutes defines the minimum lead time (in minutes) required before
  // the appointment start — e.g. 15 means customers cannot book a slot that starts
  // within the next 15 minutes (giving the system time to process and notify).
  const settingsRows = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .select({ bookingExpiryMinutes: schema.merchantSettings.bookingExpiryMinutes })
    .from(schema.merchantSettings);
  const bookingExpiryMinutes = settingsRows[0]?.bookingExpiryMinutes ?? 15;
  const minimumStartTime = new Date(Date.now() + bookingExpiryMinutes * 60 * 1000);
  if (startTime < minimumStartTime) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'TOO_SOON',
          message: `Bookings must be made at least ${bookingExpiryMinutes} minutes in advance.`,
        },
      },
      { status: 400 }
    );
  }

  // 4. Optimistic availability check (maxConcurrent-aware)
  const available = await isSlotAvailable({ staffId, startTime, endTime, db, schema });
  if (!available) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'SLOT_TAKEN',
          message: 'This slot was just booked. Please choose another time.',
        },
      },
      { status: 409 }
    );
  }

  // 5. Upsert customer (insert or return existing by email)
  const existingCustomer = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(eq(schema.customers.email, email));

  let customerId: string;
  if (existingCustomer.length > 0) {
    customerId = existingCustomer[0].id;
    // Update first name and contact number in case they changed
    await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
      .update(schema.customers)
      .set({ firstName, contactNumber })
      .where(eq(schema.customers.id, customerId));
  } else {
    const [newCustomer] = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
      .insert(schema.customers)
      .values({ email, firstName, contactNumber })
      .returning({ id: schema.customers.id });
    customerId = newCustomer.id;
  }

  // 6. Generate cancelToken and confirmationNumber
  const cancelToken = crypto.randomUUID();

  // Get next sequence value for confirmation number
  let seqValue = 1000;
  try {
    const result = await (db as unknown as { execute: (sql: string) => Promise<{ rows: Array<{ nextval: string }> }> })
      .execute(`SELECT nextval('"${merchant.schemaName}"."booking_number_seq"') AS nextval`);
    seqValue = parseInt(String(result.rows[0]?.nextval ?? 1000), 10);
  } catch {
    // Fallback to a random 4-digit number if sequence unavailable
    seqValue = 1000 + Math.floor(Math.random() * 9000);
  }
  const confirmationNumber = formatConfirmationNumber(seqValue);

  // 7. Insert booking
  const [booking] = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .insert(schema.bookings)
    .values({
      customerId,
      staffId,
      serviceId,
      startTime,
      endTime,
      status: 'confirmed',
      cancelToken,
      confirmationNumber,
    })
    .returning({
      id: schema.bookings.id,
      confirmationNumber: schema.bookings.confirmationNumber,
      cancelToken: schema.bookings.cancelToken,
    });

  // Compute expiry timestamp from merchant settings (not hardcoded)
  const expiresAt = new Date(Date.now() + bookingExpiryMinutes * 60 * 1000).toISOString();

  // Build response immediately — emails are fired in the background
  const response = NextResponse.json(
    {
      data: {
        bookingId: booking.id,
        confirmationNumber: booking.confirmationNumber,
        cancelToken: booking.cancelToken,
        expiresAt,
      },
      error: null,
    },
    { status: 201 }
  );

  // 8. Send transactional emails (fire-and-forget — never blocks the response)
  void (async () => {
    try {
      // Fetch staff name for email
      const staffRows = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
        .select({ name: schema.staff.name })
        .from(schema.staff)
        .where(eq(schema.staff.id, staffId));
      const staffName = staffRows[0]?.name ?? 'Your staff member';

      const cancelUrl = buildCancelUrl(slug, booking.cancelToken);
      const bookingForEmail = {
        confirmationNumber: booking.confirmationNumber,
        startTime,
        endTime,
      };
      const customerForEmail = { firstName, email };
      const serviceForEmail = {
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents ?? null,
      };
      const staffForEmail = { name: staffName };
      const merchantForEmail = {
        businessName: merchant!.businessName,
        slug,
        ownerEmail: merchant!.ownerEmail,
      };

      await Promise.allSettled([
        sendBookingConfirmation({
          customer: customerForEmail,
          booking: bookingForEmail,
          staff: staffForEmail,
          service: serviceForEmail,
          merchant: merchantForEmail,
          cancelUrl,
        }),
        sendNewBookingAlert({
          customer: { firstName, email, contactNumber },
          booking: bookingForEmail,
          staff: staffForEmail,
          service: serviceForEmail,
          merchant: merchantForEmail,
        }),
      ]);
    } catch (err) {
      console.error('[booking/confirm] Email dispatch error:', err);
    }
  })();

  return response;
}
