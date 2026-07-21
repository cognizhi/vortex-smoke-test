import { describe, it, expect } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

describe('GET /api/healthz-smoke-661868846-c', () => {
  it('returns 200 with correct JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-661868846-c', {
      method: 'GET',
    })
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '661868846' })
  })

  it('has correct response structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-661868846-c', {
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
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-661868846-c', {
      method: 'GET',
    })
    const response = await GET(request)

    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
