# Plan: Missing /healthz-smoke-bugfix-494516155 Endpoint

**Ticket:** VRTX-0170
**Type:** Bug Fix
**Sprint:** SPRINT-0035
**Date:** 2026-07-07

---

## Problem Statement

The variant-specific health check endpoint `/healthz-smoke-bugfix-494516155` is missing from the application. When accessed, it returns HTTP 404 instead of the expected HTTP 200 with JSON response identifying the build variant. This blocks deployment verification and monitoring system integration.

---

## Root Cause

- **Missing file**: `/src/app/api/healthz-smoke-bugfix-494516155/route.ts` does not exist
- **Missing handler**: No async GET function exported from the route
- **Monitoring gap**: Deployment verification systems cannot confirm this variant is deployed

---

## Solution Overview

Add a self-contained health check endpoint that:
1. Responds to GET requests at `/healthz-smoke-bugfix-494516155`
2. Returns HTTP 200 with JSON body `{ "ok": true, "variant": "494516155" }`
3. Has no dependencies (no database, auth, external calls)
4. Follows the established pattern from previous variant endpoints (SPRINT-0005 onwards)

---

## Implementation Strategy

### Step 1: Create Endpoint File
- **File**: `/src/app/api/healthz-smoke-bugfix-494516155/route.ts`
- **Pattern**: Mirror `/src/app/api/healthz-smoke-963602537/route.ts`
- **Implementation**:
  - Export async `GET()` function
  - Return `NextResponse.json({ ok: true, variant: "494516155" }, { status: 200 })`
  - Include JSDoc header with documentation
  - No business logic or side effects needed

### Step 2: Create Tests
- **File**: `/src/app/api/healthz-smoke-bugfix-494516155/__tests__/route.test.ts`
- **Pattern**: Mirror `/src/app/api/healthz-smoke-963602537/__tests__/route.test.ts`
- **Coverage**: 14 test cases covering:
  - HTTP status (200)
  - Response structure and field types
  - Response headers
  - Performance (< 100ms single call, concurrent load)
  - Public access (no auth required)
  - Consistency (deterministic responses)

### Step 3: Verification
- Run `npm run test` — confirm all 14 tests pass
- Run `npm run lint` — confirm zero warnings
- Run `npm run typecheck` — confirm no errors
- Manual test: `curl http://localhost:3000/healthz-smoke-bugfix-494516155`

---

## Files to Create

| File | Purpose | Dependencies |
|------|---------|--------------|
| `src/app/api/healthz-smoke-bugfix-494516155/route.ts` | Endpoint handler | NextResponse (built-in) |
| `src/app/api/healthz-smoke-bugfix-494516155/__tests__/route.test.ts` | Test suite | Vitest, NextResponse |

---

## Files to Reference (No Changes)

| File | Reason |
|------|--------|
| `/src/app/api/healthz-smoke-963602537/route.ts` | Implementation pattern reference |
| `/src/app/api/healthz-smoke-963602537/__tests__/route.test.ts` | Test pattern reference |
| `PRODUCT.md` | Health check endpoint specification |
| `ARCHITECTURE.md` | Architecture and endpoint documentation |

---

## Acceptance Criteria (from spec.md)

- ✅ FIX-01: GET `/healthz-smoke-bugfix-494516155` responds with HTTP 200
- ✅ FIX-02: Response body is exactly `{ "ok": true, "variant": "494516155" }`
- ✅ FIX-03: Content-Type header is `application/json`
- ✅ FIX-04: No authentication required
- ✅ FIX-05: Response time < 100ms (typical < 10ms)
- ✅ FIX-06: Self-contained, no environment variables
- ✅ FIX-07: Regression test passes
- ✅ FIX-08: Existing health endpoints unaffected
- ✅ FIX-09: `npm run lint` passes
- ✅ FIX-10: `npm run typecheck` passes
- ✅ FIX-11: All tests pass (14/14)

---

## Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| Route collision | Low | New route does not conflict with existing paths |
| Performance | Low | Static response, no I/O or computation |
| Monitoring | Low | Only affects bugfix variant monitoring |
| Regression | Low | Isolated endpoint, comprehensive tests |

---

## Timeline

- Step 1 (Endpoint): ~5 minutes
- Step 2 (Tests): ~10 minutes
- Step 3 (Verification): ~5 minutes
- **Total**: ~20 minutes

---

## Deployment Notes

- No database migrations needed
- No environment variable changes
- No configuration changes
- Endpoint is immediately available after deployment
- Monitoring systems can begin using it once deployed

---

## Related Tickets

- **Similar variant endpoint**: VRTX-0171 (/healthz-smoke-bugfix2-357681766)
- **Previous variant endpoints**: SPRINT-0034 (688707801), SPRINT-0029 (572185676), SPRINT-0027 (901947994)
- **Health check specification**: PRODUCT.md lines 115-141
- **Architecture reference**: ARCHITECTURE.md lines 154-168

---

*This plan is the implementation roadmap. Follow it sequentially to fix the bug.*
