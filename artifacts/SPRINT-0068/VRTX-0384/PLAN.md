# VRTX-0384 Implementation Plan

## Ticket Summary

**Title:** Add missing `/healthz-smoke-bugfix-20499480` endpoint  
**Type:** DEFECT / Fix  
**Sprint:** SPRINT-0068  
**Linked to:** VRTX-0386 (Bugfix Plan)

---

## Defect Description

The endpoint `GET /healthz-smoke-bugfix-20499480` currently returns **HTTP 404 Not Found**. This endpoint should exist and return a lightweight health check response for smoke testing and monitoring systems.

### Expected Behavior
```
GET /healthz-smoke-bugfix-20499480 HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

{"ok":true,"variant":"20499480"}
```

### Current Behavior
```
GET /healthz-smoke-bugfix-20499480 HTTP/1.1

HTTP/1.1 404 Not Found
```

---

## Root Cause

The Next.js API route handler for this endpoint does not exist. In Next.js App Router:
- API routes are defined by creating a file at `src/app/api/<route>/route.ts`
- The file must export a handler function (`GET`, `POST`, etc.)
- If the file is missing, Next.js returns a 404

**Missing Files:**
- `src/app/api/healthz-smoke-bugfix-20499480/` (directory)
- `src/app/api/healthz-smoke-bugfix-20499480/route.ts` (handler)

---

## Implementation Specification

### Files to Create

**File:** `src/app/api/healthz-smoke-bugfix-20499480/route.ts`

**Content:**
```typescript
/**
 * GET /api/healthz-smoke-bugfix-20499480
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (20499480) in the response.
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
 *   { "ok": true, "variant": "20499480" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-bugfix-20499480
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "20499480" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '20499480',
    },
    { status: 200 }
  );
}
```

### Pattern Reference

This implementation follows the pattern used in existing variant-specific health-check endpoints:
- `src/app/api/healthz-smoke-bugfix-449792264/route.ts`
- `src/app/api/healthz-smoke-bugfix-630670662/route.ts`
- Similar endpoints with the `bugfix` naming and numeric variant identifier

---

## Definition of Done

- [ ] Directory `src/app/api/healthz-smoke-bugfix-20499480/` created
- [ ] File `src/app/api/healthz-smoke-bugfix-20499480/route.ts` created with correct handler
- [ ] Handler exports async `GET()` function
- [ ] GET handler returns `NextResponse.json()` with `{ ok: true, variant: "20499480" }`
- [ ] HTTP status code is 200
- [ ] Response Content-Type is `application/json` (automatic via NextResponse.json)
- [ ] No database queries or external dependencies
- [ ] No authentication checks
- [ ] JSDoc comments match existing pattern
- [ ] Endpoint tested: `curl http://localhost:3000/healthz-smoke-bugfix-20499480` returns 200 + correct JSON
- [ ] Code passes: `npm run lint`
- [ ] Code passes: `npm run typecheck`
- [ ] Commit message follows project conventions
- [ ] PR/branch contains ONLY this endpoint (no other changes)

---

## Technical Details

### Dependencies
- `next/server` — standard Next.js import, already in project dependencies
- No external packages required
- No database connections
- No authentication tokens

### Performance Considerations
- Handler is async but performs no I/O (immediate return)
- Expected response time: **< 5ms** (single JSON object serialization)
- No memory allocations beyond the response object
- Safe for high-frequency polling (100+ req/sec)

### Security Considerations
- Public endpoint (no auth required) — intentional, needed for load-balancer health checks
- No sensitive data in response
- No side effects (read-only, stateless)
- No input validation needed (no request parameters)

### Monitoring & Observability
- Response includes `variant` field for version tracking in logs
- HTTP 200 indicates success; 404 or 5xx indicates infrastructure failure (not application logic)

---

## References

- **Existing pattern:** `src/app/api/healthz-smoke-bugfix-449792264/route.ts`
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **NextResponse.json:** https://nextjs.org/docs/app/api-reference/functions/next-response

---

## Notes

This is a simple, isolated fix with no impact on existing functionality. The endpoint follows the established pattern for variant-specific health checks and is safe to deploy immediately.
