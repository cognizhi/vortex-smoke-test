/**
 * GET /api/check-slug?slug=xxx
 *
 * Real-time subdomain availability check.
 * Used by the registration form to debounce-validate the user's slug input.
 *
 * Public endpoint — no auth required.
 *
 * Response:
 *   200 { data: { slug, available: true }, error: null }
 *   200 { data: { slug, available: false, reason: "taken" | "invalid" | "reserved" }, error: null }
 *   400 { data: null, error: { code: "INVALID_INPUT", message: "..." } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { checkSlugSchema, RESERVED_SLUGS, SLUG_REGEX } from '@/lib/validations/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const slug = request.nextUrl.searchParams.get('slug') ?? '';

  // Fast-path validation before touching the DB
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      {
        data: { slug, available: false, reason: 'invalid' as const },
        error: null,
      },
      { status: 200 }
    );
  }

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json(
      {
        data: { slug, available: false, reason: 'reserved' as const },
        error: null,
      },
      { status: 200 }
    );
  }

  // Full schema validation (catches edge cases the regex alone might miss)
  const parsed = checkSlugSchema.safeParse({ slug });
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INVALID_INPUT',
          message: parsed.error.errors[0]?.message ?? 'Invalid slug',
        },
      },
      { status: 400 }
    );
  }

  // DB lookup
  let existing: { slug: string } | undefined;
  try {
    existing = await platformDb.query.merchants.findFirst({
      where: eq(merchants.slug, slug),
      columns: { slug: true },
    });
  } catch {
    // If the platform schema doesn't exist yet (fresh install), treat as available
    existing = undefined;
  }

  if (existing) {
    return NextResponse.json(
      {
        data: { slug, available: false, reason: 'taken' as const },
        error: null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      data: { slug, available: true },
      error: null,
    },
    { status: 200 }
  );
}
