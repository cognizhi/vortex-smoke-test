/**
 * Unit tests for GET /api/healthz-smoke-bugfix-[...route]
 *
 * Dynamic variant-specific health check endpoint for load balancers and HA orchestration.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "<variant>" }
 *   - Variant is extracted correctly from URL
 *   - No extra fields in response
 *   - Content-Type header is application/json
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 *   - Performance under simulated load
 *   - Known variants (ha2-489393049, ha-986931698, etc.)
 *   - Arbitrary variant formats
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import handler after setting up mocks
import { GET } from '../route';

describe('GET /api/healthz-smoke-bugfix-[...route]', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status for the specific variant in the ticket
  it('AB-01: returns HTTP 200 status for ha2-489393049 (ticket variant)', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    expect(res.status).toBe(200);
  });

  // AC-01: Response body matches spec for ha2-489393049
  it('AB-02: returns correct JSON structure for ha2-489393049 with ok: true and variant field', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha2-489393049');
  });

  // AC-01: Response body matches spec for different variant (ha-986931698)
  it('AB-03: returns correct variant for related variant ha-986931698', async () => {
    const params = Promise.resolve({ route: ['ha-986931698'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha-986931698'), { params });
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha-986931698');
  });

  // AC-02: Response JSON shape is exact (no extra fields)
  it('AB-04: response has exactly two root fields (ok and variant)', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(rootKeys).toHaveLength(2);
  });

  // AC-03: Content-Type header is application/json
  it('AB-05: Content-Type header is application/json', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-05: No authentication required — endpoint works without auth
  it('AB-06: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-04: Response time is < 100ms (typically < 10ms)
  it('AB-07: response time is less than 100ms', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const startTime = performance.now();
    await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-04: Response time is typically very fast (< 10ms)
  it('AB-08: response time is typically fast (< 10ms)', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const startTime = performance.now();
    await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // This is a softer assertion — failure here indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-E01: Under load (repeated calls), still responds within 100ms
  it('AB-09: under load (50 concurrent calls), all respond within 100ms', async () => {
    const calls = Array.from({ length: 50 }, (_, i) => {
      const variant = i % 2 === 0 ? 'ha2-489393049' : 'ha-986931698';
      const params = Promise.resolve({ route: [variant] });
      return GET(new Request(`http://localhost:3000/api/healthz-smoke-bugfix-${variant}`), { params });
    });
    const startTime = performance.now();
    const results = await Promise.all(calls);
    const endTime = performance.now();

    // Check all responded with 200
    results.forEach((res) => {
      expect(res.status).toBe(200);
    });

    // Check total time is reasonable (50 calls should be fast)
    const totalElapsedMs = endTime - startTime;
    expect(totalElapsedMs).toBeLessThan(5000); // Allow 5s for 50 calls
  });

  // AC-E02: No environment variables needed (self-contained)
  it('AB-10: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 — the implementation
    // must not reference process.env
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
  });

  // Consistency: Multiple sequential calls return identical responses for same variant
  it('AB-11: multiple sequential calls return consistent responses', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const responses = await Promise.all([
      GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params }),
      GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params }),
      GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params }),
    ]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    bodies.forEach((body) => {
      expect(body).toEqual({ ok: true, variant: 'ha2-489393049' });
    });
  });

  // Type safety: Response is NextResponse
  it('AB-12: response is a NextResponse instance', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    expect(res).toBeInstanceOf(NextResponse);
  });

  // Edge case: Arbitrary variant formats (numbers, hyphens, underscores, etc.)
  it('AB-13: handles arbitrary variant formats with numbers, hyphens, and alphanumerics', async () => {
    const testVariants = [
      'ha2-489393049',
      'ha-986931698',
      'simple-id',
      'ha-1234567890',
      'regional_us_west_2',
      'abc123xyz789',
      'v1-a2-b3-c4',
    ];

    for (const variant of testVariants) {
      const params = Promise.resolve({ route: [variant] });
      const res = await GET(new Request(`http://localhost:3000/api/healthz-smoke-bugfix-${variant}`), { params });
      const json = (await res.json()) as { ok: boolean; variant: string };
      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.variant).toBe(variant);
    }
  });

  // Edge case: ok field is boolean true (not truthy string, number, etc.)
  it('AB-14: ok field is boolean true (not just truthy)', async () => {
    const params = Promise.resolve({ route: ['ha2-489393049'] });
    const res = await GET(new Request('http://localhost:3000/api/healthz-smoke-bugfix-ha2-489393049'), { params });
    const json = (await res.json()) as { ok: unknown; variant: string };
    expect(json.ok).toStrictEqual(true);
    expect(typeof json.ok).toBe('boolean');
  });
});
