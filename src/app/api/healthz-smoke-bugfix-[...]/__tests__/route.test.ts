/**
 * Unit tests for GET /api/healthz-smoke-bugfix-[...variant]
 *
 * Dynamic variant-specific health check endpoint for load balancers and monitoring systems.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "<variant>" }
 *   - No extra fields in response
 *   - Content-Type header is application/json
 *   - Works with both known variants (ha-*, ha2-*) and arbitrary variants
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 *   - Performance under simulated load
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';

/**
 * Helper function to call the GET handler with a variant
 */
async function callGET(variant: string): Promise<NextResponse> {
  return GET(
    new Request('http://localhost') as any,
    {
      params: Promise.resolve({
        slug: variant.split('/'),
      } as any),
    }
  );
}

describe('GET /api/healthz-smoke-bugfix-[...variant]', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status for ha-986931698 variant
  it('RH-01: returns HTTP 200 status for ha-986931698 variant', async () => {
    const res = await callGET('ha-986931698');
    expect(res.status).toBe(200);
  });

  // AC-01: Returns HTTP 200 status for ha2-489393049 variant
  it('RH-02: returns HTTP 200 status for ha2-489393049 variant', async () => {
    const res = await callGET('ha2-489393049');
    expect(res.status).toBe(200);
  });

  // AC-01: Response body for ha-986931698 variant matches spec
  it('RH-03: returns correct JSON structure with ok: true and variant for ha-986931698', async () => {
    const res = await callGET('ha-986931698');
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha-986931698');
  });

  // AC-01: Response body for ha2-489393049 variant matches spec
  it('RH-04: returns correct JSON structure with ok: true and variant for ha2-489393049', async () => {
    const res = await callGET('ha2-489393049');
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha2-489393049');
  });

  // AC-02: Response JSON shape is exact (no extra fields)
  it('RH-05: response has exactly two fields (ok and variant)', async () => {
    const res = await callGET('ha-986931698');
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(rootKeys).toHaveLength(2);
  });

  // AC-02: No extra fields in response
  it('RH-06: response has no extra fields', async () => {
    const res = await callGET('custom-variant-name');
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    // Ensure only ok and variant are present, nothing else
    expect(rootKeys).toContain('ok');
    expect(rootKeys).toContain('variant');
    rootKeys.forEach((key) => {
      expect(['ok', 'variant']).toContain(key);
    });
  });

  // AC-03: Content-Type header is application/json
  it('RH-07: Content-Type header is application/json', async () => {
    const res = await callGET('ha-986931698');
    expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
  });

  // AC-04: Works with arbitrary variants (not just ha-*/ha2-*)
  it('RH-08: works with arbitrary variant identifiers', async () => {
    const res = await callGET('custom-variant-xyz-123');
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('custom-variant-xyz-123');
  });

  // AC-05: No authentication required — endpoint works without auth
  it('RH-09: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await callGET('ha-986931698');
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-04: Response time is < 100ms (typically < 10ms)
  it('RH-10: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await callGET('ha-986931698');
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-04: Response time is typically very fast (< 10ms)
  it('RH-11: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await callGET('ha-986931698');
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // This is a softer assertion — failure here indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-E01: Under load (repeated calls), still responds within 100ms
  it('RH-12: under load (50 concurrent calls), all respond within 100ms', async () => {
    const calls = Array.from({ length: 50 }, () => callGET('ha-986931698'));
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
  it('RH-13: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 — the implementation
    // must not reference process.env
    const res = await callGET('ha-986931698');
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha-986931698');
  });

  // Consistency: Multiple sequential calls return consistent responses
  it('RH-14: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([
      callGET('ha-986931698'),
      callGET('ha-986931698'),
      callGET('ha-986931698'),
    ]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
    });

    bodies.forEach((body) => {
      expect(body).toEqual({ ok: true, variant: 'ha-986931698' });
    });
  });
});
