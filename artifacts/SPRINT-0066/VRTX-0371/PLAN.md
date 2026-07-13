# VRTX-0371: Add Missing `/api/healthz-smoke-bugfix-488908419` Endpoint

**Related:** SPRINT-0066 (see `artifacts/SPRINT-0066/SPRINT-PLAN.md`)

## Summary

Add the missing variant-specific healthz endpoint `/api/healthz-smoke-bugfix-488908419` that returns a 200 status with variant identification. This endpoint is required by monitoring and smoke test systems for deployment validation.

## Problem

- **Current behavior:** GET `/api/healthz-smoke-bugfix-488908419` returns 404
- **Expected behavior:** GET `/api/healthz-smoke-bugfix-488908419` returns 200 with JSON `{ ok: true, variant: "488908419" }`
- **Impact:** Smoke testing and monitoring systems cannot validate this deployment variant, potentially missing version mismatches or deployment failures

## Root Cause

The endpoint directory and route handler do not exist in the codebase. File path `src/app/api/healthz-smoke-bugfix-488908419/route.ts` is missing.

## Solution

Create a new Next.js API route following the existing variant pattern found in files like `src/app/api/healthz-smoke-bugfix-449792264/route.ts`.

### Implementation

**Create file:** `src/app/api/healthz-smoke-bugfix-488908419/route.ts`

```typescript
/**
 * GET /api/healthz-smoke-bugfix-488908419
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (488908419) in the response.
 *
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
 *   { "ok": true, "variant": "488908419" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-bugfix-488908419
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "488908419" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '488908419',
    },
    { status: 200 }
  );
}
```

## Definition of Done

- [x] Endpoint is created at `src/app/api/healthz-smoke-bugfix-488908419/route.ts`
- [x] GET handler returns HTTP 200
- [x] Response body is valid JSON: `{ ok: true, variant: "488908419" }`
- [x] No database or external dependencies
- [x] No authentication required
- [x] JSDoc comments document endpoint behavior and response format
- [x] Code matches existing variant endpoint pattern
- [x] Manual test passes: `curl http://localhost:3000/api/healthz-smoke-bugfix-488908419` returns 200
- [x] Dev server runs without errors
- [x] Response time < 100ms

## Testing Instructions

1. Start dev server: `npm run dev`
2. In another terminal, test the endpoint:
   ```bash
   curl http://localhost:3000/api/healthz-smoke-bugfix-488908419
   ```
3. Verify response:
   - HTTP Status: 200 OK
   - Response Body: `{"ok":true,"variant":"488908419"}`
   - Response time: < 100ms

## Files Changed

- **New:** `src/app/api/healthz-smoke-bugfix-488908419/route.ts` (38 lines)

## Risk

**Very Low:** Self-contained endpoint with no side effects or dependencies.

## Notes

- This endpoint follows the exact pattern used by existing variant healthz endpoints in the codebase
- No changes to other files required
- No database migrations
- No routing configuration needed (Next.js app router handles it automatically)
