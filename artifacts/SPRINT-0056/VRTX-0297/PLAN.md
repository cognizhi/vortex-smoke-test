# VRTX-0297 Fix Plan

## Defect
GET `/api/healthz-smoke-bugfix-787744862` returns 404; should return 200 with `{"ok": true, "variant": "787744862"}`

## Root Cause
Route handler missing. Directory `src/app/api/healthz-smoke-bugfix-787744862/` and file `route.ts` do not exist.

## Solution
Create the missing Next.js API route handler following the pattern established by 44+ existing smoke test endpoints in the codebase.

## Implementation Steps

1. **Create directory:**
   ```bash
   mkdir -p src/app/api/healthz-smoke-bugfix-787744862
   ```

2. **Create route handler** at `src/app/api/healthz-smoke-bugfix-787744862/route.ts`:
   ```typescript
   /**
    * GET /api/healthz-smoke-bugfix-787744862
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
    *   { "ok": true, "variant": "787744862" }
    */
   import { NextResponse } from 'next/server';

   /**
    * GET handler for /api/healthz-smoke-bugfix-787744862
    *
    * Returns a deterministic health check response.
    * Since the handler has no dependencies, it always returns 200 with ok: true.
    * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
    *
    * @returns NextResponse with status 200 and body { ok: true, variant: "787744862" }
    */
   export async function GET(): Promise<NextResponse> {
     return NextResponse.json(
       {
         ok: true,
         variant: '787744862',
       },
       { status: 200 }
     );
   }
   ```

3. **Verify:** Run the dev server and test:
   ```bash
   curl http://localhost:3000/api/healthz-smoke-bugfix-787744862
   ```
   Expected response:
   ```json
   {"ok":true,"variant":"787744862"}
   ```

## Definition of Done

- [ ] Route handler file created at correct path
- [ ] Handler returns HTTP 200 status code
- [ ] Handler returns JSON response `{"ok": true, "variant": "787744862"}`
- [ ] Response follows established smoke test endpoint pattern (no dependencies, no auth, no DB)
- [ ] Manual curl verification passes
- [ ] No TypeScript errors (npm run typecheck)
- [ ] No linting errors (npm run lint)
- [ ] Endpoint accessible and returns expected response

## Notes

- This is a minimal, self-contained endpoint with zero external dependencies
- The variant identifier (787744862) is hardcoded and specific to this endpoint
- Pattern is intentionally duplicated across endpoints (not refactored into a factory)
- No database, auth, or middleware complexity involved
