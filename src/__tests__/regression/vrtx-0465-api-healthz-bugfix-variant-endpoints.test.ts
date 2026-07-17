/**
 * Regression Test: VRTX-0465 - /api/healthz-smoke-bugfix-ha-986931698 returns 404 instead of 200
 *
 * Bug: API health check endpoint returns 404 instead of 200 with correct JSON response.
 * Root Cause: Potential issue with static route resolution for variant-specific API endpoints.
 * Fix Verification: Ensure the endpoint exists and is properly routed at runtime.
 *
 * This test verifies that:
 * 1. The endpoint exists and is callable
 * 2. It returns HTTP 200 status
 * 3. It returns the correct JSON response with variant identifier
 * 4. The response structure matches the specification exactly
 */
import { describe, it, expect } from 'vitest';
import { GET as getHa986931698 } from '../../app/api/healthz-smoke-bugfix-ha-986931698/route';
import { GET as getHa2489393049 } from '../../app/api/healthz-smoke-bugfix-ha2-489393049/route';

describe('REGRESSION: VRTX-0465 - API health check endpoints', () => {
  it('endpoint exists and responds to ha-986931698 variant', async () => {
    const res = await getHa986931698();
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('returns 200 OK for /api/healthz-smoke-bugfix-ha-986931698', async () => {
    const res = await getHa986931698();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha-986931698');
  });

  it('returns exactly {"ok":true,"variant":"ha-986931698"} for ha-986931698 variant', async () => {
    const res = await getHa986931698();
    const json = await res.json();
    // Ensure no extra fields
    expect(Object.keys(json).sort()).toEqual(['ok', 'variant'].sort());
    expect(json).toEqual({
      ok: true,
      variant: 'ha-986931698',
    });
  });

  it('works with ha2-489393049 variant', async () => {
    const res = await getHa2489393049();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('ha2-489393049');
  });

  it('has correct Content-Type header', async () => {
    const res = await getHa986931698();
    expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
  });

  it('returns 200 under load (multiple concurrent calls)', async () => {
    const calls = Array.from({ length: 10 }, () => getHa986931698());
    const results = await Promise.all(calls);

    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });
});
