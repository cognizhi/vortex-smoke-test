/**
 * Customer booking cancellation page.
 *
 * Served at {slug}.platform.com/cancel/{token}
 * Middleware rewrites this to /site/{slug}/cancel/{token}
 *
 * This server component reads the cancel token from the URL, validates it
 * directly against the merchant's database, and renders the appropriate UI:
 *   - Valid:           booking details + confirm-cancel button
 *   - Expired:         "link has expired" message (appointment has passed)
 *   - Already cancelled: informational message
 *   - Not found:       404-style message
 */

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Check } from 'lucide-react';

import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { env } from '@/lib/env';
import CancelActions from './CancelActions';

let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return _pool;
}

interface PageParams {
  params: Promise<{ slug: string; token: string }>;
}

export default async function CancelPage({ params }: PageParams): Promise<React.JSX.Element> {
  const { slug, token } = await params;

  // 1. Resolve merchant
  const merchant = await platformDb.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
    columns: { schemaName: true, status: true, businessName: true },
  });

  if (!merchant || merchant.status !== 'active') {
    notFound();
  }

  // 2. Find booking by cancel token
  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });

  const bookingRows = await db
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      startTime: schema.bookings.startTime,
      endTime: schema.bookings.endTime,
      confirmationNumber: schema.bookings.confirmationNumber,
      staffId: schema.bookings.staffId,
      serviceId: schema.bookings.serviceId,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.cancelToken, token))
    .limit(1);

  const booking = bookingRows[0];

  // 3. Booking not found
  if (!booking) {
    return (
      <CancelLayout businessName={merchant.businessName}>
        <div className="text-center">
          <p className="mb-2 text-4xl">🔍</p>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Link not found</h2>
          <p className="text-sm text-slate-500">
            This cancel link is invalid or has already been used.
          </p>
          <BackLink slug={slug} businessName={merchant.businessName} />
        </div>
      </CancelLayout>
    );
  }

  // 4. Already cancelled
  if (booking.status !== 'confirmed') {
    return (
      <CancelLayout businessName={merchant.businessName}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Check className="h-6 w-6 text-slate-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Already cancelled</h2>
          <p className="text-sm text-slate-500">
            Booking {booking.confirmationNumber} has already been cancelled.
          </p>
          <BackLink slug={slug} businessName={merchant.businessName} />
        </div>
      </CancelLayout>
    );
  }

  // 5. Check expiry
  const now = new Date();
  const isExpired = now >= booking.startTime;

  if (isExpired) {
    return (
      <CancelLayout businessName={merchant.businessName}>
        <div className="text-center">
          <p className="mb-2 text-4xl">⏱</p>
          <h2 className="mb-2 text-xl font-bold text-slate-900">This link has expired</h2>
          <p className="mb-4 text-sm text-slate-500">
            This cancellation link is no longer valid because the appointment time has already
            passed.
          </p>
          <BookingDetailCard
            confirmationNumber={booking.confirmationNumber}
            startTime={booking.startTime}
            endTime={booking.endTime}
          />
          <BackLink slug={slug} businessName={merchant.businessName} />
        </div>
      </CancelLayout>
    );
  }

  // 6. Valid — show cancel confirmation UI
  return (
    <CancelLayout businessName={merchant.businessName}>
      <div>
        <h2 className="mb-1 text-xl font-bold text-slate-900">Cancel your booking</h2>
        <p className="mb-5 text-sm text-slate-500">
          Are you sure you want to cancel this appointment?
        </p>

        <BookingDetailCard
          confirmationNumber={booking.confirmationNumber}
          startTime={booking.startTime}
          endTime={booking.endTime}
        />

        {/* Cancel/keep buttons — client component for interactivity */}
        <CancelActions token={token} slug={slug} />

        <BackLink slug={slug} businessName={merchant.businessName} />
      </div>
    </CancelLayout>
  );
}

// ---------------------------------------------------------------------------
// Layout wrapper
// ---------------------------------------------------------------------------

function CancelLayout({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">{businessName}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-10">{children}</main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking detail card
// ---------------------------------------------------------------------------

function BookingDetailCard({
  confirmationNumber,
  startTime,
  endTime,
}: {
  confirmationNumber: string;
  startTime: Date;
  endTime: Date;
}): React.JSX.Element {
  const datePart = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Booking details
      </p>
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-slate-500">Reference</dt>
          <dd className="font-mono font-semibold text-slate-900">{confirmationNumber}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Date</dt>
          <dd className="text-slate-900">{datePart}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Time</dt>
          <dd className="text-slate-900">
            {startStr} – {endStr}
          </dd>
        </div>
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Back link
// ---------------------------------------------------------------------------

function BackLink({
  slug: _slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}): React.JSX.Element {
  return (
    <div className="mt-6 text-center">
      <a href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Return to {businessName} homepage
      </a>
    </div>
  );
}
