/**
 * Regression test for VRTX-0478
 *
 * Tests the /api/healthz-smoke-bugfix-ha2-1065754851 endpoint
 * Ensures the endpoint returns 200 with variant identification
 */

import { GET } from '../route'
import { NextResponse } from 'next/server'

describe('/api/healthz-smoke-bugfix-ha2-1065754851', () => {
  test('GET handler returns 200 status', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  test('GET handler returns correct JSON response', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body).toEqual({
      ok: true,
      variant: '1065754851',
    })
  })

  test('GET handler returns NextResponse type', async () => {
    const response = await GET()
    expect(response).toBeInstanceOf(NextResponse)
  })

  test('GET handler returns application/json content type', async () => {
    const response = await GET()
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  test('response contains ok: true', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.ok).toBe(true)
  })

  test('response contains variant: "1065754851"', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.variant).toBe('1065754851')
  })
})
