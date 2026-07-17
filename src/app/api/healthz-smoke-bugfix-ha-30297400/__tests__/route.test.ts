import { describe, it, expect } from 'vitest';
import { GET } from '../route';

/**
 * Regression test for VRTX-0469
 *
 * Verifies that the /api/healthz-smoke-bugfix-ha-30297400 endpoint:
 * - Returns HTTP 200 status code
 * - Returns valid JSON response
 * - Includes "ok": true in the response
 * - Includes the correct variant ID "30297400" in the response
 *
 * This test ensures that the health check endpoint for variant 30297400
 * is properly implemented and returns the expected format for deployment
 * verification systems.
 */
describe('GET /api/healthz-smoke-bugfix-ha-30297400', () => {
  it('should return 200 status code', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('should return JSON response with ok: true', async () => {
    const response = await GET();
    const json = (await response.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
  });

  it('should return correct variant identifier', async () => {
    const response = await GET();
    const json = (await response.json()) as { ok: boolean; variant: string };
    expect(json.variant).toBe('30297400');
  });

  it('should return expected response structure', async () => {
    const response = await GET();
    const json = await response.json();
    expect(json).toEqual({
      ok: true,
      variant: '30297400',
    });
  });

  it('should have correct content type', async () => {
    const response = await GET();
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });
});
