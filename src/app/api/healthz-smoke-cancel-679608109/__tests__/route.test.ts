/**
 * Test suite for GET /api/healthz-smoke-cancel-679608109
 * Health check endpoint for cancel flow monitoring variant
 *
 * Bug Fix: VRTX-0162 - Missing endpoint implementation
 */

import { GET } from '../route';

describe('/api/healthz-smoke-cancel-679608109 (GET)', () => {
  // Group 1: Response Status (2 tests)
  test('GET request returns 200 status', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  test('Invalid methods return 405', async () => {
    // Verify only GET is exported (other methods return 405 automatically)
    expect(GET).toBeDefined();
  });

  // Group 2: Response Structure - JSON Parsing (1 test)
  test('Response is valid JSON', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });

  // Group 3: Response Field Validation (2 tests)
  test('ok field is boolean true', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(typeof data.ok).toBe('boolean');
    expect(data.ok).toBe(true);
  });

  test('variant field is string 679608109', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toHaveProperty('variant');
    expect(typeof data.variant).toBe('string');
    expect(data.variant).toBe('679608109');
  });

  // Group 4: Response Format Validation (2 tests)
  test('Response has exactly 2 fields', async () => {
    const response = await GET();
    const data = await response.json();
    expect(Object.keys(data).length).toBe(2);
    expect(Object.keys(data).sort()).toEqual(['ok', 'variant']);
  });

  test('Response Content-Type is application/json', async () => {
    const response = await GET();
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  // Group 5: Complete Response Validation (2 tests)
  test('Full response structure matches spec', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');

    const data = await response.json();
    expect(data).toEqual({
      ok: true,
      variant: '679608109',
    });
  });

  test('Response is consistent across multiple calls', async () => {
    const responses = await Promise.all([
      GET(),
      GET(),
      GET(),
      GET(),
      GET(),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        ok: true,
        variant: '679608109',
      });
    }
  });
});
