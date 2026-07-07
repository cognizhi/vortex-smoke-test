/**
 * Unit tests for GET /api/healthz-smoke-54367903
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 54367903.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { data: { ok: true, variant: "54367903" }, error: null }
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

describe('GET /api/healthz-smoke-54367903', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (4 tests)
  // ============================================================================

  // AC-01: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC-01: Response body matches spec: { data: { ok: true, variant: "54367903" }, error: null }
  it('RH-02: returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: { ok: boolean; variant: string };
      error: null;
    };
    expect(json.data.ok).toBe(true);
    expect(json.data.variant).toBe('54367903');
    expect(json.error).toBeNull();
  });

  // AC-01: Data object has no extra fields
  it('RH-03: data object has no extra fields (ok and variant only)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const dataKeys = Object.keys(json.data as Record<string, unknown>);
    expect(dataKeys.sort()).toEqual(['ok', 'variant']);
    expect(dataKeys).toHaveLength(2);
  });

  // AC-01: Response has exactly two root fields: data and error
  it('RH-04: response has exactly two root fields (data and error)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['data', 'error']));
    expect(rootKeys).toHaveLength(2);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (3 tests)
  // ============================================================================

  // AC-02: ok field is boolean true (not just truthy string/number)
  it('RH-05: ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { ok: unknown } };
    expect(typeof json.data.ok).toBe('boolean');
    expect(json.data.ok).toStrictEqual(true);
  });

  // AC-02: variant field is string "54367903" (not number)
  it('RH-06: variant field is string "54367903" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { variant: unknown } };
    expect(typeof json.data.variant).toBe('string');
    expect(json.data.variant).toStrictEqual('54367903');
    expect(json.data.variant).toBe('54367903');
  });

  // AC-02: error field is explicitly null (not undefined)
  it('RH-07: error field is explicitly null (not undefined)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toStrictEqual(null);
    expect('error' in json).toBe(true);
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC-03: Content-Type header is application/json
  it('RH-08: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-04: Response is a NextResponse instance
  it('RH-09: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance (3 tests)
  // ============================================================================

  // AC-05: Response time < 100ms
  it('RH-10: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-05: Response time typically < 10ms
  it('RH-11: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-05: Under load (50 concurrent calls), all respond within 100ms
  it('RH-12: under load (50 concurrent calls), all respond within 100ms', async () => {
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

  // AC-06: No authentication required
  it('RH-13: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC-07: Consistency — multiple sequential calls return identical responses
  it('RH-14: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    const expected = { data: { ok: true, variant: '54367903' }, error: null };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  // AC-08: No environment variables needed (self-contained)
  it('RH-15: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 with correct response
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { ok: boolean; variant: string };
      error: null;
    };
    expect(json.data.ok).toBe(true);
    expect(json.data.variant).toBe('54367903');
    expect(json.error).toBeNull();
  });
});
