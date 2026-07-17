# SPRINT-0085 Bugfix Plan

## Overview
This sprint addresses two missing health check endpoints required for deployment verification in distributed environments. Both defects follow an identical pattern: a variant-specific smoke test endpoint is referenced in the deployment health check configuration but the corresponding route handler is missing from the codebase.

## Defect Summary

### VRTX-0482: Missing `/api/healthz-smoke-bugfix-ha-57235969` endpoint
**Severity:** High (blocks deployment health checks)  
**Impact:** Deployment verification systems cannot confirm this variant is deployed and healthy

**Expected Behavior:**
- Endpoint: `GET /api/healthz-smoke-bugfix-ha-57235969`
- Status Code: `200 OK`
- Response Body: `{"ok": true, "variant": "57235969"}`

**Root Cause:**
The endpoint directory `/src/app/api/healthz-smoke-bugfix-ha-57235969/` and its `route.ts` handler do not exist in the codebase. The endpoint is referenced in deployment configuration but the route handler has never been implemented.

**Fix Plan:**
Create `/src/app/api/healthz-smoke-bugfix-ha-57235969/route.ts` following the existing pattern established by other variant-specific health check endpoints (e.g., `/api/healthz-smoke-bugfix-ha-30297400/`). The handler must:
- Accept GET requests
- Return `NextResponse.json({ ok: true, variant: "57235969" }, { status: 200 })`
- Include proper JSDoc documentation explaining the endpoint's purpose
- Require no authentication, database access, or external dependencies
- Target response time: < 100ms (typical < 10ms)

Reference implementation: `artifacts/SPRINT-0085/VRTX-0482/PLAN.md`

---

### VRTX-0483: Missing `/api/healthz-smoke-bugfix-ha2-409438860` endpoint
**Severity:** High (blocks deployment health checks)  
**Impact:** Deployment verification systems cannot confirm this variant is deployed and healthy

**Expected Behavior:**
- Endpoint: `GET /api/healthz-smoke-bugfix-ha2-409438860`
- Status Code: `200 OK`
- Response Body: `{"ok": true, "variant": "409438860"}`

**Root Cause:**
The endpoint directory `/src/app/api/healthz-smoke-bugfix-ha2-409438860/` and its `route.ts` handler do not exist in the codebase. The endpoint is referenced in deployment configuration but the route handler has never been implemented.

**Fix Plan:**
Create `/src/app/api/healthz-smoke-bugfix-ha2-409438860/route.ts` following the existing pattern established by other variant-specific health check endpoints (e.g., `/api/healthz-smoke-bugfix-ha2-489393049/`). The handler must:
- Accept GET requests
- Return `NextResponse.json({ ok: true, variant: "409438860" }, { status: 200 })`
- Include proper JSDoc documentation explaining the endpoint's purpose
- Require no authentication, database access, or external dependencies
- Target response time: < 100ms (typical < 10ms)

Reference implementation: `artifacts/SPRINT-0085/VRTX-0483/PLAN.md`

---

## Implementation Pattern

Both fixes follow the established pattern used throughout `/src/app/api/healthz-*` endpoints:

```typescript
import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-bugfix-<variant>/
 *
 * Variant-specific smoke test endpoint for deployment verification.
 * Lightweight health check endpoint that allows monitoring systems and load balancers
 * to verify this specific application variant is deployed and reachable.
 *
 * Public endpoint — no authentication required.
 * Self-contained with zero dependencies (no database, no external calls, no auth checks).
 * Designed for high-frequency polling by monitoring systems and load balancers.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and variant is active
 *
 * Response body:
 *   { "ok": true, "variant": "<variant-id>" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '<variant-id>',
    },
    { status: 200 }
  );
}
```

## Testing Strategy

**Verification for VRTX-0482:**
```bash
curl http://localhost:3000/api/healthz-smoke-bugfix-ha-57235969
# Expected: {"ok":true,"variant":"57235969"} with status 200
```

**Verification for VRTX-0483:**
```bash
curl http://localhost:3000/api/healthz-smoke-bugfix-ha2-409438860
# Expected: {"ok":true,"variant":"409438860"} with status 200
```

Both endpoints should respond in < 100ms consistently (< 10ms typical).

## Acceptance Criteria for SPRINT-0085

- [ ] `VRTX-0482` endpoint is created and returns `200 {"ok": true, "variant": "57235969"}`
- [ ] `VRTX-0483` endpoint is created and returns `200 {"ok": true, "variant": "409438860"}`
- [ ] Both endpoints are reachable and respond in < 100ms
- [ ] Regression tests verify endpoints exist and return correct variant identifiers
- [ ] No root docs (AGENT.md/PRODUCT.md/ARCHITECTURE.md/DESIGN.md) require updates (observable behavior unchanged)
- [ ] All changes committed on sprint branch with clear messages
