/**
 * GET /api/healthz-smoke-bugfix-[...variant]
 *
 * Dynamic variant-specific health check endpoint for load balancers and monitoring systems.
 * Supports arbitrary variant identifiers in the URL path.
 *
 * Examples:
 *   GET /api/healthz-smoke-bugfix-ha-986931698 → {"ok":true,"variant":"ha-986931698"}
 *   GET /api/healthz-smoke-bugfix-ha2-489393049 → {"ok":true,"variant":"ha2-489393049"}
 *   GET /api/healthz-smoke-bugfix-custom-variant → {"ok":true,"variant":"custom-variant"}
 *
 * Fast, self-contained health check with no dependencies (no database, no auth, or external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "<variant_identifier>" }
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-bugfix-[...variant]
 *
 * Extracts the variant from the URL path and returns a deterministic health check response.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @param _request - The incoming HTTP request
 * @param context - Route context containing the variant segment
 * @returns NextResponse with status 200 and body { ok: true, variant: "<variant>" }
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, unknown>> }
): Promise<NextResponse> {
  // Extract the variant from the catch-all route parameter
  // Next.js names catch-all parameters with the bracket notation they were defined in
  const params = await context.params;
  const slug = (params.slug as string[]) || [];
  const variant = slug.join('/');

  return NextResponse.json(
    {
      ok: true,
      variant,
    },
    { status: 200 }
  );
}
