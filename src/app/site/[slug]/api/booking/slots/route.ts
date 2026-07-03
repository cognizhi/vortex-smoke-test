/**
 * GET /site/[slug]/api/booking/slots
 *
 * Merchant-scoped proxy that the middleware rewrites into when a request from
 * {slug}.platform.com/api/booking/slots arrives. The slug is extracted from
 * the URL params (the middleware rewrite preserves it).
 *
 * Delegates all business logic to the shared slot engine.
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

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;

  const raw = {
    staffId: searchParams.get('staffId') ?? '',
    serviceId: searchParams.get('serviceId') ?? '',
    date: searchParams.get('date') ?? '',
    slug,
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

  const merchant = await platformDb.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
    columns: { schemaName: true, status: true },
  });

  if (!merchant || merchant.status !== 'active') {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Merchant not found.' } },
      { status: 404 }
    );
  }

  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });

  try {
    const slots = await getAvailableSlots({
      staffId: parsed.data.staffId,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      db,
      schema,
    });

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
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[site/slug/api/booking/slots] Error:', err);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Failed to compute slots.' } },
      { status: 500 }
    );
  }
}
