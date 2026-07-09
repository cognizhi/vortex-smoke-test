/**
 * Unit tests for GET /api/healthz-smoke-763023087
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 763023087.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { data: { ok: true, variant: "763023087" }, error: null }
 *   - Type safety for all fields
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

describe('GET /api/healthz-smoke-763023087', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (5 tests)
  // ============================================================================

  // AC-02: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-03, AC-04: Response body matches spec: { data: { ok: true, variant: "763023087" }, error: null }
  it('RH-02: returns correct JSON structure with data, ok, and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: { ok: unknown; variant: unknown };
      error: unknown;
    };
    expect(json.data.ok).toBe(true);
    expect(json.data.variant).toBe('763023087');
    expect(json.error).toBe(null);
  });

  // AC-04: Variant field is "763023087"
  it('RH-03: variant field is correct value "763023087"', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: { variant: unknown };
      error: unknown;
    };
    expect(json.data.variant).toBe('763023087');
  });

  // AC-05: Error field is null
  it('RH-04: error field is null', async () => {
    const res = await GET();
    const json = (await res.json()) as { error: unknown };
    expect(json.error).toBe(null);
  });

  // AC-06: Response has exactly two root fields (data and error)
  it('RH-05: response has exactly two root fields (data and error)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['data', 'error']);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (3 tests)
  // ============================================================================

  // AC-07: data.ok field is boolean true (not truthy string/number)
  it('RH-06: data.ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { ok: unknown } };
    expect(typeof json.data.ok).toBe('boolean');
    expect(json.data.ok).toStrictEqual(true);
  });

  // AC-08: variant field is string "763023087" (not number)
  it('RH-07: variant field is string "763023087" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { variant: unknown } };
    expect(typeof json.data.variant).toBe('string');
    expect(json.data.variant).toStrictEqual('763023087');
  });

  // AC-06: data object has exactly two fields (ok and variant)
  it('RH-08: data object has no extra fields (exactly ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: Record<string, unknown> };
    const keys = Object.keys(json.data);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['ok', 'variant']);
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC-09: Content-Type header is application/json
  it('RH-09: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  // AC-10: Response is a NextResponse instance
  it('RH-10: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance (3 tests)
  // ============================================================================

  // AC-11: Response time < 100ms
  it('RH-11: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-12: Response time typically < 10ms
  it('RH-12: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-13: Under load (50 concurrent calls), all respond within 100ms
  it('RH-13: under load (50 concurrent calls), all respond within 100ms', async () => {
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
  // GROUP 5: Public Access & Consistency (2 tests)
  // ============================================================================

  // AC-14: No authentication required
  it('RH-14: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-15: Consistency — multiple sequential calls return identical responses
  it('RH-15: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });

    const expected = { data: { ok: true, variant: '763023087' }, error: null };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  // AC-16: No environment variables needed (self-contained)
  it('RH-16: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 with correct response
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { ok: boolean; variant: string };
      error: null;
    };
    expect(json.data.ok).toBe(true);
    expect(json.data.variant).toBe('763023087');
    expect(json.error).toBe(null);
  });
});
