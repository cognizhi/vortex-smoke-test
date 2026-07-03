/**
 * Admin route guard — validates JWT session and resolves the merchant
 * database context for a Next.js API route handler.
 *
 * Usage in a route file:
 *
 *   export async function GET(request: NextRequest) {
 *     const ctx = await requireAdminAuth(request);
 *     if (!ctx.ok) return ctx.response;
 *     const { session, schema, db } = ctx;
 *     // ... use db.select().from(schema.staff) etc.
 *   }
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '../env';
import { getSessionFromCookieHeader, type AdminSession } from './session';
import { platformDb } from '../db/platform-client';
import { merchants } from '../db/platform-schema';
import { createMerchantSchema, type MerchantSchemaType } from '../db/merchant-schema';

// ---------------------------------------------------------------------------
// Shared pg Pool for merchant schema queries
// ---------------------------------------------------------------------------
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: env.DATABASE_URL, max: 20 });
  }
  return _pool;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AdminContext {
  session: AdminSession;
  slug: string;
  merchantId: string;
  schemaName: string;
  schema: MerchantSchemaType;
  /** Drizzle instance scoped to the merchant's private schema */
  db: ReturnType<typeof drizzle>;
}

export type AdminAuthResult =
  | { ok: true } & AdminContext
  | { ok: false; response: NextResponse };

// ---------------------------------------------------------------------------
// Helper: build JSON error responses
// ---------------------------------------------------------------------------

export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { data: null, error: { code, message } },
    { status }
  );
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data, error: null }, { status });
}

// ---------------------------------------------------------------------------
// Core guard
// ---------------------------------------------------------------------------

/**
 * Validate the admin session cookie and return the merchant DB context.
 *
 * Returns `{ ok: false, response }` with a ready-to-return NextResponse on
 * any auth / config failure. Callers MUST check `ctx.ok` before proceeding.
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  // 1. Resolve merchant slug from header set by middleware
  const slug = request.headers.get('x-merchant-slug');
  if (!slug) {
    return { ok: false, response: apiError('NOT_FOUND', 'Merchant not found.', 404) };
  }

  // 2. Validate JWT session
  const authSecret = env.AUTH_SECRET;
  if (!authSecret) {
    console.error('[admin-guard] AUTH_SECRET is not configured');
    return {
      ok: false,
      response: apiError('INTERNAL', 'Server configuration error.', 500),
    };
  }

  const session = await getSessionFromCookieHeader(
    request.headers.get('cookie'),
    authSecret
  );

  if (!session) {
    return {
      ok: false,
      response: apiError('UNAUTHENTICATED', 'Authentication required.', 401),
    };
  }

  // 3. Guard: session slug must match the subdomain being accessed
  if (session.slug !== slug) {
    return {
      ok: false,
      response: apiError('FORBIDDEN', 'Access denied.', 403),
    };
  }

  // 4. Resolve merchant schemaName from platform DB
  let merchant: { id: string; schemaName: string; status: string } | undefined;
  try {
    merchant = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, slug),
      columns: { id: true, schemaName: true, status: true },
    });
  } catch (err) {
    console.error('[admin-guard] platform DB query failed:', err);
    return {
      ok: false,
      response: apiError('INTERNAL', 'Database error.', 500),
    };
  }

  if (!merchant || merchant.status !== 'active') {
    return {
      ok: false,
      response: apiError('NOT_FOUND', 'Merchant not found or inactive.', 404),
    };
  }

  // 5. Build merchant-scoped Drizzle instance
  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });

  return {
    ok: true,
    session,
    slug,
    merchantId: merchant.id,
    schemaName: merchant.schemaName,
    schema,
    db,
  };
}

/**
 * Guard that additionally requires the 'owner' role.
 * Use for destructive operations like deleting the owner account.
 */
export async function requireOwnerAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  const result = await requireAdminAuth(request);
  if (!result.ok) return result;

  if (result.session.role !== 'owner') {
    return {
      ok: false,
      response: apiError('FORBIDDEN', 'Owner access required.', 403),
    };
  }

  return result;
}
