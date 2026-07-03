/**
 * GET /api/admin/customers  — list customers (paginated, searchable)
 *
 * Query params:
 *   page       (default 1)
 *   pageSize   (default 25, max 100)
 *   search     optional — matches firstName or email (case-insensitive)
 *   isVerified optional — "true" | "false"
 */
import { NextRequest } from 'next/server';
import { eq, ilike, or, sql, and } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess } from '@/lib/auth/admin-guard';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '25', 10) || 25));
  const search = searchParams.get('search')?.trim() ?? '';
  const isVerifiedParam = searchParams.get('isVerified');
  const isVerifiedFilter =
    isVerifiedParam === 'true' ? true : isVerifiedParam === 'false' ? false : undefined;

  const offset = (page - 1) * pageSize;

  // Build WHERE clause
  const searchCondition = search
    ? or(
        ilike(schema.customers.firstName, `%${search}%`),
        ilike(schema.customers.email, `%${search}%`)
      )
    : undefined;
  const verifiedCondition =
    isVerifiedFilter !== undefined
      ? eq(schema.customers.isVerified, isVerifiedFilter)
      : undefined;

  const whereClause =
    searchCondition && verifiedCondition
      ? and(searchCondition, verifiedCondition)
      : searchCondition ?? verifiedCondition;

  const customers = await db
    .select()
    .from(schema.customers)
    .where(whereClause)
    .orderBy(schema.customers.createdAt)
    .limit(pageSize)
    .offset(offset);

  // Count total for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.customers)
    .where(whereClause);

  // Attach booking count + last booking date for each customer.
  // Use a safe parameterized ANY() expression to avoid SQL injection.
  const customerIds = customers.map((c) => c.id);
  let bookingStats: { customerId: string; bookingCount: number; lastBookingAt: string | null }[] = [];

  if (customerIds.length > 0) {
    bookingStats = await db
      .select({
        customerId: schema.bookings.customerId,
        bookingCount: sql<number>`count(*)::int`,
        lastBookingAt: sql<string | null>`max(${schema.bookings.startTime})::text`,
      })
      .from(schema.bookings)
      .where(sql`${schema.bookings.customerId} = ANY(${sql`${customerIds}::uuid[]`})`)
      .groupBy(schema.bookings.customerId) as typeof bookingStats;
  }

  const statsMap = new Map(bookingStats.map((s) => [s.customerId, s]));

  const enriched = customers.map((c) => {
    const stats = statsMap.get(c.id);
    return {
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      contactNumber: c.contactNumber,
      isVerified: c.isVerified,
      bookingCount: stats?.bookingCount ?? 0,
      lastBookingAt: stats?.lastBookingAt ?? null,
      createdAt: c.createdAt,
    };
  });

  return apiSuccess({ customers: enriched, total: count, page, pageSize });
}
