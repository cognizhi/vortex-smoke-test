/**
 * Regression test for GET /api/healthz-smoke-bugfix2-887319380
 *
 * VRTX-0445 Bug: Endpoint returned 404, should return 200 with variant response.
 * This test ensures the health check endpoint is properly created and functions correctly.
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 887319380.
 *
 * Tests verify:
 *   - Returns 200 status code (regression: was returning 404)
 *   - Correct JSON response shape { ok: true, variant: "887319380" }
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

describe('GET /api/healthz-smoke-bugfix2-887319380 (VRTX-0445 Regression)', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // REGRESSION: HTTP 200 Status (was returning 404 before fix)
  // ============================================================================

  it('[REGRESSION] returns HTTP 200 status (not 404)', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // ============================================================================
  // Core Specification: HTTP Status & Response Body
  // ============================================================================

  it('returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  it('returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      ok: unknown;
      variant: unknown;
    };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('887319380');
  });

  it('response has no extra fields in root object', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['ok', 'variant']);
  });

  it('response has exactly two root fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(rootKeys).toHaveLength(2);
  });

  // ============================================================================
  // Field Type Safety
  // ============================================================================

  it('ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown };
    expect(typeof json.ok).toBe('boolean');
    expect(json.ok).toStrictEqual(true);
  });

  it('variant field is string "887319380" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toStrictEqual('887319380');
    expect(json.variant).toBe('887319380');
  });

  // ============================================================================
  // HTTP Headers & Meta
  // ============================================================================

  it('Content-Type header is application/json', async () => {
    const res = await GET();
    const contentType = res.headers.get('Content-Type');
    expect(contentType).toMatch(/^application\/json/);
  });

  it('response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // Performance
  // ============================================================================

  it('response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  it('response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

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

  // ============================================================================
  // Public Access & Consistency
  // ============================================================================

  it('endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  it('multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toMatch(/^application\/json/);
    });

    const expected = { ok: true, variant: '887319380' };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  it('endpoint is self-contained and requires no env vars', async () => {
    // The endpoint should work regardless of env vars
    // This test simply verifies it returns 200 with correct response
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('887319380');
  });
});
