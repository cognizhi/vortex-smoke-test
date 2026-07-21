/**
 * Regression Test: VRTX-0559 - /api/healthz-smoke-bugfix2-589426407 returns 404 instead of 200
 *
 * Bug: API health check endpoint returns 404 instead of 200 with correct JSON response.
 * Root Cause: Missing route handler file at src/app/api/healthz-smoke-bugfix2-589426407/route.ts
 * Fix: Created the route handler file with proper Next.js App Router implementation.
 *
 * This test verifies that:
 * 1. The endpoint exists and is callable
 * 2. It returns HTTP 200 status
 * 3. It returns the correct JSON response with variant identifier "589426407"
 * 4. The response structure matches the specification exactly
 * 5. The Content-Type header is application/json
 * 6. The endpoint handles concurrent requests correctly
 */
import { describe, it, expect } from 'vitest';
import { GET } from '../../app/api/healthz-smoke-bugfix2-589426407/route';

describe('REGRESSION: VRTX-0559 - API health check endpoint /api/healthz-smoke-bugfix2-589426407', () => {
  it('endpoint exists and is callable', async () => {
    const res = await GET();
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('returns 200 OK status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('returns JSON response with ok=true and variant=589426407', async () => {
    const res = await GET();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('589426407');
  });

  it('returns exactly {"ok":true,"variant":"589426407"} with no extra fields', async () => {
    const res = await GET();
    const json = await res.json();
    // Ensure no extra fields
    expect(Object.keys(json).sort()).toEqual(['ok', 'variant'].sort());
    expect(json).toEqual({
      ok: true,
      variant: '589426407',
    });
  });

  it('has correct Content-Type header (application/json)', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
  });

  it('responds quickly (under 100ms typical)', async () => {
    const startTime = Date.now();
    const res = await GET();
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Response should be very fast (typically < 10ms)
    // Allow generous margin for test environment
    expect(responseTime).toBeLessThan(100);
    expect(res.status).toBe(200);
  });

  it('handles concurrent requests correctly (10 parallel calls)', async () => {
    const calls = Array.from({ length: 10 }, () => GET());
    const results = await Promise.all(calls);

    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  it('response is idempotent (multiple calls return identical results)', async () => {
    const res1 = await GET();
    const json1 = await res1.json();

    const res2 = await GET();
    const json2 = await res2.json();

    expect(json1).toEqual(json2);
    expect(res1.status).toBe(res2.status);
  });
});
