/**
 * GET /api/healthz-smoke-bugfix-ha-30297400
 *
 * Variant-specific smoke test endpoint for deployment verification.
 * Lightweight health check endpoint that allows monitoring systems and load balancers
 * to verify this specific application variant (30297400) is deployed and reachable.
 *
 * Public endpoint — no authentication required.
 * Self-contained with zero dependencies (no database, no external calls, no auth checks).
 * Designed for high-frequency polling by monitoring systems and load balancers.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and variant is active
 *
 * Response body:
 *   { "ok": true, "variant": "30297400" }
 */

import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-bugfix-ha-30297400
 *
 * Returns a deterministic variant-specific health check response.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * The variant identifier "30297400" is hardcoded, enabling deployment verification
 * in distributed environments where multiple application variants may be deployed.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "30297400" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '30297400',
    },
    { status: 200 }
  );
}
