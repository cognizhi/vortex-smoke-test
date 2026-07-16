import { NextRequest, NextResponse } from 'next/server'

/**
 * VRTX-0407: Health check endpoint A for SPRINT-0070
 *
 * This handler is called for GET requests to /api/healthz-smoke-1012136249-a.
 * It returns a simple JSON response with status 200.
 *
 * Note: If this returns 404 in E2E tests but works in direct testing, it indicates
 * a routing or server initialization issue in the Playwright test environment.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  // Ensure the function is properly exported and called
  return NextResponse.json(
    { ok: true, variant: '1012136249' },
    { status: 200 }
  )
}
