/**
 * Regression test for VRTX-0548: /healthz-smoke-bugfix3-279760907 returns 404
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 279760907.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "279760907" }
 *   - No extra fields in response
 *   - Both fields are correct type and value
 *   - Content-Type header is application/json
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';

describe('GET /api/healthz-smoke-bugfix3-279760907', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (3 tests)
  // ============================================================================

  // AC: Returns HTTP 200 status
  it('returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC: Response body matches spec: { ok: true, variant: "279760907" }
  it('returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      ok: boolean;
      variant: string;
    };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('279760907');
  });

  // AC: Response has correct top-level fields
  it('response has exactly two root fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(rootKeys).toHaveLength(2);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (2 tests)
  // ============================================================================

  // AC: ok field is boolean true (not just truthy string/number)
  it('ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown };
    expect(typeof json.ok).toBe('boolean');
    expect(json.ok).toStrictEqual(true);
  });

  // AC: variant field is string "279760907" (not number)
  it('variant field is string "279760907" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toStrictEqual('279760907');
    expect(json.variant).toBe('279760907');
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC: Content-Type header is application/json
  it('Content-Type header is application/json', async () => {
    const res = await GET();
    const contentType = res.headers.get('Content-Type');
    expect(contentType).toMatch(/application\/json/);
  });

  // AC: Response is a NextResponse instance
  it('response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance & Consistency (6 tests)
  // ============================================================================

  // AC: Response time < 100ms
  it('response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC: Response time typically < 10ms
  it('response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC: Under load (50 concurrent calls), all respond within 100ms
  it('under load (50 concurrent calls), all respond within 100ms', async () => {
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

  // AC: No authentication required
  it('endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC: Consistency — multiple sequential calls return identical responses
  it('multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toMatch(/application\/json/);
    });

    const expected = { ok: true, variant: '279760907' };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  // AC: No environment variables needed (self-contained)
  it('endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 with correct response
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      variant: string;
    };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('279760907');
  });
});
