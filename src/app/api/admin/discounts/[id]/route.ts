/**
 * GET    /api/admin/discounts/:id  — get a single discount
 * PATCH  /api/admin/discounts/:id  — update a discount (partial)
 * DELETE /api/admin/discounts/:id  — delete a discount
 */
import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { requireAdminAuth, apiSuccess, apiError } from '@/lib/auth/admin-guard';
import { updateDiscountSchema } from '@/lib/validations/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [discount] = await db
    .select()
    .from(schema.discounts)
    .where(eq(schema.discounts.id, id));

  if (!discount) return apiError('NOT_FOUND', 'Discount not found.', 404);
  return apiSuccess({ discount });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [existing] = await db
    .select()
    .from(schema.discounts)
    .where(eq(schema.discounts.id, id));
  if (!existing) return apiError('NOT_FOUND', 'Discount not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = updateDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  // Check code uniqueness if code is being updated (case-insensitive)
  if (parsed.data.code !== undefined && parsed.data.code !== existing.code) {
    const codeExists = await db
      .select()
      .from(schema.discounts)
      .where(eq(sql`LOWER(${schema.discounts.code})`, parsed.data.code.toLowerCase()))
      .limit(1);

    if (codeExists.length > 0) {
      return apiError('DUPLICATE_CODE', 'Discount code already exists', 409);
    }
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.code !== undefined) updates.code = parsed.data.code;
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.value !== undefined) updates.value = parsed.data.value.toString();
  if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
  if (parsed.data.expirationDate !== undefined)
    updates.expirationDate = new Date(parsed.data.expirationDate);
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

  if (Object.keys(updates).length === 0) {
    return apiError('INVALID_INPUT', 'No fields to update.', 400);
  }

  const [updated] = await db
    .update(schema.discounts)
    .set(updates)
    .where(eq(schema.discounts.id, id))
    .returning();

  return apiSuccess({ discount: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { id } = await params;
  const { db, schema } = ctx;

  const [existing] = await db
    .select()
    .from(schema.discounts)
    .where(eq(schema.discounts.id, id));
  if (!existing) return apiError('NOT_FOUND', 'Discount not found.', 404);

  await db.delete(schema.discounts).where(eq(schema.discounts.id, id));
  return apiSuccess({ deleted: true });
}
