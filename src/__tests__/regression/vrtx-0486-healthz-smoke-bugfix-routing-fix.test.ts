/**
 * Regression Test: VRTX-0486 - Next.js 15 Route Discovery Fix
 *
 * Bug: Endpoints matching pattern healthz-smoke-bugfix-ha-* and healthz-smoke-bugfix-ha2-*
 *      return HTTP 404 HTML instead of JSON responses.
 *
 * Root Cause: Invalid catch-all route syntax [...]` should be [...]routeName]` in Next.js 15.
 *            The unnamed catch-all was not recognized as valid dynamic routing syntax, causing
 *            both the catch-all AND the specific routes to fail.
 *
 * Fix: Renamed catch-all directory from /healthz-smoke-bugfix-[...]/ to /healthz-smoke-bugfix-[...route]/
 *      and updated parameter extraction from `__param` to `route`.
 *
 * Verification: Endpoints now return 200 OK with correct JSON response.
 */
import { describe, it, expect } from 'vitest';
import { GET as getCatchAllHandler } from '../../app/api/healthz-smoke-bugfix-[...route]/route';

describe('REGRESSION: VRTX-0486 - Healthz smoke-bugfix routing fix', () => {
  it('catch-all route handles SPRINT-0080 variant (ha-30297400)', async () => {
    const params = Promise.resolve({ route: ['ha-30297400'] });
    const res = await getCatchAllHandler(
      new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha-30297400'),
      { params }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json).toEqual({
      ok: true,
      variant: 'ha-30297400',
    });
  });

  it('catch-all route handles SPRINT-0082 variant (ha-986931698)', async () => {
    const params = Promise.resolve({ route: ['ha-986931698'] });
    const res = await getCatchAllHandler(
      new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha-986931698'),
      { params }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json).toEqual({
      ok: true,
      variant: 'ha-986931698',
    });
  });

  it('catch-all route handles SPRINT-0085 variant ha (ha-57235969)', async () => {
    const params = Promise.resolve({ route: ['ha-57235969'] });
    const res = await getCatchAllHandler(
      new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha-57235969'),
      { params }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json).toEqual({
      ok: true,
      variant: 'ha-57235969',
    });
  });

  it('catch-all route handles SPRINT-0085 variant ha2 (ha2-409438860)', async () => {
    const params = Promise.resolve({ route: ['ha2-409438860'] });
    const res = await getCatchAllHandler(
      new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-409438860'),
      { params }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json).toEqual({
      ok: true,
      variant: 'ha2-409438860',
    });
  });

  it('returns JSON content-type for all variants', async () => {
    const variants = ['ha-30297400', 'ha-986931698', 'ha-57235969', 'ha2-409438860'];

    for (const variant of variants) {
      const params = Promise.resolve({ route: [variant] });
      const res = await getCatchAllHandler(
        new Request(`http://localhost:3000/api/healthz-smoke-bugfix-${variant}`),
        { params }
      );

      expect(res.headers.get('Content-Type')).toBe('application/json');
    }
  });

  it('handles multiple path segments if variant contains slashes', async () => {
    const params = Promise.resolve({ route: ['ha', '2', '409438860'] });
    const res = await getCatchAllHandler(
      new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha/2/409438860'),
      { params }
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    // The handler joins array elements with '/'
    expect(json.variant).toBe('ha/2/409438860');
  });

  it('all concurrent requests succeed (50 concurrent to same endpoint)', async () => {
    const calls = Array.from({ length: 50 }, () => {
      const params = Promise.resolve({ route: ['ha2-409438860'] });
      return getCatchAllHandler(
        new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-409438860'),
        { params }
      );
    });

    const results = await Promise.all(calls);

    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });
});
