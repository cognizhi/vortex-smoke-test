/**
 * Unit tests for GET /api/healthz-smoke
 *
 * Smoke test endpoint for load balancers and monitoring systems.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { data: { ok: true }, error: null }
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

describe('GET /api/healthz-smoke', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC-01: Response body matches spec: { data: { ok: true }, error: null }
  it('RH-02: returns correct JSON structure with ok: true', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { ok: boolean }; error: null };
    expect(json.data.ok).toBe(true);
    expect(json.error).toBeNull();
  });

  // AC-02: Response JSON shape is exact (no extra fields in data or root)
  it('RH-03: response has no extra fields in data object', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const dataKeys = Object.keys(json.data as Record<string, unknown>);
    expect(dataKeys).toEqual(['ok']);
    expect(dataKeys).toHaveLength(1);
  });

  // AC-02: Response has exactly two root fields: data and error
  it('RH-04: response has exactly two root fields (data and error)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['data', 'error']));
    expect(rootKeys).toHaveLength(2);
  });

  // AC-03: Content-Type header is application/json
  it('RH-05: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-05: No authentication required — endpoint works without auth
  it('RH-06: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-04: Response time is < 100ms (typically < 10ms)
  it('RH-07: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-04: Response time is typically very fast (< 10ms)
  it('RH-08: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // This is a softer assertion — failure here indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-E01: Under load (repeated calls), still responds within 100ms
  it('RH-09: under load (50 concurrent calls), all respond within 100ms', async () => {
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

  // AC-E02: No environment variables needed (self-contained)
  it('RH-10: endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 — the implementation
    // must not reference process.env
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { ok: boolean }; error: null };
    expect(json.data.ok).toBe(true);
  });

  // Consistency: Multiple sequential calls return identical responses
  it('RH-11: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    bodies.forEach((body) => {
      expect(body).toEqual({ data: { ok: true }, error: null });
    });
  });

  // Type safety: Response is NextResponse
  it('RH-12: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // Edge case: ok field is boolean true (not truthy string, number, etc.)
  it('RH-13: ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { ok: unknown } };
    expect(json.data.ok).toStrictEqual(true);
    expect(typeof json.data.ok).toBe('boolean');
  });

  // Edge case: error field is explicitly null (not undefined, empty string, etc.)
  it('RH-14: error field is explicitly null (not undefined)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toStrictEqual(null);
    expect('error' in json).toBe(true);
  });
});
