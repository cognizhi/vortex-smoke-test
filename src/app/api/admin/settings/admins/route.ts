/**
 * GET  /api/admin/settings/admins  — list all admin users
 * POST /api/admin/settings/admins  — add a new admin user
 *
 * Only the owner can add/list admins.
 */
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { addAdminUserSchema } from '@/lib/validations/admin';
import { hashPassword } from '@/lib/auth/password';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const admins = await db
    .select({
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      name: schema.adminUsers.name,
      role: schema.adminUsers.role,
      createdAt: schema.adminUsers.createdAt,
    })
    .from(schema.adminUsers)
    .orderBy(schema.adminUsers.createdAt);

  return apiSuccess({ admins });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  // Only owner can add admins
  if (ctx.session.role !== 'owner') {
    return apiError('FORBIDDEN', 'Only the account owner can add admin users.', 403);
  }

  const { db, schema } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = addAdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  // Check email uniqueness within this merchant
  const [existing] = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, parsed.data.email));

  if (existing) {
    return apiError('EMAIL_TAKEN', 'An admin with this email already exists.', 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const [admin] = await db
    .insert(schema.adminUsers)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: 'admin',
    })
    .returning({
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      name: schema.adminUsers.name,
      role: schema.adminUsers.role,
      createdAt: schema.adminUsers.createdAt,
    });

  return apiSuccess({ admin }, 201);
}
