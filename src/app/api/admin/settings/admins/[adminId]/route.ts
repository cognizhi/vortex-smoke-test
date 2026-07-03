/**
 * DELETE /api/admin/settings/admins/:adminId  — remove an admin user
 *
 * Rules:
 *  - Cannot delete the 'owner' account (409)
 *  - Non-owner cannot delete another admin (403)
 *  - Cannot delete yourself (409)
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';

type Params = { params: Promise<{ adminId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { adminId } = await params;
  const { db, schema, session } = ctx;

  const [target] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, adminId));

  if (!target) {
    return apiError('NOT_FOUND', 'Admin user not found.', 404);
  }

  // Cannot delete the owner account
  if (target.role === 'owner') {
    return apiError('CONFLICT', 'The owner account cannot be deleted.', 409);
  }

  // Cannot delete yourself
  if (target.id === session.userId) {
    return apiError('CONFLICT', 'You cannot delete your own account.', 409);
  }

  // Non-owner cannot delete other admins
  if (session.role !== 'owner') {
    return apiError('FORBIDDEN', 'Only the account owner can remove admin users.', 403);
  }

  await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, adminId));

  return apiSuccess({ deleted: true });
}
