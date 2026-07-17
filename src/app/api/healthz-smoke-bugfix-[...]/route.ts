/**
 * GET /api/healthz-smoke-bugfix-[variant]
 *
 * Dynamic catch-all route handler for variant-specific health check endpoints.
 * Extracts variant identifier from URL path and returns it in the response.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * This handler resolves the Next.js App Router runtime routing issue where specific route
 * paths like /api/healthz-smoke-bugfix-ha2-489393049 return 404 despite being compiled correctly.
 * Using a catch-all dynamic route avoids this issue.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Example: GET /api/healthz-smoke-bugfix-ha2-489393049
 * Response: 200 OK with { "ok": true, "variant": "ha2-489393049" }
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "<extracted-variant>" }
 */
import { NextResponse } from 'next/server';

interface Params {
  __param: string[];
}

/**
 * GET handler for /api/healthz-smoke-bugfix-[variant]
 *
 * Extracts the variant identifier from the URL catch-all segment.
 * Since the handler has no dependencies, it always returns 200 with ok: true and the variant.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * The catch-all route [...]` captures everything after /api/healthz-smoke-bugfix- as an array.
 * For URL /api/healthz-smoke-bugfix-ha2-489393049, the __param would be ["ha2-489393049"].
 * We join the array back into a string to handle edge cases with multiple segments.
 *
 * @param params - Next.js route params containing the catch-all segment
 * @returns NextResponse with status 200 and body { ok: true, variant: "<variant>" }
 */
export async function GET(_req: Request, { params }: { params: Params }): Promise<NextResponse> {
  // Extract variant from the catch-all segment
  const variantParts = params.__param || [];
  const variant = variantParts.join('/');

  return NextResponse.json(
    {
      ok: true,
      variant,
    },
    { status: 200 }
  );
}
