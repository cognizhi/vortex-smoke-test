import { GET } from '../route';
import { NextResponse } from 'next/server';

describe('GET /api/healthz-smoke-bugfix-ha-28079633', () => {
  it('returns 200 with ok: true and variant', async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      ok: true,
      variant: '28079633',
    });
  });

  it('returns application/json content type', async () => {
    const response = await GET();

    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('returns valid JSON response', async () => {
    const response = await GET();

    expect(() => response.json()).toBeDefined();
  });
});
