import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Slugs that are reserved for platform-level routes.
 * These cannot be registered as merchant subdomains.
 */
const RESERVED_SLUGS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'static',
  'support',
  'help',
  'billing',
  'status',
]);

/**
 * Hosts that are always treated as the platform root (not a merchant subdomain).
 * Includes localhost for local development.
 */
const PLATFORM_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Slug validation regex (OQ-04 from product brief):
 * - Lowercase letters, digits, hyphens only
 * - 3–30 characters
 * - Must start and end with a letter or digit
 */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Extract the merchant slug from a hostname.
 *
 * Rules:
 *  - `glamour-studio.platform.com`  → "glamour-studio"
 *  - `platform.com`                 → null  (root domain)
 *  - `localhost`                    → null  (local dev root)
 *  - `glamour-studio.localhost`     → "glamour-studio" (local dev subdomain)
 *
 * @param hostname  The bare hostname (no port, no protocol)
 * @param platformDomain  The configured platform domain (e.g. "platform.com")
 */
export function extractMerchantSlug(
  hostname: string,
  platformDomain: string
): string | null {
  // Local-dev subdomains: <slug>.localhost
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.slice(0, -'.localhost'.length);
    if (SLUG_REGEX.test(slug) && !RESERVED_SLUGS.has(slug)) return slug;
    return null;
  }

  // Pure platform hosts (no subdomain)
  if (PLATFORM_HOSTS.has(hostname)) return null;

  // Production subdomains: <slug>.<platformDomain>
  const suffix = `.${platformDomain}`;
  if (hostname.endsWith(suffix)) {
    const slug = hostname.slice(0, -suffix.length);
    // Reject the bare platform domain itself (no slug prefix)
    if (!slug) return null;
    if (SLUG_REGEX.test(slug) && !RESERVED_SLUGS.has(slug)) return slug;
    return null;
  }

  return null;
}

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? '';
  // Strip port (e.g. ":3000") for hostname comparison
  const hostname = host.replace(/:\d+$/, '');

  const platformDomain = process.env.PLATFORM_DOMAIN ?? 'platform.com';
  const slug = extractMerchantSlug(hostname, platformDomain);

  let response: NextResponse;

  // Paths that belong to the platform-level (admin) app, not the public booking site.
  // These must never be rewritten to /site/[slug]/... regardless of subdomain.
  const ADMIN_PATHS = ['/admin', '/login', '/register'];
  const isAdminPath = ADMIN_PATHS.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'));

  if (slug) {
    if (!request.nextUrl.pathname.startsWith('/api/') && !isAdminPath) {
      // Rewrite page routes to /site/[slug]/... so Next.js App Router resolves the right pages.
      // The original Host header is preserved by Next.js, keeping the user's URL unchanged.
      const url = request.nextUrl.clone();
      url.pathname = `/site/${slug}${request.nextUrl.pathname}`;
      response = NextResponse.rewrite(url);
    } else {
      // API routes and admin paths are NOT rewritten — the slug header alone is enough for
      // API handlers to resolve the merchant (x-merchant-slug).
      response = NextResponse.next();
    }
    // Inject slug as a header so API routes can resolve the merchant without re-parsing the host
    response.headers.set('x-merchant-slug', slug);
  } else {
    response = NextResponse.next();
  }

  // Security headers applied to every response
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
