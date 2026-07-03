/**
 * GET /api/admin/profile — return the signed-in admin's profile.
 *
 * The admin user is resolved from the JWT session (`session.userId`), never
 * from the request, so a user can only read their own profile.
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  // Auth is currently owner-only: the login route issues role:'owner' sessions
  // keyed on the merchant id (not an admin_users.id), so resolve the profile by
  // the single owner row in this merchant's schema. Revisit when multi-admin
  // login lands and session.userId becomes a real admin_users.id.
  const [profile] = await db
    .select({
      id: schema.adminUsers.id,
      name: schema.adminUsers.name,
      email: schema.adminUsers.email,
      avatarUrl: schema.adminUsers.avatarUrl,
    })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.role, 'owner'));

  if (!profile) return apiError('NOT_FOUND', 'Profile not found.', 404);

  return apiSuccess(profile);
}
