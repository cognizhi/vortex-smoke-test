/**
 * GET  /site/[slug]/api/cancel/[token]
 * POST /site/[slug]/api/cancel/[token]
 *
 * Merchant-scoped cancel endpoints. The middleware rewrites requests from
 * {slug}.platform.com/api/cancel/{token} here. The slug comes from URL params.
 *
 * NOTE: This route is the one actually hit by customers on {slug}.platform.com —
 * middleware rewrites the path here before it reaches /api/cancel/[token].
 * Both routes must stay in sync with regard to email dispatch.
 *
 * TODO: Consolidate this route with /api/cancel/[token]/route.ts to avoid
 * the duplication. See: src/app/api/cancel/[token]/route.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { Pool } from 'pg';

import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { env } from '@/lib/env';
import { sendCancellationToCustomer, sendCancellationAlertToMerchant } from '@/lib/email/email-service';

let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
  return _pool;
}

interface RouteParams {
  params: Promise<{ slug: string; token: string }>;
}

async function resolveBooking(slug: string, token: string) {
  let merchant: { schemaName: string; status: string; businessName: string; ownerEmail: string } | undefined;
  try {
    merchant = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, slug),
      columns: { schemaName: true, status: true, businessName: true, ownerEmail: true },
    });
  } catch {
    merchant = undefined;
  }

  if (!merchant || merchant.status !== 'active') {
    return { error: 'NOT_FOUND' as const };
  }

  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });

  const bookingRows = await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      startTime: schema.bookings.startTime,
      endTime: schema.bookings.endTime,
      confirmationNumber: schema.bookings.confirmationNumber,
      cancelToken: schema.bookings.cancelToken,
      customerId: schema.bookings.customerId,
      staffId: schema.bookings.staffId,
      serviceId: schema.bookings.serviceId,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.cancelToken, token));

  if (bookingRows.length === 0) {
    return { error: 'NOT_FOUND' as const };
  }

  return {
    booking: bookingRows[0],
    schema,
    db,
    merchantInfo: { businessName: merchant.businessName, ownerEmail: merchant.ownerEmail },
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { slug, token } = await params;

  const result = await resolveBooking(slug, token);
  if ('error' in result) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Cancel link not found or invalid.' } },
      { status: 404 }
    );
  }

  const { booking } = result;

  if (booking.status !== 'confirmed') {
    return NextResponse.json(
      { data: null, error: { code: 'ALREADY_CANCELLED', message: 'This booking has already been cancelled.' } },
      { status: 409 }
    );
  }

  const isExpired = new Date() >= booking.startTime;

  return NextResponse.json(
    {
      data: {
        booking: {
          id: booking.id,
          confirmationNumber: booking.confirmationNumber,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          status: booking.status,
        },
        isExpired,
      },
      error: null,
    },
    { status: 200 }
  );
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { slug, token } = await params;

  const result = await resolveBooking(slug, token);
  if ('error' in result) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Cancel link not found or invalid.' } },
      { status: 404 }
    );
  }

  const { booking, schema, db } = result;

  if (booking.status !== 'confirmed') {
    return NextResponse.json(
      { data: null, error: { code: 'ALREADY_CANCELLED', message: 'This booking has already been cancelled.' } },
      { status: 409 }
    );
  }

  const now = new Date();
  if (now >= booking.startTime) {
    return NextResponse.json(
      { data: null, error: { code: 'EXPIRED', message: 'This cancel link has expired — the appointment time has passed.' } },
      { status: 410 }
    );
  }

  await (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
    .update(schema.bookings)
    .set({ status: 'cancelled_customer', cancelledAt: now })
    .where(and(eq(schema.bookings.cancelToken, token), eq(schema.bookings.status, 'confirmed')));

  // Build response immediately, then fire emails in the background.
  // Mirrors the email dispatch in /api/cancel/[token]/route.ts (global route).
  const response = NextResponse.json(
    { data: { success: true, confirmationNumber: booking.confirmationNumber }, error: null },
    { status: 200 }
  );

  // Fire-and-forget: send cancellation emails to customer and merchant
  void (async () => {
    try {
      const [customerRows, staffRows, serviceRows] = await Promise.all([
        (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
          .select({ firstName: schema.customers.firstName, email: schema.customers.email })
          .from(schema.customers)
          .where(eq(schema.customers.id, booking.customerId)),
        (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
          .select({ name: schema.staff.name })
          .from(schema.staff)
          .where(eq(schema.staff.id, booking.staffId)),
        (db as ReturnType<typeof drizzle<ReturnType<typeof createMerchantSchema>>>)
          .select({ name: schema.services.name })
          .from(schema.services)
          .where(eq(schema.services.id, booking.serviceId)),
      ]);

      if (!customerRows[0]) return;

      const sharedData = {
        customer: customerRows[0],
        booking: {
          confirmationNumber: booking.confirmationNumber,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
        staff: { name: staffRows[0]?.name ?? 'Staff' },
        service: { name: serviceRows[0]?.name ?? 'Service' },
        cancelledBy: 'customer' as const,
      };

      await Promise.allSettled([
        sendCancellationToCustomer({
          customer: sharedData.customer,
          booking: sharedData.booking,
          staff: sharedData.staff,
          service: sharedData.service,
          merchant: result.merchantInfo,
          cancelledBy: sharedData.cancelledBy,
        }),
        sendCancellationAlertToMerchant({
          customer: sharedData.customer,
          booking: sharedData.booking,
          staff: sharedData.staff,
          service: sharedData.service,
          merchant: result.merchantInfo,
          cancelledBy: sharedData.cancelledBy,
        }),
      ]);
    } catch (err) {
      console.error('[site/slug/cancel/token] Email dispatch error:', err);
    }
  })();

  return response;
}
