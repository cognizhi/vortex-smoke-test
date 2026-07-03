/**
 * GET /api/healthz-smoke
 *
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
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
 *   { "data": { "ok": true }, "error": null }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke
 *
 * Returns a deterministic health check response.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { data: { ok: true }, error: null }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      data: { ok: true },
      error: null,
    },
    { status: 200 }
  );
}
