# VRTX-0548 Implementation Plan

**Ticket:** VRTX-0548  
**Defect:** `/healthz-smoke-bugfix3-279760907` returns 404, should return {"ok":true,"variant":"279760907"}  
**Sprint:** SPRINT-0094  
**Status:** Planning Complete

---

## Repro Steps

```bash
curl http://localhost:3000/api/healthz-smoke-bugfix3-279760907
# Expected: HTTP 200 with {"ok":true,"variant":"279760907"}
# Actual: HTTP 404 Not Found
```

---

## Root Cause

The endpoint handler file does not exist at:
```
src/app/api/healthz-smoke-bugfix3-279760907/route.ts
```

This is a missing route handler in the Next.js 15 App Router.

---

## Fix Implementation

### File to Create
```
src/app/api/healthz-smoke-bugfix3-279760907/route.ts
```

### Implementation

```typescript
/**
 * GET /api/healthz-smoke-bugfix3-279760907
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (279760907) in the response.
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
 *   { "ok": true, "variant": "279760907" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-bugfix3-279760907
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "279760907" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '279760907',
    },
    { status: 200 }
  );
}
```

### Code Changes Summary
- **Files Added:** 1
  - `src/app/api/healthz-smoke-bugfix3-279760907/route.ts`
- **Files Modified:** 0
- **Dependencies:** None (uses only Next.js built-in NextResponse)

---

## Definition of Done

✅ Create the route handler file with the implementation above  
✅ Verify GET request returns 200 status code  
✅ Verify response body is exactly `{"ok":true,"variant":"279760907"}`  
✅ Verify response Content-Type is `application/json`  
✅ Verify endpoint responds in under 100ms  
✅ Manual repro with `curl http://localhost:3000/api/healthz-smoke-bugfix3-279760907`  

---

## Testing

### Manual Testing (Post-Fix)
```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl -i http://localhost:3000/api/healthz-smoke-bugfix3-279760907

# Expected response:
# HTTP/1.1 200 OK
# content-type: application/json
# 
# {"ok":true,"variant":"279760907"}
```

### Automated Testing
This endpoint is covered by the existing smoke test suite if one exists for variant-specific endpoints (e.g., `e2e/healthz-smoke-endpoints.spec.ts`). The existing test patterns should automatically include this variant once the endpoint is created.

---

## Risk Assessment

**Risk Level:** Minimal

- **Scope:** New endpoint only, no changes to existing code
- **Impact:** Additive only, no breaking changes
- **Rollback:** Simple file deletion if needed
- **Dependencies:** None — fully self-contained

---

## Notes

- This follows the established pattern for all health check endpoints in the codebase
- No authentication or database required
- Variant ID is hardcoded in the response, reflecting the build identifier
- Response time should be < 10ms (network latency dominates the 100ms budget)
