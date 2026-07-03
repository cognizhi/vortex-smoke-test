import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-859005244
 *
 * Variant-specific health check endpoint for monitoring systems and canary deployments.
 * Lightweight, self-contained smoke test with no dependencies (no database, no auth, no external calls).
 * Designed for independent tracking of specific deployment variants for A/B testing and progressive rollouts.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "859005244" }
 *
 * Use cases:
 * - Canary deployment monitoring: track health of specific variant independently
 * - A/B testing: verify variant is running before routing traffic
 * - Version-specific monitoring: distinguish between deployed versions
 * - Load balancer health checks: high-frequency polling with zero dependencies
 */

/**
 * GET handler for /api/healthz-smoke-859005244
 *
 * Returns a deterministic variant-specific health check response.
 * Since the handler has no dependencies, it always returns 200 with ok: true and the variant ID.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "859005244" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '859005244',
    },
    { status: 200 }
  );
}
