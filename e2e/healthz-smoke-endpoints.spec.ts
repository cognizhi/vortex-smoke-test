import { test, expect } from '@playwright/test'

test.describe('Healthz smoke endpoints — SPRINT-0070', () => {
  test('GET /api/healthz-smoke-1012136249-a returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-1012136249-a')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '1012136249' })
  })

  test('GET /api/healthz-smoke-1012136249-b returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-1012136249-b')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '1012136249' })
  })

  test('GET /api/healthz-smoke-1012136249-c returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-1012136249-c')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '1012136249' })
  })

  test('all three endpoints respond with correct content-type', async ({
    request,
  }) => {
    const endpoints = [
      '/api/healthz-smoke-1012136249-a',
      '/api/healthz-smoke-1012136249-b',
      '/api/healthz-smoke-1012136249-c',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      expect(response.headers()['content-type']).toContain('application/json')
    }
  })

  test('all three endpoints respond quickly', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-1012136249-a',
      '/api/healthz-smoke-1012136249-b',
      '/api/healthz-smoke-1012136249-c',
    ]

    for (const endpoint of endpoints) {
      const start = Date.now()
      await request.get(endpoint)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Response should be within 1 second
    }
  })

  test('concurrent requests to all endpoints succeed', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-1012136249-a',
      '/api/healthz-smoke-1012136249-b',
      '/api/healthz-smoke-1012136249-c',
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
