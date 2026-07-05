# Bug Specification: Missing Variant Smoke Test Endpoint

**Ticket:** VRTX-0087  
**Type:** Bug Fix (DEFECT)  
**Severity:** Medium  
**Date:** 2026-07-05  
**Author:** Engineer Agent  

---

## 1. Bug Description

The health check endpoint `GET /healthz-smoke-bugfix-629775393` is missing from the codebase and returns HTTP 404. This endpoint should return a lightweight, self-contained variant-specific health check response for deployment verification and monitoring systems.

**Expected behavior:** The endpoint should respond with HTTP 200 and the JSON body `{ "ok": true, "variant": "629775393" }`.

**Current behavior:** HTTP 404 — endpoint not found.

## 2. Reproduction Steps

1. Start the development server: `npm run dev`
2. Send a GET request: `curl http://localhost:3000/healthz-smoke-bugfix-629775393`
3. **Expected:** HTTP 200 with response body `{ "ok": true, "variant": "629775393" }`
4. **Actual:** HTTP 404 — page not found error

**Environment:** Any browser or curl client; no auth required; operates identically on all supported platforms.

## 3. Root Cause Analysis

The root cause is **missing implementation**: the route handler file for this variant endpoint does not exist.

**Root cause location:** File `/workspace/repo/src/app/api/healthz-smoke-bugfix-629775393/route.ts` does not exist.

**Why:** This variant endpoint follows the established pattern from previous variant endpoints (`/healthz-smoke-305070125`, `/healthz-smoke-110428092`, etc., documented in `PRODUCT.md`). Each variant requires:
1. A Next.js API route handler at `src/app/api/healthz-smoke-{variant}/route.ts`
2. An async GET function exporting from that file
3. A response returning `{ ok: true, variant: "{variant}" }` with status 200

The missing implementation means the Next.js router cannot match requests to this variant, resulting in 404.

## 4. Fix Approach

Implement the missing endpoint by:

1. **Create route handler file:** `src/app/api/healthz-smoke-bugfix-629775393/route.ts`
   - Export an async `GET()` handler function
   - Return `NextResponse.json({ ok: true, variant: "629775393" }, { status: 200 })`
   - Add JSDoc header documenting the endpoint (no auth, no dependencies, fast response)

2. **Create test file:** `src/app/api/healthz-smoke-bugfix-629775393/__tests__/route.test.ts`
   - Test HTTP 200 status code
   - Test JSON response structure: `{ ok: true, variant: "629775393" }`
   - Test type safety (ok is boolean, variant is string)
   - Test Content-Type header
   - Test no authentication required
   - Test response time < 100ms
   - Test performance under load (50 concurrent calls)
   - Test consistency under repeated calls

This fix is **minimal and safe** because:
- It follows the established pattern from 9+ existing variant endpoints
- It has zero dependencies (no database, auth, or external calls)
- No existing code is modified — only new files are added
- The implementation is identical to other variant endpoints except for the hardcoded variant ID
- Tests are comprehensive and prevent regression

## 5. Regression Risk

| Area | Risk | Mitigation |
|------|------|------------|
| HTTP routing | Low | Next.js App Router is stable; new route handler is isolated and follows established pattern |
| Health check system | Low | Variant endpoints are independent; adding one does not affect others or base `/healthz-smoke` |
| Monitoring/observability | Low | Endpoint has zero external dependencies — always succeeds if reachable |
| Performance | Low | Response is hardcoded JSON; no loops, DB calls, or IO operations |

## 6. Fix Acceptance Criteria

- **FIX-01:** `curl http://localhost:3000/healthz-smoke-bugfix-629775393` returns HTTP 200 with body `{ "ok": true, "variant": "629775393" }`.
- **FIX-02:** Content-Type header is `application/json`.
- **FIX-03:** Response time is consistently < 100ms (typical < 10ms).
- **FIX-04:** Endpoint requires no authentication.
- **FIX-05:** Response body has exactly two fields: `ok` (boolean true) and `variant` (string "629775393").
- **FIX-06:** All 14 regression tests pass (response status, JSON structure, type safety, headers, performance, load, consistency).
- **FIX-07:** No existing tests broken; `npm run test` passes.
- **FIX-08:** Code passes linting: `npm run lint` returns 0 warnings.
- **FIX-09:** TypeScript strict mode passes: `npm run typecheck` has no errors.

## 7. Test Strategy

### Failing tests (RED phase)
Write 14 test cases in `src/app/api/healthz-smoke-bugfix-629775393/__tests__/route.test.ts` that verify:

**Group 1: HTTP Status & Response Body (4 tests)**
- Returns HTTP 200 status code
- Returns correct JSON structure with `ok` and `variant` fields
- Response has no extra fields (exactly 2 root keys)
- Response has exactly `ok` and `variant` fields in any order

**Group 2: Field Type Safety (2 tests)**
- `ok` field is boolean true (not truthy string/number)
- `variant` field is string "629775393" (not number)

**Group 3: HTTP Headers & Meta (2 tests)**
- Content-Type header is `application/json`
- Response is a NextResponse instance

**Group 4: Performance (3 tests)**
- Response time < 100ms
- Response time typically < 10ms
- Under load (50 concurrent calls), all respond within 100ms

**Group 5: Public Access & Consistency (3 tests)**
- Endpoint requires no authentication
- Multiple sequential calls return identical responses
- Endpoint is self-contained and requires no environment variables

### Green phase
Implement the route handler to make all 14 tests pass.

### Coverage target
100% line coverage for the route handler (1 simple function with no branches).

## 8. Implementation Pattern (Reference)

The route handler follows the identical pattern as `/healthz-smoke-305070125`:

```typescript
import { NextResponse } from 'next/server';

/**
 * GET /healthz-smoke-bugfix-629775393
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "629775393" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '629775393',
    },
    { status: 200 }
  );
}
```

## 9. Out of Scope

- Creating a dynamic variant registry or metadata endpoint
- Modifying existing variant endpoints
- Updating the base `/healthz-smoke` endpoint
- Integration with deployment/CI systems
- Environment-variable-based variant detection

## 10. Dependencies & Blockers

| Dependency | Type | Status |
|------------|------|--------|
| Next.js 15 (App Router) | Internal | ✅ Available |
| TypeScript | Internal | ✅ Available |
| Vitest testing framework | Internal | ✅ Available |

## 11. Open Questions

- ✅ Should the variant ID be hardcoded? **Yes** — per existing pattern (see `/healthz-smoke-305070125`).
- ✅ Should the response follow the standard API envelope? **No** — variant endpoints return simple `{ ok, variant }`, not the full `{ data, error }` envelope.
- ✅ Is authentication required? **No** — this is a public health check endpoint.

---

**This specification is the source of truth. Implementation must follow the established pattern from existing variant endpoints (SPRINT-0001 through SPRINT-0015). Any deviation must be documented in summary.md.**
