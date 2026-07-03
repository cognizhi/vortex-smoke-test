/**
 * Customer-facing booking page — served at {slug}.platform.com/
 *
 * This is a Server Component that:
 *   1. Resolves the merchant from the platform DB using the slug in the URL
 *   2. Fetches visible staff, enabled services, and merchant design settings
 *   3. Renders the <BookingFlow> client component with all data pre-loaded
 *
 * Routing: the middleware rewrites {slug}.platform.com/* → /site/{slug}/* so
 * this file maps to the merchant's root booking page.
 */
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Metadata, ResolvingMetadata } from 'next';

import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { merchantBranding } from '@/lib/db/schema';
import * as brandingSchema from '@/lib/db/schema';
import { env } from '@/lib/env';
import BookingFlow from './BookingFlow';
import type { BookingFlowProps } from './BookingFlow';

// Constants for defaults
const DEFAULT_SITE_NAME = 'SimplyBook';
const DEFAULT_AVATAR_URL = '/logo.svg';

// Singleton pool for this module (Next.js module cache)
let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return _pool;
}

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageParams,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  // Resolve merchant
  const merchant = await platformDb.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
    columns: { id: true, businessName: true },
  });

  if (!merchant) {
    return { title: DEFAULT_SITE_NAME };
  }

  // Fetch branding
  const publicDb = drizzle(getPool(), { schema: brandingSchema });
  const branding = await publicDb.query.merchantBranding.findFirst({
    where: eq(merchantBranding.merchantId, merchant.id),
  });

  const siteName = branding?.siteName || DEFAULT_SITE_NAME;

  return {
    title: `${siteName} - Book Now`,
    description: 'Book your appointment online',
  };
}

export default async function BookingPage({ params }: PageParams): Promise<React.JSX.Element> {
  const { slug } = await params;

  // 1. Resolve merchant
  const merchant = await platformDb.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
    columns: { id: true, schemaName: true, status: true, businessName: true },
  });

  if (!merchant || merchant.status !== 'active') {
    notFound();
  }

  // 2. Fetch merchant data and branding
  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });
  const publicDb = drizzle(getPool(), { schema: brandingSchema });

  const [staffRows, serviceRows, designRows, brandingRow] = await Promise.all([
    db
      .select({
        id: schema.staff.id,
        name: schema.staff.name,
        photoUrl: schema.staff.photoUrl,
      })
      .from(schema.staff)
      .where(eq(schema.staff.isVisible, true))
      .orderBy(schema.staff.createdAt),

    db
      .select({
        id: schema.services.id,
        name: schema.services.name,
        description: schema.services.description,
        durationMinutes: schema.services.durationMinutes,
        priceCents: schema.services.priceCents,
      })
      .from(schema.services)
      .where(eq(schema.services.isEnabled, true))
      .orderBy(schema.services.createdAt),

    db
      .select({
        pageHeadline: schema.merchantDesign.pageHeadline,
        pageSubheadline: schema.merchantDesign.pageSubheadline,
        slotAvailableBg: schema.merchantDesign.slotAvailableBg,
        slotAvailableText: schema.merchantDesign.slotAvailableText,
        slotUnavailableBg: schema.merchantDesign.slotUnavailableBg,
        slotUnavailableText: schema.merchantDesign.slotUnavailableText,
      })
      .from(schema.merchantDesign)
      .limit(1),

    publicDb.query.merchantBranding.findFirst({
      where: eq(merchantBranding.merchantId, merchant.id),
    }),
  ]);

  const design = designRows[0] ?? {
    pageHeadline: null,
    pageSubheadline: null,
    slotAvailableBg: '#ECFDF5',
    slotAvailableText: '#065F46',
    slotUnavailableBg: '#F1F5F9',
    slotUnavailableText: '#475569',
  };

  const props: BookingFlowProps = {
    slug,
    businessName: merchant.businessName,
    customSiteName: brandingRow?.siteName ?? null,
    customAvatarUrl: brandingRow?.avatarUrl ?? null,
    staff: staffRows,
    services: serviceRows,
    design,
  };

  return <BookingFlow {...props} />;
}
