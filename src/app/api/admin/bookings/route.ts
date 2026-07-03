/**
 * GET /api/admin/bookings
 *
 * Returns a list of bookings for the authenticated merchant.
 * Optional query params:
 *   ?status=confirmed|cancelled_customer|cancelled_admin|rescheduled
 *   ?date=YYYY-MM-DD   filter by booking start date
 *   ?staffId=UUID
 *
 * Response:
 *   200 { data: { bookings: [...] }, error: null }
 */
import { NextRequest } from 'next/server';
import { requireAdminAuth, apiSuccess } from '@/lib/auth/admin-guard';

const VALID_STATUSES = new Set([
  'confirmed',
  'cancelled_customer',
  'cancelled_admin',
  'rescheduled',
]);

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;
  const { searchParams } = request.nextUrl;

  const statusFilter = searchParams.get('status');
  const dateFilter = searchParams.get('date');
  const staffIdFilter = searchParams.get('staffId');

  // Fetch all bookings then filter in JS to avoid complex conditional SQL
  // (acceptable for MVP booking volumes)
  let rows = await db
    .select({
      id: schema.bookings.id,
      confirmationNumber: schema.bookings.confirmationNumber,
      status: schema.bookings.status,
      startTime: schema.bookings.startTime,
      endTime: schema.bookings.endTime,
      staffId: schema.bookings.staffId,
      serviceId: schema.bookings.serviceId,
      customerId: schema.bookings.customerId,
      cancelToken: schema.bookings.cancelToken,
      cancelledAt: schema.bookings.cancelledAt,
      createdAt: schema.bookings.createdAt,
    })
    .from(schema.bookings)
    .orderBy(schema.bookings.startTime);

  // Apply optional filters
  if (statusFilter && VALID_STATUSES.has(statusFilter)) {
    rows = rows.filter((r) => r.status === statusFilter);
  }

  if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
    const [year, month, day] = dateFilter.split('-').map(Number);
    const dayStart = new Date(Date.UTC(year, month - 1, day));
    const dayEnd = new Date(Date.UTC(year, month - 1, day + 1));
    rows = rows.filter(
      (r) => r.startTime >= dayStart && r.startTime < dayEnd
    );
  }

  if (staffIdFilter) {
    rows = rows.filter((r) => r.staffId === staffIdFilter);
  }

  return apiSuccess({ bookings: rows });
}
