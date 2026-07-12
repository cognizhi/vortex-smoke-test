/**
 * Unit tests for GET /api/healthz-smoke-43762983-c
 *
 * Comprehensive test harness for smoke test endpoint variant.
 * 14 test cases covering:
 *   - Correctness (HTTP status, JSON structure)
 *   - Type safety (field types)
 *   - HTTP headers and metadata
 *   - Performance (single call, sequential, concurrent load)
 *   - Public access and consistency
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after test environment setup
import { GET } from '../route';

describe('GET /api/healthz-smoke-43762983-c', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ====== CORRECTNESS CATEGORY (4 tests) ======

  /**
   * RH-01: Returns HTTP 200 status
   * Verifies the endpoint responds with HTTP 200 OK status code
   */
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  /**
   * RH-02: Response body matches spec { ok: true, variant: "43762983" }
   * Verifies the JSON response has correct fields with correct values
   */
  it('RH-02: returns correct JSON structure { ok: true, variant: "43762983" }', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('43762983');
  });

  /**
   * RH-03: Content-Type header is application/json
   * Verifies the response has correct Content-Type header
   */
  it('RH-03: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  /**
   * RH-04: Response status is success (res.ok === true)
   * Verifies the Response.ok property is true (2xx status range)
   */
  it('RH-04: response status is success (res.ok === true)', async () => {
    const res = await GET();
    expect(res.ok).toBe(true);
  });

  // ====== TYPE SAFETY CATEGORY (2 tests) ======

  /**
   * RH-05: Field `ok` is boolean (not string, number, or null)
   * Verifies type safety of the ok field
   */
  it('RH-05: field ok is boolean type with value true', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(typeof json.ok).toBe('boolean');
    expect(json.ok).toBe(true);
  });

  /**
   * RH-06: Field `variant` is string (not number or object)
   * Verifies type safety of the variant field
   */
  it('RH-06: field variant is string type with value exactly "43762983"', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toBe('43762983');
  });

  // ====== HTTP HEADERS & METADATA CATEGORY (2 tests) ======

  /**
   * RH-07: Response is NextResponse instance
   * Verifies the response object type
   */
  it('RH-07: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  /**
   * RH-08: Response has no authentication-related headers
   * Verifies no WWW-Authenticate or Set-Cookie headers
   */
  it('RH-08: response has no authentication-related headers', async () => {
    const res = await GET();
    expect(res.headers.get('WWW-Authenticate')).toBeNull();
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  // ====== PERFORMANCE CATEGORY (3 tests) ======

  /**
   * RH-09: Single call response time < 100ms
   * Measures performance of a single endpoint call
   */
  it('RH-09: single call response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  /**
   * RH-10: Sequential calls (3×) all < 100ms
   * Verifies consistent performance across multiple sequential calls
   */
  it('RH-10: sequential calls (3x) all respond in less than 100ms', async () => {
    const timings: number[] = [];

    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();
      await GET();
      const endTime = performance.now();
      timings.push(endTime - startTime);
    }

    timings.forEach(timing => {
      expect(timing).toBeLessThan(100);
    });
  });

  /**
   * RH-11: Under concurrent load (50 calls), all complete within 100ms
   * Verifies performance under parallel load
   */
  it('RH-11: under concurrent load (50 calls), all complete within 100ms', async () => {
    const promises = Array.from({ length: 50 }, () => {
      const startTime = performance.now();
      return GET().then(res => {
        const endTime = performance.now();
        return { res, elapsed: endTime - startTime };
      });
    });

    const results = await Promise.all(promises);

    results.forEach(({ res, elapsed }) => {
      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(100);
    });
  });

  // ====== PUBLIC ACCESS & CONSISTENCY CATEGORY (3 tests) ======

  /**
   * RH-12: No authentication required
   * Verifies the endpoint is publicly accessible without auth
   */
  it('RH-12: endpoint requires no authentication', async () => {
    // Call GET without any auth headers/cookies
    // If endpoint was protected, this would fail or return 401/403
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  /**
   * RH-13: Multiple sequential calls return identical responses
   * Verifies consistency and determinism across calls
   */
  it('RH-13: multiple sequential calls return identical responses', async () => {
    const res1 = await GET();
    const res2 = await GET();
    const res3 = await GET();

    const json1 = (await res1.json()) as { ok: boolean; variant: string };
    const json2 = (await res2.json()) as { ok: boolean; variant: string };
    const json3 = (await res3.json()) as { ok: boolean; variant: string };

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    expect(json1).toEqual({ ok: true, variant: '43762983' });
    expect(json2).toEqual({ ok: true, variant: '43762983' });
    expect(json3).toEqual({ ok: true, variant: '43762983' });
  });

  /**
   * RH-14: Variant identifier is exactly "43762983"
   * Verifies the specific variant is returned (not "43762983-c" or other variants)
   */
  it('RH-14: variant identifier is exactly "43762983"', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };

    // Verify exact match — not "43762983-c", not different variant
    expect(json.variant).toBe('43762983');
    expect(json.variant).not.toBe('43762983-c');
    expect(json.variant).length(8); // Verify it's exactly 8 characters
  });
});
