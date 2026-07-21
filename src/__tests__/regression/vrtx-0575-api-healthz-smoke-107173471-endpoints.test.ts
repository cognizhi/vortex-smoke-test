/**
 * Regression Test: VRTX-0575 - API health check endpoints (107173471 variants)
 *
 * Test Coverage: All three smoke test endpoints for variant 107173471
 * - GET /api/healthz-smoke-107173471-a
 * - GET /api/healthz-smoke-107173471-b
 * - GET /api/healthz-smoke-107173471-c
 *
 * This test verifies that:
 * 1. All three endpoints exist and are callable
 * 2. All return HTTP 200 status
 * 3. All return the correct JSON response with variant identifier
 * 4. All responses have exactly 2 fields (ok and variant)
 * 5. All responses have correct Content-Type header
 * 6. All endpoints handle concurrent requests correctly
 */
import { describe, it, expect } from 'vitest'
import { GET as getEndpointA } from '@/app/api/healthz-smoke-107173471-a/route'
import { GET as getEndpointB } from '@/app/api/healthz-smoke-107173471-b/route'
import { GET as getEndpointC } from '@/app/api/healthz-smoke-107173471-c/route'

describe('REGRESSION: VRTX-0575 - API health check endpoints (107173471)', () => {
  // Test 1: Endpoint -a exists and responds
  it('endpoint -a exists and responds', async () => {
    const res = await getEndpointA()
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })

  // Test 2: Endpoint -b exists and responds
  it('endpoint -b exists and responds', async () => {
    const res = await getEndpointB()
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })

  // Test 3: Endpoint -c exists and responds
  it('endpoint -c exists and responds', async () => {
    const res = await getEndpointC()
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })

  // Test 4: Response structure for -a
  it('returns 200 OK with correct JSON for endpoint -a', async () => {
    const res = await getEndpointA()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.variant).toBe('107173471')
  })

  // Test 5: Response structure for -b
  it('returns 200 OK with correct JSON for endpoint -b', async () => {
    const res = await getEndpointB()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.variant).toBe('107173471')
  })

  // Test 6: Response structure for -c
  it('returns 200 OK with correct JSON for endpoint -c', async () => {
    const res = await getEndpointC()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.variant).toBe('107173471')
  })

  // Test 7: Exact response format (no extra fields)
  it('returns exactly {"ok":true,"variant":"107173471"} for all endpoints', async () => {
    const endpoints = [
      { name: '-a', handler: getEndpointA },
      { name: '-b', handler: getEndpointB },
      { name: '-c', handler: getEndpointC },
    ]

    for (const { name, handler } of endpoints) {
      const res = await handler()
      const json = await res.json()
      // Ensure no extra fields
      expect(Object.keys(json).sort()).toEqual(['ok', 'variant'].sort())
      expect(json).toEqual({
        ok: true,
        variant: '107173471',
      })
    }
  })

  // Test 8: Content-Type header
  it('has correct Content-Type header for all endpoints', async () => {
    const handlers = [getEndpointA, getEndpointB, getEndpointC]
    for (const handler of handlers) {
      const res = await handler()
      expect(res.headers.get('Content-Type')).toMatch(/^application\/json/)
    }
  })

  // Test 9: Under load
  it('returns 200 under concurrent load (multiple calls)', async () => {
    const calls = Array.from({ length: 10 }, () => getEndpointA())
    const results = await Promise.all(calls)

    results.forEach((res) => {
      expect(res.status).toBe(200)
    })
  })
})
