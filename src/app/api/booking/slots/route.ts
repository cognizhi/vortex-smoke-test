/**
 * GET /api/booking/slots
 *
 * Returns available time slots for a staff member + service on a given date.
 * Public endpoint — no auth required.
 *
 * Query params:
 *   staffId   — UUID
 *   serviceId — UUID
 *   date      — YYYY-MM-DD
 *   slug      — merchant subdomain (used to resolve merchant DB)
 *
 * Response:
 *   200 { data: { slots: Array<{ startTime: string; endTime: string }> }, error: null }
 *   400 { data: null, error: { code: "INVALID_INPUT", message } }
 *   404 { data: null, error: { code: "NOT_FOUND", message } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { slotsQuerySchema } from '@/lib/validations/booking';
import { getAvailableSlots } from '@/lib/slots';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { env } from '@/lib/env';

let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
  return _pool;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const raw = {
    staffId: searchParams.get('staffId') ?? '',
    serviceId: searchParams.get('serviceId') ?? '',
    date: searchParams.get('date') ?? '',
    slug: searchParams.get('slug') ?? '',
  };

  const parsed = slotsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.errors[0]?.message ?? 'Invalid query parameters',
        },
      },
      { status: 400 }
    );
  }

  const { staffId, serviceId, date, slug } = parsed.data;

  // Resolve merchant
  let merchant: { schemaName: string; status: string } | undefined;
  try {
    merchant = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, slug),
      columns: { schemaName: true, status: true },
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

  try {
    const slots = await getAvailableSlots({ staffId, serviceId, date, db, schema });

    return NextResponse.json(
      {
        data: {
          slots: slots.map((s) => ({
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
          })),
        },
        error: null,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    console.error('[booking/slots] Error computing slots:', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Failed to compute slots.' } },
      { status: 500 }
    );
  }
}
