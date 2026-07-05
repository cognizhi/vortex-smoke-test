/**
 * GET /api/healthz-smoke-cancel-223573630
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (223573630) in the response.
 *
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "223573630" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-cancel-223573630
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "223573630" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '223573630',
    },
    { status: 200 }
  );
}
