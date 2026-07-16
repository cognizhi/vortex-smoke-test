# PLAN: VRTX-0434 — Create /api/healthz-smoke-bugfix-804297523 endpoint

## Root Cause Analysis

**Defect:** GET `/api/healthz-smoke-bugfix-804297523` returns HTTP 404

**Root Cause:** The endpoint file `src/app/api/healthz-smoke-bugfix-804297523/route.ts` does not exist in the codebase.

**Expected Behavior:** Endpoint should return HTTP 200 with JSON body `{ "ok": true, "variant": "804297523" }`

**Current Behavior:** Endpoint returns HTTP 404 (not found), as Next.js routing cannot locate the handler file.

## Pattern Analysis

Examined existing healthz smoke test endpoints in the codebase:
- `src/app/api/healthz-smoke-bugfix-20499480/route.ts` ✓ exists, returns `{ ok: true, variant: "20499480" }`
- `src/app/api/healthz-smoke-bugfix-254027906/route.ts` ✓ exists, returns `{ ok: true, variant: "254027906" }`
- `src/app/api/healthz-smoke-bugfix-804297523/route.ts` ✗ **missing**

All healthz-smoke-bugfix-* and healthz-smoke-bugfix2-* endpoints follow the same self-contained pattern:
- No database access
- No authentication required
- Fast response (< 100ms typical)
- Response format: `{ ok: true, variant: "<variant-id>" }`
- Verified by e2e tests in `e2e/healthz-smoke-endpoints.spec.ts`

## Fix Strategy

Create the missing endpoint handler following the established pattern:

```typescript
// File: src/app/api/healthz-smoke-bugfix-804297523/route.ts
import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-bugfix-804297523
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (804297523) in the response.
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
 *   { "ok": true, "variant": "804297523" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '804297523',
    },
    { status: 200 }
  );
}
```

## Definition of Done

- [ ] Create `src/app/api/healthz-smoke-bugfix-804297523/route.ts` with the handler above
- [ ] Verify GET `/api/healthz-smoke-bugfix-804297523` returns HTTP 200
- [ ] Verify response body is exactly `{ "ok": true, "variant": "804297523" }`
- [ ] Verify response `Content-Type` header is `application/json`
- [ ] Verify endpoint responds in < 100ms
- [ ] Commit on ticket branch with message: "feat(healthz): add /api/healthz-smoke-bugfix-804297523 endpoint"
