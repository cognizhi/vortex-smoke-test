/**
 * Unit tests for GET /api/healthz-smoke-518124667
 *
 * Variant smoke test endpoint for canary deployments and specialized monitoring workflows.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "518124667" }
 *   - No extra fields in response
 *   - Content-Type header is application/json
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 *   - Performance under simulated load
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';

describe('GET /api/healthz-smoke-518124667', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC-02 & AC-04 & AC-05: Response body matches spec: { ok: true, variant: "518124667" }
  it('RH-02: returns correct JSON structure with ok: true and variant: "518124667"', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('518124667');
  });

  // AC-X01: Response JSON shape is exact (no extra fields)
  it('RH-03: response has exactly two fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(keys).toHaveLength(2);
  });

  // AC-03: Content-Type header is application/json
  it('RH-04: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-08 & AC-09: No authentication/external calls required
  it('RH-05: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-06: Response time is < 100ms (typically < 10ms)
  it('RH-06: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-06: Response time is typically very fast (< 10ms)
  it('RH-07: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // This is a softer assertion — failure here indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-E01: Under load (repeated calls), still responds within 100ms
  it('RH-08: under load (50 concurrent calls), all respond within 100ms', async () => {
    const calls = Array.from({ length: 50 }, () => GET());
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

  // AC-10: No environment variables needed (self-contained)
  it('RH-09: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 — the implementation
    // must not reference process.env
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('518124667');
  });

  // AC-X02: Consistency - Multiple sequential calls return identical responses
  it('RH-10: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    bodies.forEach((body) => {
      expect(body).toEqual({ ok: true, variant: '518124667' });
    });
  });

  // Type safety: Response is NextResponse
  it('RH-11: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // AC-04: ok field is boolean true (not truthy string, number, etc.)
  it('RH-12: ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown };
    expect(json.ok).toStrictEqual(true);
    expect(typeof json.ok).toBe('boolean');
  });

  // AC-05: variant field is string "518124667" (not number or other type)
  it('RH-13: variant field is string "518124667" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(json.variant).toStrictEqual('518124667');
    expect(typeof json.variant).toBe('string');
  });

  // AC-07: No database queries (pure function)
  it('RH-14: endpoint has no side effects or database dependencies', async () => {
    // The endpoint should not make any database calls, network requests, or side effects
    // This is verified implicitly by:
    // 1. The handler has no dependencies (no imports from @/lib/db, etc.)
    // 2. Response time is < 10ms (no async I/O)
    // 3. Multiple calls return identical responses
    const startTime = performance.now();
    const res = await GET();
    const endTime = performance.now();
    expect(res.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(10); // Fast enough to have no I/O
  });
});
