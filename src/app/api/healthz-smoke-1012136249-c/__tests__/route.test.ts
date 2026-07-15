import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/healthz-smoke-1012136249-c', () => {
  // Test 1: Handler exports GET function
  it('exports GET function', () => {
    expect(typeof GET).toBe('function');
  });

  // Test 2: GET returns status 200
  it('returns status 200', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  // Test 3: Response body contains ok: true
  it('response body contains ok: true', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  // Test 4: Response body contains variant: "1012136249"
  it('response body contains variant: "1012136249"', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.variant).toBe('1012136249');
  });

  // Test 5: Response is valid JSON
  it('response is valid JSON', async () => {
    const response = await GET();
    expect(() => response.json()).not.toThrow();
  });

  // Test 6: Response has correct Content-Type header
  it('response has correct Content-Type header', async () => {
    const response = await GET();
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  // Test 7: No request body is required
  it('no request body is required', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  // Test 8: Response structure matches exact spec
  it('response structure matches exact spec', async () => {
    const response = await GET();
    const data = await response.json();
    expect(Object.keys(data).sort()).toEqual(['ok', 'variant'].sort());
  });

  // Test 9: Response time is acceptable (typically < 10ms)
  it('response time is acceptable', async () => {
    const startTime = Date.now();
    await GET();
    const endTime = Date.now();
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100);
  });

  // Test 10: Responses are deterministic (multiple calls return same result)
  it('responses are deterministic', async () => {
    const response1 = await GET();
    const data1 = await response1.json();

    const response2 = await GET();
    const data2 = await response2.json();

    expect(data1).toEqual(data2);
  });

  // Test 11: Variant is string type
  it('variant is string type', async () => {
    const response = await GET();
    const data = await response.json();
    expect(typeof data.variant).toBe('string');
  });

  // Test 12: ok property is boolean type
  it('ok property is boolean type', async () => {
    const response = await GET();
    const data = await response.json();
    expect(typeof data.ok).toBe('boolean');
  });

  // Test 13: Returns NextResponse instance
  it('returns NextResponse instance', async () => {
    const response = await GET();
    expect(response.constructor.name).toBe('NextResponse');
  });

  // Test 14: Response body is not empty
  it('response body is not empty', async () => {
    const response = await GET();
    const data = await response.json();
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });

  // Test 15: Multiple sequential calls maintain consistency
  it('multiple sequential calls maintain consistency', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const dataArray = await Promise.all(responses.map((r) => r.json()));

    dataArray.forEach((data) => {
      expect(data.ok).toBe(true);
      expect(data.variant).toBe('1012136249');
    });
  });
});
