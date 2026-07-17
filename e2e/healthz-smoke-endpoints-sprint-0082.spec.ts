import { test, expect } from '@playwright/test'

test.describe('Healthz smoke endpoints — SPRINT-0082', () => {
  test('GET /api/healthz-smoke-bugfix-ha-30297400 returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-bugfix-ha-30297400')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '30297400' })
  })

  test('GET /api/healthz-smoke-bugfix-ha2-244944780 returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-bugfix-ha2-244944780')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '244944780' })
  })

  test('both endpoints respond with correct content-type', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-bugfix-ha-30297400',
      '/api/healthz-smoke-bugfix-ha2-244944780',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      expect(response.headers()['content-type']).toContain('application/json')
    }
  })

  test('both endpoints respond quickly', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-bugfix-ha-30297400',
      '/api/healthz-smoke-bugfix-ha2-244944780',
    ]

    for (const endpoint of endpoints) {
      const start = Date.now()
      await request.get(endpoint)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Response should be within 1 second
    }
  })

  test('concurrent requests to both endpoints succeed', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-bugfix-ha-30297400',
      '/api/healthz-smoke-bugfix-ha2-244944780',
    ]

    const promises = []
    for (let i = 0; i < 10; i++) {
      for (const endpoint of endpoints) {
        promises.push(request.get(endpoint))
      }
    }

    const responses = await Promise.all(promises)
    responses.forEach((response) => {
      expect(response.status()).toBe(200)
    })
  })
})
