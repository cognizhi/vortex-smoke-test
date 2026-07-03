/**
 * Tests for subdomain routing middleware.
 *
 * Covers:
 *  - extractMerchantSlug() — the pure function testable without Next.js internals
 *  - middleware() — integration tests using NextRequest
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// extractMerchantSlug is exported directly for unit testing
import { extractMerchantSlug, middleware } from '../middleware';

// ---------------------------------------------------------------------------
// extractMerchantSlug — unit tests (pure function, no Next.js dependency)
// ---------------------------------------------------------------------------

describe('extractMerchantSlug', () => {
  const DOMAIN = 'platform.com';

  it('returns slug for a standard production subdomain', () => {
    expect(extractMerchantSlug('glamour-studio.platform.com', DOMAIN)).toBe('glamour-studio');
  });

  it('returns slug for a single-segment subdomain', () => {
    // Minimum valid slug length is 3 chars
    expect(extractMerchantSlug('abc.platform.com', DOMAIN)).toBe('abc');
  });

  it('returns null for the bare apex domain', () => {
    expect(extractMerchantSlug('platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for www.platform.com (reserved)', () => {
    expect(extractMerchantSlug('www.platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for api.platform.com (reserved)', () => {
    expect(extractMerchantSlug('api.platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for admin.platform.com (reserved)', () => {
    expect(extractMerchantSlug('admin.platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for localhost', () => {
    expect(extractMerchantSlug('localhost', DOMAIN)).toBeNull();
  });

  it('returns slug for a .localhost subdomain (local dev)', () => {
    expect(extractMerchantSlug('my-salon.localhost', DOMAIN)).toBe('my-salon');
  });

  it('returns null for an invalid slug with uppercase', () => {
    expect(extractMerchantSlug('My-Salon.platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for a slug with trailing hyphen', () => {
    expect(extractMerchantSlug('bad-.platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for a slug with leading hyphen', () => {
    expect(extractMerchantSlug('-bad.platform.com', DOMAIN)).toBeNull();
  });

  it('returns null for a slug that is too short (< 3 chars)', () => {
    expect(extractMerchantSlug('ab.platform.com', DOMAIN)).toBeNull();
  });

  it('handles a slug with digits', () => {
    expect(extractMerchantSlug('studio42.platform.com', DOMAIN)).toBe('studio42');
  });

  it('handles a custom platform domain', () => {
    expect(extractMerchantSlug('my-shop.mybooking.app', 'mybooking.app')).toBe('my-shop');
  });

  it('returns null when the hostname does not match the platform domain', () => {
    expect(extractMerchantSlug('evil.attacker.com', DOMAIN)).toBeNull();
  });

  it('returns null for the reserved slug "support"', () => {
    expect(extractMerchantSlug('support.platform.com', DOMAIN)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// middleware() — integration tests
// ---------------------------------------------------------------------------

describe('middleware', () => {
  let savedPlatformDomain: string | undefined;

  beforeEach(() => {
    savedPlatformDomain = process.env.PLATFORM_DOMAIN;
    process.env.PLATFORM_DOMAIN = 'platform.com';
  });

  afterEach(() => {
    process.env.PLATFORM_DOMAIN = savedPlatformDomain;
  });

  it('sets x-merchant-slug header for a subdomain request', () => {
    const req = new NextRequest('https://glamour-studio.platform.com/book', {
      headers: { host: 'glamour-studio.platform.com' },
    });
    const response = middleware(req);

    expect(response.headers.get('x-merchant-slug')).toBe('glamour-studio');
  });

  it('does not set x-merchant-slug for the apex domain', () => {
    const req = new NextRequest('https://platform.com/', {
      headers: { host: 'platform.com' },
    });
    const response = middleware(req);

    expect(response.headers.get('x-merchant-slug')).toBeNull();
  });

  it('sets security headers on all responses', () => {
    const req = new NextRequest('https://platform.com/', {
      headers: { host: 'platform.com' },
    });
    const response = middleware(req);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('sets security headers on subdomain responses too', () => {
    const req = new NextRequest('https://glamour-studio.platform.com/', {
      headers: { host: 'glamour-studio.platform.com' },
    });
    const response = middleware(req);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('strips port before slug extraction', () => {
    const req = new NextRequest('http://my-salon.localhost:3000/', {
      headers: { host: 'my-salon.localhost:3000' },
    });
    const response = middleware(req);

    expect(response.headers.get('x-merchant-slug')).toBe('my-salon');
  });

  it('does NOT rewrite API paths for subdomain requests (passes through unchanged)', () => {
    const req = new NextRequest('https://glamour-studio.platform.com/api/booking/slots', {
      headers: { host: 'glamour-studio.platform.com' },
    });
    const response = middleware(req);

    // Slug header must still be set so API handlers can resolve the merchant
    expect(response.headers.get('x-merchant-slug')).toBe('glamour-studio');
    // The rewrite URL in the response should NOT contain /site/{slug}/api/...
    // (NextResponse.next() has no rewrite destination)
    const dest = response.headers.get('x-middleware-rewrite');
    expect(dest).toBeNull();
  });

  it('rewrites non-API page paths for subdomain requests', () => {
    const req = new NextRequest('https://glamour-studio.platform.com/cancel/my-token', {
      headers: { host: 'glamour-studio.platform.com' },
    });
    const response = middleware(req);

    expect(response.headers.get('x-merchant-slug')).toBe('glamour-studio');
    const dest = response.headers.get('x-middleware-rewrite');
    expect(dest).toContain('/site/glamour-studio/cancel/my-token');
  });
});
