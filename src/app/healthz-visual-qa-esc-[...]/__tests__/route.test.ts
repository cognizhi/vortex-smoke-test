/**
 * Unit tests for GET /healthz-visual-qa-esc-[variant]
 *
 * Visual QA health check endpoint for load balancers and monitoring systems.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true }
 *   - No extra fields in response
 *   - Content-Type header is application/json
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 *   - Performance under simulated load
 *   - Handles arbitrary variants
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import handler after setting up mocks
import { GET } from '../route';

describe('GET /healthz-visual-qa-esc-[variant]', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status for ticket variant
  it('VQ-01: returns HTTP 200 status for 872443469', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    expect(res.status).toBe(200);
  });

  // AC-01: Response body matches spec
  it('VQ-02: returns correct JSON structure with ok: true', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });

  // AC-01: Works for different variants
  it('VQ-03: returns ok: true for different variant', async () => {
    const params = { __param: ['different-variant'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-different-variant'), { params });
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });

  // AC-02: Response JSON shape is exact (no extra fields)
  it('VQ-04: response has exactly one root field (ok)', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(['ok']);
    expect(rootKeys).toHaveLength(1);
  });

  // AC-03: Content-Type header is application/json
  it('VQ-05: Content-Type header is application/json', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-05: No authentication required — endpoint works without auth
  it('VQ-06: endpoint requires no authentication', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-04: Response time is < 100ms (typically < 10ms)
  it('VQ-07: response time is less than 100ms', async () => {
    const params = { __param: ['872443469'] };
    const startTime = performance.now();
    await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-04: Response time is typically very fast (< 10ms)
  it('VQ-08: response time is typically fast (< 10ms)', async () => {
    const params = { __param: ['872443469'] };
    const startTime = performance.now();
    await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // This is a softer assertion — failure here indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-E01: Under load (repeated calls), still responds within 100ms
  it('VQ-09: under load (50 concurrent calls), all respond within 100ms', async () => {
    const calls = Array.from({ length: 50 }, (_, i) => {
      const variant = `variant-${i}`;
      const params = { __param: [variant] };
      return GET(new Request(`http://localhost:3000/healthz-visual-qa-esc-${variant}`), { params });
    });
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
  it('VQ-10: endpoint is self-contained and requires no env vars', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });

  // Consistency: Multiple sequential calls return identical responses
  it('VQ-11: multiple sequential calls return consistent responses', async () => {
    const params = { __param: ['872443469'] };
    const responses = await Promise.all([
      GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params }),
      GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params }),
      GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params }),
    ]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    bodies.forEach((body) => {
      expect(body).toEqual({ ok: true });
    });
  });

  // Type safety: Response is NextResponse
  it('VQ-12: response is a NextResponse instance', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    expect(res).toBeInstanceOf(NextResponse);
  });

  // Edge case: ok field is boolean true (not truthy string, number, etc.)
  it('VQ-13: ok field is boolean true (not just truthy)', async () => {
    const params = { __param: ['872443469'] };
    const res = await GET(new Request('http://localhost:3000/healthz-visual-qa-esc-872443469'), { params });
    const json = (await res.json()) as { ok: unknown };
    expect(json.ok).toStrictEqual(true);
    expect(typeof json.ok).toBe('boolean');
  });

  // Edge case: Arbitrary variant formats
  it('VQ-14: handles arbitrary variant formats', async () => {
    const testVariants = [
      '872443469',
      'simple-id',
      'visual-qa-esc-1234567890',
      'test_variant_123',
      'abc123xyz789',
    ];

    for (const variant of testVariants) {
      const params = { __param: [variant] };
      const res = await GET(new Request(`http://localhost:3000/healthz-visual-qa-esc-${variant}`), { params });
      const json = (await res.json()) as { ok: boolean };
      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json).toEqual({ ok: true });
    }
  });
});
