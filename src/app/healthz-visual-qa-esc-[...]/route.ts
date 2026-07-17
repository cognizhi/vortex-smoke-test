/**
 * GET /healthz-visual-qa-esc-[variant]
 *
 * Lightweight visual QA health check endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Example: GET /healthz-visual-qa-esc-872443469
 * Response: 200 OK with { "ok": true }
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true }
 */
import { NextResponse } from 'next/server';

interface Params {
  __param: string[];
}

/**
 * GET handler for /healthz-visual-qa-esc-[variant]
 *
 * Returns a simple health check response indicating the service is healthy.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * The catch-all route [...]` captures everything after /healthz-visual-qa-esc- as an array.
 * We accept any variant identifier and simply return 200 OK with ok: true.
 *
 * @param params - Next.js route params containing the catch-all segment
 * @returns NextResponse with status 200 and body { ok: true }
 */
export async function GET(_req: Request, { params }: { params: Params }): Promise<NextResponse> {
  // Endpoint variant is captured but not included in response
  // Simply return 200 with ok: true for any variant

  return NextResponse.json(
    {
      ok: true,
    },
    { status: 200 }
  );
}
