/**
 * Unit tests for GET /api/healthz-smoke-bugfix-ha-609817388
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 609817388.
 *
 * REGRESSION TEST for VRTX-0477: Verifies that /healthz-smoke-bugfix-ha-609817388
 * returns 200 with correct JSON structure, not 404.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "609817388" }
 *   - Variant identifier matches spec
 */
import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';

describe('GET /api/healthz-smoke-bugfix-ha-609817388', () => {
  // AC-01: Returns HTTP 200 status
  it('returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-02: Response body matches spec: { ok: true, variant: "609817388" }
  it('returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      ok: unknown;
      variant: unknown;
    };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('609817388');
  });

  // AC-03: variant field is string "609817388"
  it('variant field is string "609817388" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toStrictEqual('609817388');
  });

  // AC-04: Content-Type header is application/json
  it('Content-Type header is application/json', async () => {
    const res = await GET();
    const contentType = res.headers.get('Content-Type');
    expect(contentType).toMatch(/^application\/json/);
  });

  // AC-05: Response is NextResponse instance
  it('response is NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // AC-06: Multiple calls return identical responses
  it('multiple calls return consistent response', async () => {
    const res1 = await GET();
    const json1 = (await res1.json()) as { ok: unknown; variant: unknown };

    const res2 = await GET();
    const json2 = (await res2.json()) as { ok: unknown; variant: unknown };

    expect(json1).toEqual(json2);
    expect(json1.variant).toBe('609817388');
    expect(json2.variant).toBe('609817388');
  });

  // AC-07: Handles concurrent load
  it('handles simulated load of 50 concurrent requests', async () => {
    const promises = Array.from({ length: 50 }, () => GET());
    const responses = await Promise.all(promises);

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
    });
  });
});
