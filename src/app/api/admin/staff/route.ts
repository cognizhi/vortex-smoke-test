/**
 * GET  /api/admin/staff  — list all staff (with availability)
 * POST /api/admin/staff  — create a new staff member
 */
import { NextRequest } from 'next/server';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { createStaffSchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const staffRows = await db.select().from(schema.staff).orderBy(schema.staff.name);

  // Load availability for each staff member
  const staffIds = staffRows.map((s) => s.id);
  const availability =
    staffIds.length > 0
      ? await db.select().from(schema.staffAvailability)
      : [];

  const staffWithAvailability = staffRows.map((s) => ({
    ...s,
    availability: availability.filter((a) => a.staffId === s.id),
  }));

  return apiSuccess({ staff: staffWithAvailability });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const { name, contactNumber, email, isVisible } = parsed.data;

  const [staff] = await db
    .insert(schema.staff)
    .values({
      name,
      contactNumber: contactNumber ?? null,
      email: email || null,
      isVisible: isVisible ?? true,
    })
    .returning();

  return apiSuccess({ staff }, 201);
}
