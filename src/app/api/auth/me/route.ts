/**
 * GET /api/auth/me
 *
 * Returns the current admin session payload if authenticated, otherwise 401.
 * Used by the client to hydrate auth state without a full page reload.
 *
 * Response:
 *   200 { data: { userId, merchantId, slug, role, name?, email?, avatarUrl? }, error: null }
 *   401 { data: null, error: { code: "UNAUTHENTICATED", message } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSessionFromCookieHeader } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { getMerchantDb } from '@/lib/db/get-merchant-db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authSecret = env.AUTH_SECRET;
  if (!authSecret) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL', message: 'Server configuration error.' } },
      { status: 500 }
    );
  }

  const cookieHeader = request.headers.get('cookie');
  const session = await getSessionFromCookieHeader(cookieHeader, authSecret);

  if (!session) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated.' } },
      { status: 401 }
    );
  }

  // Best-effort enrichment: include name/email/avatarUrl so the navbar can show
  // the avatar without a second round-trip. Any failure falls back to the bare
  // session payload — `/api/auth/me` must never 500 over profile decoration.
  try {
    const merchant = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, session.slug),
      columns: { schemaName: true, status: true },
    });

    if (merchant && merchant.status === 'active') {
      const schema = createMerchantSchema(merchant.schemaName);
      const db = await getMerchantDb(session.slug);
      const [row] = await db
        .select({
          name: schema.adminUsers.name,
          email: schema.adminUsers.email,
          avatarUrl: schema.adminUsers.avatarUrl,
        })
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.role, 'owner'));

      if (row) {
        return NextResponse.json({ data: { ...session, ...row }, error: null }, { status: 200 });
      }
    }
  } catch (err) {
    console.error('[auth/me] profile enrichment failed:', err);
  }

  return NextResponse.json(
    { data: session, error: null },
    { status: 200 }
  );
}
