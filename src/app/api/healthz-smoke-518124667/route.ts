/**
 * GET /api/healthz-smoke-518124667
 *
 * Lightweight variant smoke test endpoint for canary deployments and specialized monitoring workflows.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by load balancers, monitoring systems, and canary deployment strategies.
 *
 * Variant-identified endpoint that allows:
 * - Canary routing — Direct traffic to specific deployment variants
 * - A/B monitoring — Track health separately per variant
 * - Rollout strategies — Gradual traffic shifting based on variant endpoints
 * - Load balancer routing — Blue-green deployment health checks
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "518124667" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-518124667
 *
 * Returns a deterministic health check response with variant identifier.
 * Since the handler has no dependencies, it always returns 200 with ok: true and the hardcoded variant.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "518124667" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '518124667',
    },
    { status: 200 }
  );
}
