/**
 * GET /api/healthz-smoke-778162394-b
 *
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * This endpoint includes a variant identifier (778162394) to distinguish between
 * different deployment variants, enabling A/B testing and gradual rollouts of health check logic.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "778162394" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-778162394-b
 *
 * Returns a deterministic health check response with a variant identifier.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "778162394" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '778162394',
    },
    { status: 200 }
  );
}
