/**
 * GET  /api/admin/services  — list all services
 * POST /api/admin/services  — create a new service
 */
import { NextRequest } from 'next/server';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { createServiceSchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const services = await db
    .select()
    .from(schema.services)
    .orderBy(schema.services.name);

  return apiSuccess({ services });
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

  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  const [service] = await db
    .insert(schema.services)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      durationMinutes: parsed.data.durationMinutes,
      priceCents: parsed.data.priceCents ?? null,
      isEnabled: parsed.data.isEnabled ?? true,
    })
    .returning();

  return apiSuccess({ service }, 201);
}
