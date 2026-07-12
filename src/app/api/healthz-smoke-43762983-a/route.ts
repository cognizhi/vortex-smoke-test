/**
 * GET /api/healthz-smoke-43762983-a
 *
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for deployment verification, load balancer health checks, and A/B testing.
 *
 * This endpoint identifies the specific variant build (43762983) in the response.
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "43762983" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-43762983-a
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "43762983" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '43762983',
    },
    { status: 200 }
  );
}
