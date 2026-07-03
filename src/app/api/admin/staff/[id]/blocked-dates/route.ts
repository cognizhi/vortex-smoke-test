/**
 * GET  /api/admin/staff/:id/blocked-dates  — list blocked date ranges
 * POST /api/admin/staff/:id/blocked-dates  — add a new blocked date range
 */
import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { addBlockedDateSchema } from '@/lib/validations/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [staff] = await db
    .select({ id: schema.staff.id })
    .from(schema.staff)
    .where(eq(schema.staff.id, id));
  if (!staff) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  const blockedDates = await db
    .select()
    .from(schema.staffBlockedDates)
    .where(eq(schema.staffBlockedDates.staffId, id))
    .orderBy(desc(schema.staffBlockedDates.startDate));

  return apiSuccess({ blockedDates });
}

export async function POST(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [staff] = await db
    .select({ id: schema.staff.id })
    .from(schema.staff)
    .where(eq(schema.staff.id, id));
  if (!staff) return apiError('NOT_FOUND', 'Staff member not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = addBlockedDateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const [blockedDate] = await db
    .insert(schema.staffBlockedDates)
    .values({
      staffId: id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason ?? null,
    })
    .returning();

  return apiSuccess({ blockedDate }, 201);
}
