/**
 * GET /api/healthz-smoke-908186049
 *
 * Lightweight smoke test endpoint for variant testing and load balancer integration.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 10ms (typical).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "908186049" }
 *
 * Use case: variant testing, smoke tests, load balancer health checks, monitoring integration.
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-908186049
 *
 * Returns a deterministic health check response with a variant identifier.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "908186049" }
 */
export async function GET(): Promise<NextResponse<{ ok: boolean; variant: string }>> {
  return NextResponse.json(
    {
      ok: true,
      variant: '908186049',
    },
    { status: 200 }
  );
}
