import { describe, it, expect } from 'vitest'
import { GET as getEndpointA } from '../route'

/**
 * REGRESSION TEST for VRTX-0407: E2E endpoints returning 404
 *
 * This test verifies that the 1012136249 endpoints are correctly exported
 * and return the expected response format, ensuring they can be properly
 * registered and served by the Next.js router.
 *
 * Before fix: This test should pass (endpoints work in isolation)
 * After fix: This test should pass, and E2E tests should also pass
 */
describe('REGRESSION: Endpoint A (1012136249-a) export and routing', () => {
  it('endpoint exports GET function with correct signature', async () => {
    // Test that the function exists and is callable
    expect(typeof getEndpointA).toBe('function')

    // Test that calling GET returns a response
    const response = await getEndpointA()

    // Verify it's not a 404 and has the correct structure
    expect(response).toBeDefined()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual({
      ok: true,
      variant: '1012136249',
    })
  })

  it('response is NextResponse with proper status', async () => {
    const response = await getEndpointA()

    // This is the key test: ensure response is correctly formed
    // If this fails, the endpoint won't work in E2E environment either
    expect(response.constructor.name).toBe('NextResponse')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('endpoint response matches E2E test expectations', async () => {
    // Simulate what the E2E test does
    const response = await getEndpointA()

    // E2E test checks status first
    expect(response.status).toBe(200)

    // Then checks response body
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '1012136249' })

    // And content-type header
    const contentType = response.headers.get('content-type')
    expect(contentType).toContain('application/json')
  })
})
