/**
 * Regression Test: VRTX-0470 - /api/healthz-smoke-bugfix-ha2-244944780 returns 404 instead of 200
 *
 * Bug: API health check endpoint returns 404 instead of 200 with correct JSON response.
 * Root Cause: The endpoint file is missing from the codebase.
 * Fix Verification: Create the missing endpoint file and verify it returns the correct response.
 *
 * This test verifies that:
 * 1. The endpoint exists and is callable
 * 2. It returns HTTP 200 status
 * 3. It returns the correct JSON response with variant identifier "244944780"
 * 4. The response structure matches the specification exactly
 */
import { describe, it, expect } from 'vitest';
import { GET as getHa2244944780 } from '../../app/api/healthz-smoke-bugfix-ha2-244944780/route';

describe('REGRESSION: VRTX-0470 - API health check endpoint /api/healthz-smoke-bugfix-ha2-244944780', () => {
  it('endpoint exists and responds to ha2-244944780 variant', async () => {
    const res = await getHa2244944780();
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('returns 200 OK for /api/healthz-smoke-bugfix-ha2-244944780', async () => {
    const res = await getHa2244944780();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('244944780');
  });

  it('returns exactly {"ok":true,"variant":"244944780"} for ha2-244944780 variant', async () => {
    const res = await getHa2244944780();
    const json = await res.json();
    // Ensure no extra fields
    expect(Object.keys(json).sort()).toEqual(['ok', 'variant'].sort());
    expect(json).toEqual({
      ok: true,
      variant: '244944780',
    });
  });

  it('has correct Content-Type header', async () => {
    const res = await getHa2244944780();
    expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
  });

  it('returns 200 under load (multiple concurrent calls)', async () => {
    const calls = Array.from({ length: 10 }, () => getHa2244944780());
    const results = await Promise.all(calls);

    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });
});
