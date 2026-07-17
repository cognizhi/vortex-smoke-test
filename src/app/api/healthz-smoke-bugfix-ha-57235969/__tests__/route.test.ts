import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/healthz-smoke-bugfix-ha-57235969', () => {
  it('returns 200 OK with correct health check response', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      ok: true,
      variant: '57235969',
    });
  });

  it('returns json response with correct content type', async () => {
    const response = await GET();
    const contentType = response.headers.get('content-type');

    expect(contentType).toContain('application/json');
  });

  it('has no database dependencies - always returns success', async () => {
    // Call multiple times to verify consistent behavior
    for (let i = 0; i < 3; i++) {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.variant).toBe('57235969');
    }
  });
});
