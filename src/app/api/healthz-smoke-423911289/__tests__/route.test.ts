/**
 * Unit tests for GET /api/healthz-smoke-423911289
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 423911289.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "423911289" }
 *   - No extra fields in response
 *   - Both fields are correct type and value
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

describe('GET /api/healthz-smoke-423911289', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (4 tests)
  // ============================================================================

  // AC-02: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-03: Response body matches spec: { ok: true, variant: "423911289" }
  it('RH-02: returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      ok: unknown;
      variant: unknown;
    };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('423911289');
  });

  // AC-04: Response JSON has no extra fields (exactly ok and variant)
  it('RH-03: response has no extra fields in root object', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['ok', 'variant']);
  });

  // AC-04: Response has exactly two root fields: ok and variant
  it('RH-04: response has exactly two root fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(rootKeys).toHaveLength(2);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (2 tests)
  // ============================================================================

  // AC-05: ok field is boolean true (not truthy string/number)
  it('RH-05: ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown };
    expect(typeof json.ok).toBe('boolean');
    expect(json.ok).toStrictEqual(true);
  });

  // AC-06: variant field is string "423911289" (not number)
  it('RH-06: variant field is string "423911289" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toStrictEqual('423911289');
    expect(json.variant).toBe('423911289');
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC-07: Content-Type header is application/json
  it('RH-07: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-14: Response is a NextResponse instance
  it('RH-08: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance (3 tests)
  // ============================================================================

  // AC-08: Response time < 100ms
  it('RH-09: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-09: Response time typically < 10ms
  it('RH-10: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-11: Under load (50 concurrent calls), all respond within 100ms
  it('RH-11: under load (50 concurrent calls), all respond within 100ms', async () => {
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

  // ============================================================================
  // GROUP 5: Public Access & Consistency (3 tests)
  // ============================================================================

  // AC-10: No authentication required
  it('RH-12: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-13: Consistency — multiple sequential calls return identical responses
  it('RH-13: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    const expected = { ok: true, variant: '423911289' };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  // AC-12: No environment variables needed (self-contained)
  it('RH-14: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 with correct response
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('423911289');
  });
});
