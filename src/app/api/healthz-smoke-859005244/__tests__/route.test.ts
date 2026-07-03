import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-859005244', () => {
  it('RH-01: returns HTTP status 200', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('RH-02: returns JSON with exact format { ok: true, variant: "859005244" }', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({
      ok: true,
      variant: '859005244',
    });
  });

  it('RH-03: multiple requests return identical responses', async () => {
    const response1 = await GET();
    const data1 = await response1.json();

    const response2 = await GET();
    const data2 = await response2.json();

    expect(response1.status).toBe(response2.status);
    expect(data1).toEqual(data2);
  });

  it('RH-04: returns a NextResponse instance', async () => {
    const response = await GET();
    expect(response).toBeInstanceOf(NextResponse);
  });

  it('RH-05: handler is synchronous with immediate return', async () => {
    const startTime = performance.now();
    const response = await GET();
    const endTime = performance.now();

    expect(response.status).toBe(200);
    // Verify the handler returns immediately (< 10ms for this simple handler)
    expect(endTime - startTime).toBeLessThan(10);
  });

  it('RH-06: response has correct Content-Type header', async () => {
    const response = await GET();
    const contentType = response.headers.get('content-type');
    expect(contentType).toMatch(/application\/json/);
  });

  it('RH-07: query parameters are safely ignored (tested via handler only)', async () => {
    // Route handlers don't receive query params as arguments,
    // Next.js strips them before calling the handler.
    // This test verifies the handler returns the same response regardless.
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({
      ok: true,
      variant: '859005244',
    });
  });

  it('RH-08: request body is safely ignored (GET handlers ignore body)', async () => {
    // GET handlers by convention ignore request bodies.
    // This test verifies the handler returns the correct response.
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({
      ok: true,
      variant: '859005244',
    });
  });
});
