/**
 * Unit tests for GET /api/healthz-smoke-48842051
 *
 * Smoke test endpoint for load balancers and monitoring systems.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "48842051" }
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

describe('GET /api/healthz-smoke-48842051', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // TC-001: Returns HTTP 200 status
  it('TC-001: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // TC-002: ok field is boolean true
  it('TC-002: ok field is boolean true', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(typeof json.ok).toBe('boolean');
  });

  // TC-003: variant field is string "48842051"
  it('TC-003: variant field is string "48842051"', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.variant).toBe('48842051');
    expect(typeof json.variant).toBe('string');
  });

  // TC-004: Response is valid JSON
  it('TC-004: response is valid JSON', async () => {
    const res = await GET();
    const json = await res.json();
    expect(json).toBeDefined();
    expect(typeof json).toBe('object');
  });

  // TC-005: Response has exactly 2 fields
  it('TC-005: response has exactly 2 fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toHaveLength(2);
    expect(keys).toEqual(expect.arrayContaining(['ok', 'variant']));
  });

  // TC-006: No extra fields in response
  it('TC-006: no extra fields in response', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys.sort()).toEqual(['ok', 'variant'].sort());
  });

  // TC-007: Content-Type header is application/json
  it('TC-007: Content-Type header is application/json', async () => {
    const res = await GET();
    const contentType = res.headers.get('Content-Type') || '';
    expect(contentType).toContain('application/json');
  });

  // TC-008: Field types are correct
  it('TC-008: field types are correct (ok=boolean, variant=string)', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown; variant: unknown };
    expect(typeof json.ok).toBe('boolean');
    expect(typeof json.variant).toBe('string');
  });

  // TC-009: No authentication required
  it('TC-009: endpoint requires no authentication', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // TC-010: No authorization checks
  it('TC-010: endpoint works without cookies or session', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });

  // TC-011: Accessible without session
  it('TC-011: endpoint accessible with empty headers', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // TC-012: Response time < 100ms
  it('TC-012: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // TC-013: Consistent response
  it('TC-013: multiple sequential calls return consistent responses', async () => {
    const res1 = await GET();
    const res2 = await GET();
    const res3 = await GET();

    const json1 = (await res1.json()) as { ok: boolean; variant: string };
    const json2 = (await res2.json()) as { ok: boolean; variant: string };
    const json3 = (await res3.json()) as { ok: boolean; variant: string };

    expect(json1).toEqual(json2);
    expect(json2).toEqual(json3);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
  });

  // TC-014: Concurrent load (50 calls)
  it('TC-014: under load (50 concurrent calls), all respond with 200', async () => {
    const calls = Array.from({ length: 50 }, () => GET());
    const results = await Promise.all(calls);

    // Check all responded with 200
    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  // TC-015: Concurrent response time
  it('TC-015: under load (50 concurrent calls), all complete within reasonable time', async () => {
    const calls = Array.from({ length: 50 }, () => GET());
    const startTime = performance.now();
    const results = await Promise.all(calls);
    const endTime = performance.now();

    const totalElapsedMs = endTime - startTime;
    // Allow 5 seconds for 50 concurrent calls
    expect(totalElapsedMs).toBeLessThan(5000);

    // Verify all responses are valid
    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  // TC-016: No environment variables needed
  it('TC-016: endpoint is self-contained and requires no env vars', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('48842051');
  });

  // TC-017: No database connection
  it('TC-017: endpoint works without database', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
  });

  // TC-018: Works in test environment
  it('TC-018: works in test environment', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('48842051');
  });

  // Type safety: Response is NextResponse
  it('additional: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // Response shape check
  it('additional: response has exact shape { ok: true, variant: "48842051" }', async () => {
    const res = await GET();
    const json = await res.json();
    expect(json).toEqual({ ok: true, variant: '48842051' });
  });

  // Typical response time < 10ms
  it('additional: response time is typically very fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // This is a softer assertion — failure here indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });
});
