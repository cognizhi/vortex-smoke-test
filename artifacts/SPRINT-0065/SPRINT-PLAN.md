# SPRINT-0065 Bugfix Plan

## Sprint Goal
Fix missing smoke test health check endpoints that are returning 404 instead of proper health status responses.

## Defects

### VRTX-0366: GET /healthz-smoke-bugfix-906735349 returns 404, should return 200 with ok+variant
**Status:** Root Caused

**Root Cause Analysis:**
The health check endpoint `/api/healthz-smoke-bugfix-906735349` does not exist. It should be a self-contained GET handler that returns a lightweight health status for load balancers and monitoring systems.

**Current Behavior:**
- GET /api/healthz-smoke-bugfix-906735349 → 404 Not Found

**Expected Behavior:**
- GET /api/healthz-smoke-bugfix-906735349 → 200 OK
  - Response body: `{"ok": true, "variant": "906735349"}`
  - No database access required
  - No authentication required
  - Response time: < 100ms

**Fix Plan Summary:**
Create the missing endpoint directory and route handler following the existing pattern:
1. Create `/src/app/api/healthz-smoke-bugfix-906735349/route.ts`
2. Implement GET handler returning `{"ok": true, "variant": "906735349"}`
3. Add documentation comments explaining the endpoint purpose
4. Add corresponding test file

**Implementation Details:**
- See: `artifacts/SPRINT-0065/VRTX-0366/PLAN.md`

---

### VRTX-0367: GET /healthz-smoke-bugfix2-691130485 returns 404, should return 200 with ok+variant
**Status:** Root Caused

**Root Cause Analysis:**
The health check endpoint `/api/healthz-smoke-bugfix2-691130485` does not exist. It should be a self-contained GET handler that returns a lightweight health status for load balancers and monitoring systems.

**Current Behavior:**
- GET /api/healthz-smoke-bugfix2-691130485 → 404 Not Found

**Expected Behavior:**
- GET /api/healthz-smoke-bugfix2-691130485 → 200 OK
  - Response body: `{"ok": true, "variant": "691130485"}`
  - No database access required
  - No authentication required
  - Response time: < 100ms

**Fix Plan Summary:**
Create the missing endpoint directory and route handler following the existing pattern:
1. Create `/src/app/api/healthz-smoke-bugfix2-691130485/route.ts`
2. Implement GET handler returning `{"ok": true, "variant": "691130485"}`
3. Add documentation comments explaining the endpoint purpose
4. Add corresponding test file

**Implementation Details:**
- See: `artifacts/SPRINT-0065/VRTX-0367/PLAN.md`

---

## Assessment

Both defects are straightforward: missing endpoint implementations. The fix pattern is well-established in the codebase (see `/src/app/api/healthz-smoke-bugfix-1021340604/route.ts` as reference). Each fix is independent and touches only one file (route.ts) per endpoint.

**Dependencies:** None - each fix is independent

**Scope:** No changes to root documentation needed - these are new smoke test endpoints with no observable behavior changes to documented features
