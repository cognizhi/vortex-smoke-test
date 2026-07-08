# Implementation Plan: VRTX-0183 — GET /healthz-smoke-54367903 Endpoint

**Ticket:** VRTX-0183  
**Sprint:** SPRINT-0037  
**Title:** Develop and test /healthz-smoke-54367903 endpoint  
**Type:** Task  

---

## Problem Statement

Add a lightweight, variant-specific health check endpoint for deployment verification. This endpoint must:
- Return a wrapper-format response with variant identification
- Be self-contained (no database, auth, or external calls)
- Support high-frequency polling by monitoring systems
- Follow the pattern from reference implementations (`/api/healthz-smoke`)

---

## Solution Overview

Implement a single GET endpoint that responds with a deterministic health check response including the variant identifier "54367903". The endpoint will:
- **Location:** `src/app/api/healthz-smoke-54367903/route.ts`
- **Pattern:** Follows `/api/healthz-smoke` wrapper format with variant extension
- **Response:** `{ data: { ok: true, variant: "54367903" }, error: null }` with HTTP 200
- **Dependencies:** None (zero database, auth, or external calls)
- **Target Response Time:** < 100ms (typical < 10ms)

---

## Implementation Steps

### Step 1: Create Directory Structure
- Create `src/app/api/healthz-smoke-54367903/` directory
- Create `src/app/api/healthz-smoke-54367903/__tests__/` directory for tests

### Step 2: Implement Route Handler
- Create `src/app/api/healthz-smoke-54367903/route.ts`
- Export async `GET()` function with return type `Promise<NextResponse>`
- Return `NextResponse.json()` with status 200
- Response body: `{ data: { ok: true, variant: "54367903" }, error: null }`
- Include JSDoc header documenting the endpoint
- Follow TypeScript strict type safety (no implicit any)

### Step 3: Write Comprehensive Tests
- Create `src/app/api/healthz-smoke-54367903/__tests__/route.test.ts`
- Write tests covering:
  - HTTP 200 status code
  - Correct JSON response structure (data and error fields)
  - Correct variant ID in response
  - Field type safety (ok is boolean, variant is string, error is null)
  - Content-Type header (application/json)
  - No authentication required
  - Response time < 100ms
  - Performance under load (50 concurrent requests)
  - Consistency under repeated calls
  - No extra fields in response

### Step 4: Verify Code Quality
- `npm run typecheck` — passes with zero implicit any
- `npm run lint` — passes with zero warnings
- `npm run test -- src/app/api/healthz-smoke-54367903` — all tests pass

### Step 5: Local Testing
- Run `npm run dev` to start dev server
- Test with `curl http://localhost:3000/api/healthz-smoke-54367903`
- Verify response format and status code

---

## Technical Specification

### Endpoint Specification
- **Path:** `GET /api/healthz-smoke-54367903`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:** `{ data: { ok: true, variant: "54367903" }, error: null }`
- **Content-Type:** `application/json`

### Implementation Pattern
```typescript
import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-54367903
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (54367903) in the response.
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
 *   { "data": { "ok": true, "variant": "54367903" }, "error": null }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      data: { ok: true, variant: '54367903' },
      error: null,
    },
    { status: 200 }
  );
}
```

### Test Coverage Strategy
- **Group 1:** HTTP Status & Response Body (4 tests)
  - Status code is 200
  - Correct JSON structure with data and error fields
  - No extra fields in data object
  - Exactly two root fields (data and error)
- **Group 2:** Field Type Safety (3 tests)
  - `ok` is boolean true (not truthy string/number)
  - `variant` is string "54367903" (not number)
  - `error` is explicitly null (not undefined)
- **Group 3:** HTTP Headers & Response Meta (2 tests)
  - Content-Type header is application/json
  - Response is NextResponse instance
- **Group 4:** Performance (3 tests)
  - Response time < 100ms
  - Typical response time < 10ms
  - Load test: 50 concurrent calls within time budget
- **Group 5:** Public Access & Consistency (3 tests)
  - No authentication required
  - Consistent responses on repeated calls
  - Self-contained (no env vars needed)

---

## Acceptance Criteria Mapping

| Criterion | Implementation | Test Coverage |
|-----------|----------------|---------------|
| Route handler file created | `src/app/api/healthz-smoke-54367903/route.ts` | N/A |
| GET responds 200 | Return 200 status | RH-01 |
| Correct JSON payload | `{ data: { ok: true, variant: "54367903" }, error: null }` | RH-02, RH-04 |
| Response structure exact | No extra fields, exact keys | RH-03, RH-04 |
| Variant ID correct | "54367903" in response | RH-02 |
| Accessible without auth | No auth guards in handler | RH-11 |
| No database calls | No imports of db modules | Code review |
| No external dependencies | Only NextResponse import | Code review |
| Passes typecheck | `npm run typecheck` | Verification step |
| Passes lint 0 warnings | `npm run lint` | Verification step |
| Unit tests ≥3 cases | 15 comprehensive tests | RH-01 through RH-15 |
| All tests pass | 100% pass rate | Verification step |

---

## Risk Assessment

### Low Risk
- This is a pure utility endpoint with zero dependencies
- Pattern is established from reference implementation `/api/healthz-smoke`
- No changes to existing code or data models
- Straightforward TypeScript/Next.js API route

### No Known Blockers
- All required patterns and examples exist in codebase
- Development environment is ready
- No database or auth considerations

---

## Success Criteria

✅ All acceptance criteria from ticket met  
✅ All tests pass (red → green → refactor cycle complete)  
✅ Code quality checks pass (`typecheck`, `lint`)  
✅ Manual local testing confirms correct behavior  
✅ All artifacts committed: plan.md, tdd-test-cases.md, tdd-test-result.md, summary.md  
✅ Zero breaking changes to existing functionality  

---

## Timeline

This is a straightforward, single-endpoint task:
- **Planning:** 5 min
- **Test writing:** 20 min
- **Implementation:** 5 min
- **Verification & QA:** 10 min
- **Documentation:** 5 min

**Estimated Total:** ~45 minutes
