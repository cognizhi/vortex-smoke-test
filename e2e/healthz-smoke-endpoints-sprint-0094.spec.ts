import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Healthz smoke endpoints — SPRINT-0094', () => {
  test('GET /api/healthz-smoke-bugfix-261077566 returns 200 with ok and variant', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/healthz-smoke-bugfix-261077566`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '261077566' });
  });

  test('GET /api/healthz-smoke-bugfix2-856253589 returns 200 with ok and variant', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/healthz-smoke-bugfix2-856253589`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '856253589' });
  });

  test('GET /api/healthz-smoke-bugfix3-279760907 returns 200 with ok and variant', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/healthz-smoke-bugfix3-279760907`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '279760907' });
  });

  test('all three endpoints respond with correct content-type', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-bugfix-261077566',
      '/api/healthz-smoke-bugfix2-856253589',
      '/api/healthz-smoke-bugfix3-279760907',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.headers()['content-type']).toContain('application/json');
    }
  });

  test('all three endpoints respond quickly', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-bugfix-261077566',
      '/api/healthz-smoke-bugfix2-856253589',
      '/api/healthz-smoke-bugfix3-279760907',
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}${endpoint}`);
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    }
  });

  test('concurrent requests to all endpoints succeed', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-bugfix-261077566',
      '/api/healthz-smoke-bugfix2-856253589',
      '/api/healthz-smoke-bugfix3-279760907',
    ];

    const promises = endpoints.map(endpoint => request.get(`${BASE_URL}${endpoint}`));
    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.variant).toBeTruthy();
    }
  });
});
