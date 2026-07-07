# Bug Specification: Missing /healthz-smoke-bugfix-494516155 Endpoint

**Ticket:** VRTX-0170
**Type:** Bug Fix
**Severity:** High
**Date:** 2026-07-07
**Author:** Engineer Agent

---

## 1. Bug Description

The variant-specific health check endpoint `/healthz-smoke-bugfix-494516155` is missing from the application. When accessed, it returns HTTP 404 instead of the expected HTTP 200 with a JSON response identifying the build variant.

This endpoint is needed for deployment verification and monitoring system integration to confirm that the bugfix variant (494516155) is deployed and reachable in production environments.

---

## 2. Reproduction Steps

1. Start the development server: `npm run dev`
2. Make a GET request to `/healthz-smoke-bugfix-494516155`
   - Command: `curl http://localhost:3000/healthz-smoke-bugfix-494516155`
3. **Expected:** HTTP 200 response with JSON body: `{ "ok": true, "variant": "494516155" }`
4. **Actual:** HTTP 404 response (Not Found)

**Environment:** Development (localhost:3000) or production deployment; affects load balancer and monitoring system health checks

---

## 3. Root Cause Analysis

**Root cause:** Missing endpoint implementation

The endpoint `/healthz-smoke-bugfix-494516155` does not exist in the codebase. Checking the Next.js App Router structure:
- Expected location: `/workspace/repo/src/app/api/healthz-smoke-bugfix-494516155/route.ts`
- Current status: **Directory does not exist**

The application has similar variant endpoints (e.g., `/healthz-smoke-963602537`, `/healthz-smoke-688707801`) implemented following the pattern from SPRINT-0005 onwards. The endpoint for variant "494516155" is missing from this established series.

**Reference:** PRODUCT.md lines 125-140 document variant smoke test endpoints for deployment verification. The endpoint pattern is established in `/src/app/api/healthz-smoke-{variant}/route.ts` with a handler returning `{ ok: true, variant: "{variant-id}" }`.

---

## 4. Fix Approach

Create a new self-contained route handler at `/src/app/api/healthz-smoke-bugfix-494516155/route.ts` that:

1. **Implements a GET handler** that returns HTTP 200 with JSON response:
   - Body: `{ "ok": true, "variant": "494516155" }`
   - Content-Type: `application/json`

2. **Follows the established pattern** from existing variant endpoints:
   - No dependencies (no database, no authentication, no external calls)
   - Self-contained implementation (no environment variables)
   - Target response time < 100ms (typical < 10ms)
   - Public endpoint (no authentication required)

3. **Matches the implementation** of similar endpoints (e.g., healthz-smoke-963602537):
   - Export async `GET()` function
   - Use Next.js `NextResponse.json()` API
   - Include JSDoc header documenting the endpoint
   - No conditional logic or guards needed

4. **Create comprehensive tests** at `/src/app/api/healthz-smoke-bugfix-494516155/__tests__/route.test.ts`:
   - HTTP 200 status verification
   - Exact response body validation: `{ "ok": true, "variant": "494516155" }`
   - Content-Type header verification
   - No authentication required verification
   - Response time performance verification (< 100ms)
   - Consistency under repeated calls
   - Load testing (50 concurrent requests)

---

## 5. Regression Risk

| Area | Risk | Mitigation |
|------|------|------------|
| Health check routing | Low | Endpoint is isolated; no impact to other health endpoints |
| Monitoring systems | Low | Adds new endpoint; existing health checks unchanged |
| Deployment verification | Low | New endpoint only affects bugfix variant monitoring |
| Performance | Low | Self-contained, no dependencies; consistent with existing variants |

---

## 6. Fix Acceptance Criteria

- **FIX-01:** GET `/healthz-smoke-bugfix-494516155` responds with HTTP 200 status code
- **FIX-02:** Response body is exactly `{ "ok": true, "variant": "494516155" }` with no extra fields
- **FIX-03:** Content-Type header is `application/json`
- **FIX-04:** No authentication required to access the endpoint
- **FIX-05:** Response time is < 100ms (typical < 10ms)
- **FIX-06:** Endpoint is self-contained with no environment variable lookups
- **FIX-07:** Regression test passes
- **FIX-08:** All existing health check endpoints continue to work (404 or 200 as before)
- **FIX-09:** `npm run lint` passes with zero warnings on new code
- **FIX-10:** `npm run typecheck` passes on new code
- **FIX-11:** `npm run test` passes all new tests and existing tests remain passing

---

## 7. Test Strategy

Write failing regression tests (red phase) that verify:

1. **Response status and body** — GET returns 200 with correct JSON
2. **Field types** — `ok` is boolean `true`, `variant` is string `"494516155"`
3. **No extra fields** — response has exactly 2 root keys: `ok` and `variant`
4. **Content-Type** — header is `application/json`
5. **No authentication** — endpoint requires no auth headers or cookies
6. **Performance** — single call < 100ms, load test (50 concurrent) reasonable
7. **Consistency** — multiple sequential calls return identical responses

Tests must:
- ✅ Fail on current (buggy) code → confirms reproduction of missing endpoint
- ✅ Pass after fix implementation → confirms fix resolves the issue
- ✅ Follow the pattern from existing variant endpoint tests (e.g., healthz-smoke-963602537)

---

## 8. Implementation Checklist

- [ ] Create directory: `/src/app/api/healthz-smoke-bugfix-494516155/`
- [ ] Implement: `/src/app/api/healthz-smoke-bugfix-494516155/route.ts`
  - [ ] Export async GET handler
  - [ ] Return NextResponse.json with { ok: true, variant: "494516155" }
  - [ ] Set status code to 200
  - [ ] Include JSDoc header
- [ ] Create directory: `/src/app/api/healthz-smoke-bugfix-494516155/__tests__/`
- [ ] Implement: `/src/app/api/healthz-smoke-bugfix-494516155/__tests__/route.test.ts`
  - [ ] 14 test cases covering all scenarios (see existing pattern)
  - [ ] All tests fail before fix, pass after fix
- [ ] Run `npm run test` and verify all new tests pass
- [ ] Run `npm run lint` and verify zero warnings
- [ ] Run `npm run typecheck` and verify no errors
- [ ] Manual verification: `curl http://localhost:3000/healthz-smoke-bugfix-494516155`

---

*This spec is the source of truth for the implementation. Any deviation must be documented in summary.md.*
