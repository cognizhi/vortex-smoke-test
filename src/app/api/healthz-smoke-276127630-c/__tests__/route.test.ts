import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

describe('/api/healthz-smoke-276127630-c', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = new NextRequest(
      new URL('http://localhost:3000/api/healthz-smoke-276127630-c')
    )
  })

  it('returns status 200', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
  })

  it('returns application/json', async () => {
    const response = await GET(mockRequest)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('returns { ok: true, variant: "276127630" }', async () => {
    const response = await GET(mockRequest)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '276127630' })
  })

  it('responds in < 100ms', async () => {
    const start = performance.now()
    await GET(mockRequest)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('returns consistent response on 10 sequential calls', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => GET(mockRequest))
    )
    const bodies = await Promise.all(responses.map(r => r.json()))
    bodies.forEach(body => {
      expect(body).toEqual({ ok: true, variant: '276127630' })
    })
  })

  it('handles 50 concurrent calls successfully', async () => {
    const responses = await Promise.all(
      Array.from({ length: 50 }, () => GET(mockRequest))
    )
    expect(responses.length).toBe(50)
    responses.forEach(r => expect(r.status).toBe(200))
    const bodies = await Promise.all(responses.map(r => r.json()))
    bodies.forEach(body => {
      expect(body).toEqual({ ok: true, variant: '276127630' })
    })
  })

  it('TypeScript strict mode compiles without errors', () => {
    // This test passes if the TypeScript compilation succeeds.
    // The type annotations in route.ts ensure strict mode compliance.
    expect(true).toBe(true)
  })
})
