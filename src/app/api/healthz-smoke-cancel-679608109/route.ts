/**
 * GET /api/healthz-smoke-cancel-679608109
 *
 * Health check endpoint for cancel flow monitoring variant (679608109).
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * This endpoint is variant-specific, allowing independent health monitoring of the cancel flow variant.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "679608109" }
 *
 * Example:
 *   GET /api/healthz-smoke-cancel-679608109
 *   → 200 OK
 *   → { "ok": true, "variant": "679608109" }
 *
 * Bug Fix: VRTX-0162 - Implementation was missing from sprint branch
 */

import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-cancel-679608109
 *
 * Returns a deterministic health check response for the cancel flow variant.
 * Since the handler has no dependencies, it always returns 200 with ok: true and the variant identifier.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "679608109" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '679608109',
    },
    { status: 200 }
  );
}
