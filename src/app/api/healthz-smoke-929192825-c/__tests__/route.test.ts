import { describe, it, expect } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

describe('GET /api/healthz-smoke-929192825-c', () => {
  it('returns 200 with correct JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-929192825-c', {
      method: 'GET',
    })
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '929192825' })
  })

  it('has correct response structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-929192825-c', {
      method: 'GET',
    })
    const response = await GET(request)
    const body = await response.json()

    expect(body).toHaveProperty('ok')
    expect(body).toHaveProperty('variant')
    expect(Object.keys(body)).toEqual(['ok', 'variant'])
    expect(typeof body.ok).toBe('boolean')
    expect(typeof body.variant).toBe('string')
  })

  it('sets correct Content-Type header', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-929192825-c', {
      method: 'GET',
    })
    const response = await GET(request)

    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('variant field contains correct value', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-929192825-c', {
      method: 'GET',
    })
    const response = await GET(request)
    const body = await response.json()

    expect(body.variant).toBe('929192825')
    expect(body.ok).toBe(true)
  })

  it('handles multiple requests consistently', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/healthz-smoke-929192825-c', {
      method: 'GET',
    })
    const response1 = await GET(request1)
    const body1 = await response1.json()

    const request2 = new NextRequest('http://localhost:3000/api/healthz-smoke-929192825-c', {
      method: 'GET',
    })
    const response2 = await GET(request2)
    const body2 = await response2.json()

    expect(body1).toEqual(body2)
    expect(response1.status).toBe(response2.status)
  })
})
