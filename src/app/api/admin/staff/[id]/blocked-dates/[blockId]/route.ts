/**
 * DELETE /api/admin/staff/:id/blocked-dates/:blockId  — remove a blocked date range
 */
import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';

type Params = { params: Promise<{ id: string; blockId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id, blockId } = await params;
  const { db, schema } = ctx;

  // Ensure the blocked-date belongs to this staff member (prevents cross-staff deletion)
  const [existing] = await db
    .select({ id: schema.staffBlockedDates.id })
    .from(schema.staffBlockedDates)
    .where(
      and(
        eq(schema.staffBlockedDates.id, blockId),
        eq(schema.staffBlockedDates.staffId, id)
      )
    );

  if (!existing) {
    return apiError('NOT_FOUND', 'Blocked date range not found.', 404);
  }

  await db
    .delete(schema.staffBlockedDates)
    .where(eq(schema.staffBlockedDates.id, blockId));

  return apiSuccess({ deleted: true });
}
