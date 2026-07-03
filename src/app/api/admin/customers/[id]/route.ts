/**
 * GET /api/admin/customers/:id  — customer detail with booking history
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id));

  if (!customer) return apiError('NOT_FOUND', 'Customer not found.', 404);

  // Get booking history for this customer
  const bookingRows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.customerId, id))
    .orderBy(schema.bookings.startTime);

  // Enrich bookings with staff + service info
  const staffIds = [...new Set(bookingRows.map((b) => b.staffId))];
  const serviceIds = [...new Set(bookingRows.map((b) => b.serviceId))];

  const staffRows =
    staffIds.length > 0
      ? await db.select().from(schema.staff)
      : [];

  const serviceRows =
    serviceIds.length > 0
      ? await db.select().from(schema.services)
      : [];

  const staffMap = new Map(staffRows.map((s) => [s.id, s]));
  const serviceMap = new Map(serviceRows.map((s) => [s.id, s]));

  const bookings = bookingRows.map((b) => {
    const staff = staffMap.get(b.staffId);
    const service = serviceMap.get(b.serviceId);
    return {
      id: b.id,
      confirmationNumber: b.confirmationNumber,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      createdAt: b.createdAt,
      staff: staff ? { id: staff.id, name: staff.name } : null,
      service: service ? { id: service.id, name: service.name, durationMinutes: service.durationMinutes } : null,
    };
  });

  return apiSuccess({
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      contactNumber: customer.contactNumber,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt,
    },
    bookings,
  });
}
