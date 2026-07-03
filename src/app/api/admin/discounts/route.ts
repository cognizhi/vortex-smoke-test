/**
 * GET  /api/admin/discounts  — list all discounts
 * POST /api/admin/discounts  — create a new discount
 */
import { NextRequest } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { createDiscountSchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;

  const discounts = await db
    .select()
    .from(schema.discounts)
    .orderBy(schema.discounts.createdAt);

  return apiSuccess({ discounts });
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

  const parsed = createDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  // Check uniqueness (case-insensitive)
  const existing = await db
    .select()
    .from(schema.discounts)
    .where(eq(sql`LOWER(${schema.discounts.code})`, parsed.data.code.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return apiError('DUPLICATE_CODE', 'Discount code already exists', 409);
  }

  const [discount] = await db
    .insert(schema.discounts)
    .values({
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value.toString(),
      description: parsed.data.description ?? null,
      expirationDate: new Date(parsed.data.expirationDate),
      isActive: true,
      timesUsed: 0,
    })
    .returning();

  return apiSuccess({ discount }, 201);
}
