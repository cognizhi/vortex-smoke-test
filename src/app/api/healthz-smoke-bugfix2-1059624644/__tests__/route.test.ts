/**
 * Unit tests for GET /api/healthz-smoke-bugfix2-1059624644
 *
 * Smoke test endpoint variant for load balancers and monitoring systems.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "1059624644" }
 *   - No authentication required
 *   - Response time < 100ms
 *   - Content-Type header is application/json
 *   - Consistency under repeated calls
 *   - Response is NextResponse instance
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';

describe('GET /api/healthz-smoke-bugfix2-1059624644', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC-02: Response body matches spec: { ok: true, variant: "1059624644" }
  it('RH-02: returns correct JSON structure with ok: true and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('1059624644');
  });

  // AC-03: Content-Type header is application/json
  it('RH-03: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  // AC-04: No authentication required — endpoint works without auth
  it('RH-04: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-07: Response is consistent across calls
  it('RH-05: multiple sequential calls return consistent responses', async () => {
    const res1 = await GET();
    const res2 = await GET();
    const res3 = await GET();

    const json1 = (await res1.json()) as { ok: boolean; variant: string };
    const json2 = (await res2.json()) as { ok: boolean; variant: string };
    const json3 = (await res3.json()) as { ok: boolean; variant: string };

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    expect(json1).toEqual({ ok: true, variant: '1059624644' });
    expect(json2).toEqual({ ok: true, variant: '1059624644' });
    expect(json3).toEqual({ ok: true, variant: '1059624644' });
  });

  // Type safety: Response is NextResponse
  it('RH-06: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // AC-06: Response time is < 100ms
  it('RH-07: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });
});
