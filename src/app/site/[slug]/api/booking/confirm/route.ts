/**
 * POST /site/[slug]/api/booking/confirm
 *
 * Merchant-scoped proxy that the middleware rewrites into. Delegates to the
 * shared booking creation logic, injecting the slug from URL params.
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

function formatConfirmationNumber(seq: number): string {
  return `BK-${String(seq).padStart(4, '0')}`;
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  // Inject slug from URL params so the schema validates correctly
  const bodyWithSlug = { ...(body as Record<string, unknown>), slug };
  const parsed = confirmBookingSchema.safeParse(bodyWithSlug);
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

  const { staffId, serviceId, startTime: startTimeStr, firstName, email, contactNumber } =
    parsed.data;

  let merchant:
    | { id: string; schemaName: string; status: string; businessName: string; ownerEmail: string }
    | undefined;
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

  if (startTime <= new Date()) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: 'Booking start time must be in the future.' } },
      { status: 400 }
    );
  }

  // Read merchant settings to apply configurable booking expiry window.
  // bookingExpiryMinutes defines the minimum lead time required before the appointment start.
  const settingsRowsEarly = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .select({ bookingExpiryMinutes: schema.merchantSettings.bookingExpiryMinutes })
    .from(schema.merchantSettings);
  const bookingExpiryMinutes = settingsRowsEarly[0]?.bookingExpiryMinutes ?? 15;
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

  const available = await isSlotAvailable({ staffId, startTime, endTime, db, schema });
  if (!available) {
    return NextResponse.json(
      { data: null, error: { code: 'SLOT_TAKEN', message: 'This slot was just booked. Please choose another time.' } },
      { status: 409 }
    );
  }

  const existingCustomer = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(eq(schema.customers.email, email));

  let customerId: string;
  if (existingCustomer.length > 0) {
    customerId = existingCustomer[0].id;
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

  const cancelToken = crypto.randomUUID();
  let seqValue = 1000;
  try {
    const result = await (db as unknown as { execute: (sql: string) => Promise<{ rows: Array<{ nextval: string }> }> })
      .execute(`SELECT nextval('"${merchant.schemaName}"."booking_number_seq"') AS nextval`);
    seqValue = parseInt(String(result.rows[0]?.nextval ?? 1000), 10);
  } catch {
    seqValue = 1000 + Math.floor(Math.random() * 9000);
  }
  const confirmationNumber = formatConfirmationNumber(seqValue);

  const [booking] = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .insert(schema.bookings)
    .values({ customerId, staffId, serviceId, startTime, endTime, status: 'confirmed', cancelToken, confirmationNumber })
    .returning({ id: schema.bookings.id, confirmationNumber: schema.bookings.confirmationNumber, cancelToken: schema.bookings.cancelToken });

  // Compute expiry timestamp from merchant settings (not hardcoded)
  const expiresAt = new Date(Date.now() + bookingExpiryMinutes * 60 * 1000).toISOString();

  const response = NextResponse.json(
    { data: { bookingId: booking.id, confirmationNumber: booking.confirmationNumber, cancelToken: booking.cancelToken, expiresAt }, error: null },
    { status: 201 }
  );

  void (async () => {
    try {
      const staffRows = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
        .select({ name: schema.staff.name })
        .from(schema.staff)
        .where(eq(schema.staff.id, staffId));
      const staffName = staffRows[0]?.name ?? 'Your staff member';
      const cancelUrl = buildCancelUrl(slug, booking.cancelToken);
      const bookingForEmail = { confirmationNumber: booking.confirmationNumber, startTime, endTime };
      const merchantForEmail = { businessName: merchant!.businessName, slug, ownerEmail: merchant!.ownerEmail };

      await Promise.allSettled([
        sendBookingConfirmation({
          customer: { firstName, email },
          booking: bookingForEmail,
          staff: { name: staffName },
          service: { name: service.name, durationMinutes: service.durationMinutes, priceCents: service.priceCents ?? null },
          merchant: merchantForEmail,
          cancelUrl,
        }),
        sendNewBookingAlert({
          customer: { firstName, email, contactNumber },
          booking: bookingForEmail,
          staff: { name: staffName },
          service: { name: service.name },
          merchant: merchantForEmail,
        }),
      ]);
    } catch (err) {
      console.error('[site/slug/api/booking/confirm] Email dispatch error:', err);
    }
  })();

  return response;
}
