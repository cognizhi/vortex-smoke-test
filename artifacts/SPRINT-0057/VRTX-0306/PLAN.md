# TASK VRTX-0306 Plan: Implement /healthz-smoke-282954433-b endpoint

**Parent STORY:** VRTX-0304  
**Sprint:** SPRINT-0057  
**Date:** 2026-07-12

---

## 1. Scope

Implement the `/api/healthz-smoke-282954433-b` health check endpoint — a lightweight, self-contained smoke test endpoint for variant 282954433, path B.

**Variant ID:** 282954433  
**Endpoint path:** `/api/healthz-smoke-282954433-b`

---

## 2. Interface Contract

### Request
```
GET /api/healthz-smoke-282954433-b
```

No request body, no auth required, no query parameters.

### Response (HTTP 200)
```json
{
  "data": {
    "ok": true,
    "variant": "282954433"
  },
  "error": null
}
```

**Response details:**
- Status: 200
- Content-Type: application/json
- Response time target: < 100ms (typical < 10ms)

---

## 3. Files & Module Ownership

### Implementation files:
- **`src/app/api/healthz-smoke-282954433-b/route.ts`** (new)
  - GET handler returning fixed JSON response
  - No dependencies (no DB, no auth, no env vars)
  - ~40 lines

### Test files:
- **`src/app/api/healthz-smoke-282954433-b/__tests__/route.test.ts`** (new)
  - 14+ unit tests covering all acceptance criteria
  - Test categories: status codes, response shape, field types, headers, performance, load testing, auth-free, consistency, self-contained
  - ~180 lines

### No changes to:
- Other endpoint implementations
- Middleware or routing
- Configuration files
- Root docs (those are updated separately in sprint planning)

---

## 4. Implementation Details

### route.ts — GET handler

**Template:**
```typescript
import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-282954433-b
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (282954433) in the response.
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
 *   { "data": { "ok": true, "variant": "282954433" }, "error": null }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-282954433-b
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { data: { ok: true, variant: "282954433" }, error: null }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      data: {
        ok: true,
        variant: '282954433',
      },
      error: null,
    },
    { status: 200 }
  );
}
```

**Key points:**
- Async function (consistent with Next.js patterns)
- NextResponse.json() for proper response envelope
- Hardcoded variant "282954433"
- No parameters, no middleware
- No error handling needed (no operations can fail)

---

### route.test.ts — Comprehensive test suite

**Test groups (14 tests total):**

1. **HTTP Status & Response Body (3 tests)**
   - RH-01: Returns HTTP 200 status
   - RH-02: Returns correct JSON structure with data and error fields
   - RH-03: Response has exactly two root fields (data and error)

2. **Field Type Safety (3 tests)**
   - RH-04: data.ok field is boolean true (not just truthy)
   - RH-05: data.variant field is string "282954433" (not number)
   - RH-06: error field is null (not undefined or false)

3. **HTTP Headers & Meta (2 tests)**
   - RH-07: Content-Type header is application/json
   - RH-08: Response is a NextResponse instance

4. **Performance & Consistency (5 tests)**
   - RH-09: Response time is less than 100ms
   - RH-10: Response time is typically fast (< 10ms)
   - RH-11: Under load (50 concurrent calls), all respond within 100ms
   - RH-12: Endpoint requires no authentication
   - RH-13: Multiple sequential calls return consistent responses
   - RH-14: Endpoint is self-contained and requires no env vars

**Test structure:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-282954433-b', () => {
  // Test implementations following pattern from existing smoke test endpoints
});
```

---

## 5. Testing Strategy

### Unit test coverage:
- **HTTP contract:** Status 200, correct Content-Type
- **Response envelope:** { data: { ok, variant }, error: null }
- **Field validation:** ok=true (boolean), variant="282954433" (string), error=null
- **Performance:** Single call < 100ms, typical < 10ms, 50 concurrent < 5s
- **No dependencies:** Endpoint works without any env vars or DB
- **Consistency:** Multiple calls return identical responses
- **Auth-free:** No authentication header required

### Manual verification (engineer):
- `curl http://localhost:3000/api/healthz-smoke-282954433-b`
- Verify HTTP 200 and response matches spec

### CI verification:
- `npm run test -- src/app/api/healthz-smoke-282954433-b/` — all tests passing
- `npm run lint` — 0 warnings in this file
- `npm run typecheck` — no errors in this file
- `npm run build` — successful build including this endpoint

---

## 6. Acceptance Criteria

✅ **Implementation complete:**
- Route file created: `src/app/api/healthz-smoke-282954433-b/route.ts`
- GET handler implemented and returns correct response
- Exported as async function
- No dependencies (DB, auth, env vars, external calls)

✅ **Tests comprehensive:**
- Test file created: `src/app/api/healthz-smoke-282954433-b/__tests__/route.test.ts`
- All 14 test cases implemented and passing
- Tests cover: status, response shape, field types, headers, performance, load testing, auth, consistency, self-contained

✅ **TypeScript & Linting:**
- File compiles with strict TypeScript mode
- ESLint passes with 0 warnings
- Types complete (no `any` without justification)

✅ **Performance verified:**
- Single call response time < 100ms
- Typical response time < 10ms
- 50 concurrent calls complete within 5s

✅ **Build succeeds:**
- `npm run build` includes this endpoint without errors
- Production bundle builds successfully

✅ **Manual verification:**
- Engineer tests locally: `curl` returns correct response
- Endpoint is reachable at correct path
- Response matches exact specification

---

## 7. Definition of Done

Before closing this TASK:

1. ✅ All code committed on ticket branch
2. ✅ All 14 tests passing
3. ✅ `npm run lint` → 0 warnings
4. ✅ `npm run typecheck` → No errors
5. ✅ `npm run build` → Successful
6. ✅ Manual verification: endpoint responds correctly
7. ✅ Branch pushed to remote with `-u` flag
8. ✅ No uncommitted changes

---

## 8. Notes

- This endpoint is completely independent from endpoints A and C
- No shared code, no dependencies between implementations
- Can be implemented in parallel with VRTX-0305 and VRTX-0307
- Pattern matches existing smoke test endpoints (e.g., healthz-smoke-96685)
- Response envelope matches platform standard (data/error wrapper)
