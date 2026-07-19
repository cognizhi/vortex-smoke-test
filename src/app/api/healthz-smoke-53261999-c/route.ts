/**
 * GET /api/healthz-smoke-53261999-c
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (53261999) in the response.
 *
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 10ms.
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "53261999" }
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-53261999-c
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @param _request NextRequest (unused)
 * @returns NextResponse with status 200 and body { ok: true, variant: "53261999" }
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '53261999',
    },
    { status: 200 }
  );
}
