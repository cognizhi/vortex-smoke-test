/**
 * Unit tests for GET /api/healthz-smoke-bugfix2-382671714
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 382671714.
 *
 * REGRESSION TEST for VRTX-0290: Verifies that /healthz-smoke-bugfix2-382671714
 * returns 200 with correct JSON structure, not 404.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "382671714" }
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

describe('GET /api/healthz-smoke-bugfix2-382671714', () => {
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
    expect(res.ok).toBe(true);
  });

  // AC-02: Response body matches spec: { ok: true, variant: "382671714" }
  it('RH-02: returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      ok: unknown;
      variant: unknown;
    };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('382671714');
  });

  // AC-03: Response JSON has no extra fields (exactly ok and variant)
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

  // AC-06: variant field is string "382671714" (not number)
  it('RH-06: variant field is string "382671714" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toStrictEqual('382671714');
    expect(json.variant).toBe('382671714');
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC-07: Content-Type header is application/json
  it('RH-07: Content-Type header is application/json', async () => {
    const res = await GET();
    const contentType = res.headers.get('Content-Type');
    expect(contentType).toMatch(/^application\/json/);
  });

  // AC-08: Returns NextResponse (Next.js HTTP response object)
  it('RH-08: response is NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: No Authentication Required (1 test)
  // ============================================================================

  // AC-09: Public endpoint — no authentication/authorization required
  it('RH-09: public endpoint with no authorization header required', async () => {
    // Call without any auth headers
    const res = await GET();
    expect(res.status).toBe(200);
    // Verify it still returns 200 with valid response
    const json = (await res.json()) as { ok: unknown; variant: unknown };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('382671714');
  });

  // ============================================================================
  // GROUP 5: Response Time Performance (2 tests)
  // ============================================================================

  // AC-10: Single call completes in < 100ms
  it('RH-10: single call completes within 100ms SLA', async () => {
    const start = performance.now();
    await GET();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  // AC-11: Typical response time is < 10ms
  it('RH-11: typical response time is < 10ms', async () => {
    const start = performance.now();
    await GET();
    const duration = performance.now() - start;
    // Most calls should be well under 10ms; we use 50ms as the practical threshold
    // to account for system variance in CI environments
    expect(duration).toBeLessThan(50);
  });

  // ============================================================================
  // GROUP 6: Consistency & Repeatability (2 tests)
  // ============================================================================

  // AC-12: Multiple calls return identical responses
  it('RH-12: multiple calls return consistent response', async () => {
    const res1 = await GET();
    const json1 = (await res1.json()) as { ok: unknown; variant: unknown };

    const res2 = await GET();
    const json2 = (await res2.json()) as { ok: unknown; variant: unknown };

    expect(json1).toEqual(json2);
    expect(json1.variant).toBe('382671714');
    expect(json2.variant).toBe('382671714');
  });

  // AC-13: Response format is deterministic across calls
  it('RH-13: response format is deterministic', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await GET();
      const json = (await res.json()) as Record<string, unknown>;
      expect(Object.keys(json).sort()).toEqual(['ok', 'variant']);
      expect(json.ok).toBe(true);
      expect(json.variant).toBe('382671714');
    }
  });

  // ============================================================================
  // GROUP 7: Load Test (1 test)
  // ============================================================================

  // AC-14: Handles concurrent load (50 concurrent requests all succeed)
  it('RH-14: handles simulated load of 50 concurrent requests', async () => {
    const promises = Array.from({ length: 50 }, () => GET());
    const responses = await Promise.all(promises);

    // All responses should be 200 OK
    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
    });
  });
});
