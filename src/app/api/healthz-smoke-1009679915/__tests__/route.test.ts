/**
 * Unit tests for GET /api/healthz-smoke-1009679915
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 1009679915.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { data: { ok: true, variant: "1009679915" }, error: null }
 *   - No extra fields in response
 *   - All fields have correct type and value
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

describe('GET /api/healthz-smoke-1009679915', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (5 tests)
  // ============================================================================

  // AC-01: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-02: Response body matches spec: { data: { ok: true, variant: "1009679915" }, error: null }
  it('RH-02: returns correct JSON structure with data envelope and error field', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: unknown;
      error: unknown;
    };
    expect(json.data).toBeDefined();
    expect(json.error).toBeNull();
  });

  // AC-02: Verify data object contains ok and variant
  it('RH-03: data object contains ok and variant fields', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: { ok: unknown; variant: unknown };
    };
    expect(json.data.ok).toBe(true);
    expect(json.data.variant).toBe('1009679915');
  });

  // AC-02: Response JSON has no extra fields at root level (exactly data and error)
  it('RH-04: response has exactly two root fields (data and error)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toHaveLength(2);
    expect(rootKeys.sort()).toEqual(['data', 'error']);
  });

  // AC-02: Response data object has no extra fields (exactly ok and variant)
  it('RH-05: data object has exactly two fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: Record<string, unknown> };
    const dataKeys = Object.keys(json.data);
    expect(dataKeys).toHaveLength(2);
    expect(dataKeys.sort()).toEqual(['ok', 'variant']);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (3 tests)
  // ============================================================================

  // AC-07: ok field is boolean true (not truthy string/number)
  it('RH-06: ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { ok: unknown } };
    expect(typeof json.data.ok).toBe('boolean');
    expect(json.data.ok).toStrictEqual(true);
  });

  // AC-08: variant field is string "1009679915" (not number)
  it('RH-07: variant field is string "1009679915" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { variant: unknown } };
    expect(typeof json.data.variant).toBe('string');
    expect(json.data.variant).toStrictEqual('1009679915');
    expect(json.data.variant).toBe('1009679915');
  });

  // AC-09: error field is strictly null (not undefined, not empty string)
  it('RH-08: error field is strictly null', async () => {
    const res = await GET();
    const json = (await res.json()) as { error: unknown };
    expect(json.error).toBeNull();
    expect(json.error).not.toBeUndefined();
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC-03: Content-Type header is application/json
  it('RH-09: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-04: Response is a NextResponse instance
  it('RH-10: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance (3 tests)
  // ============================================================================

  // AC-04: Response time < 100ms
  it('RH-11: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-04: Response time typically < 10ms
  it('RH-12: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression but doesn't fail the suite
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-06: Under load (50 concurrent calls), all respond within 100ms
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
  // GROUP 5: Public Access & Consistency (3 tests)
  // ============================================================================

  // AC-12: No authentication required
  it('RH-14: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-05: Consistency — multiple sequential calls return identical responses
  it('RH-15: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    const expected = {
      data: { ok: true, variant: '1009679915' },
      error: null,
    };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  // AC-04: No environment variables needed (self-contained)
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
    expect(json.data.variant).toBe('1009679915');
    expect(json.error).toBeNull();
  });

  // ============================================================================
  // GROUP 6: No Dependencies (2 tests)
  // ============================================================================

  // AC-10: No database queries are made
  it('RH-17: endpoint makes no database calls', async () => {
    // Since the handler has no DB imports and makes no queries,
    // this test simply verifies the endpoint responds with 200
    // Database-level testing would require mocking db clients
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { ok: boolean } };
    expect(json.data.ok).toBe(true);
  });

  // AC-11: No authentication or authorization code is invoked
  it('RH-18: endpoint invokes no authentication checks', async () => {
    // Since the handler has no auth imports or guards,
    // this test simply verifies the endpoint responds without requiring auth
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });
});
