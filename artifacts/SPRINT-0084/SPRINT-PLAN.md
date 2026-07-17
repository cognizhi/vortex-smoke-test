# SPRINT-0084 Bugfix Plan

## Overview
SPRINT-0084 fixes two missing health check variant endpoints that are currently returning 404 errors instead of the expected 200 response with variant identification. These are self-contained smoke test endpoints used by monitoring systems and load balancers to verify deployment and service health.

## Defects in Scope

### VRTX-0477: `/healthz-smoke-bugfix-ha-609817388` returns 404
### VRTX-0478: `/healthz-smoke-bugfix-ha2-1065754851` returns 404

---

## Root Cause Analysis (RCA)

### Problem
Two specific health check variant endpoints are not implemented:
- `GET /api/healthz-smoke-bugfix-ha-609817388` → Currently returns 404, should return 200
- `GET /api/healthz-smoke-bugfix-ha2-1065754851` → Currently returns 404, should return 200

### Root Cause
Missing route handler directories and `route.ts` files for these specific endpoints. The codebase has a catch-all dynamic route at `/api/healthz-smoke-bugfix-[...]/` that should theoretically handle these requests, but individual variant endpoints have been the pattern used for all previous sprints (SPRINT-0070 through SPRINT-0082). These two specific variants were never created as individual routes.

### Investigation
1. **Explored existing health check structure**: Found 46 existing `healthz-smoke-bugfix*` endpoint directories under `/src/app/api/`
2. **Identified pattern**: Each variant gets its own directory with a hardcoded `route.ts` file
3. **Verified expectations**: Cross-referenced with tests in `e2e/healthz-smoke-endpoints-sprint-0082.spec.ts`
4. **Confirmed missing endpoints**: Neither `/src/app/api/healthz-smoke-bugfix-ha-609817388/` nor `/src/app/api/healthz-smoke-bugfix-ha2-1065754851/` exist in the codebase

### Why This Matters
These are health check endpoints used by:
- Kubernetes readiness probes for pod orchestration
- Load balancers for traffic verification
- Monitoring systems (e.g., DataDog, Prometheus)
- Deployment verification pipelines

Missing endpoints cause monitoring systems to report the service as unhealthy even if it's functioning correctly, leading to potential service disruption.

---

## Fix Strategy

### High-Level Approach
Create two new route handler directories with hardcoded response files that return variant-specific health check responses.

### Implementation Details

#### Fix 1: Create `/api/healthz-smoke-bugfix-ha-609817388` endpoint
- **Location**: `src/app/api/healthz-smoke-bugfix-ha-609817388/route.ts`
- **Response**: `200 OK` with `{ "ok": true, "variant": "609817388" }`
- **Pattern**: Follows existing variant endpoint pattern (see `healthz-smoke-bugfix-ha-30297400` for reference)
- **Dependencies**: None (no database, no auth, no external calls)
- **Performance Target**: < 100ms (typical < 10ms)

#### Fix 2: Create `/api/healthz-smoke-bugfix-ha2-1065754851` endpoint
- **Location**: `src/app/api/healthz-smoke-bugfix-ha2-1065754851/route.ts`
- **Response**: `200 OK` with `{ "ok": true, "variant": "1065754851" }`
- **Pattern**: Follows existing variant endpoint pattern (see `healthz-smoke-bugfix-ha2-244944780` for reference)
- **Dependencies**: None (no database, no auth, no external calls)
- **Performance Target**: < 100ms (typical < 10ms)

### Why Hardcoded Routes Instead of Dynamic?
The `/api/healthz-smoke-bugfix-[...]/` dynamic catch-all route exists but historical pattern shows individual routes are the established convention. Using individual routes ensures:
1. Consistency with all previous sprints (SPRINT-0070 through SPRINT-0082)
2. Explicit, debuggable routes that appear in filesystem and routing tables
3. Direct control over variant identifiers in responses

---

## Acceptance Criteria per Defect

See individual `PLAN.md` files:
- `artifacts/SPRINT-0084/VRTX-0477/PLAN.md` — VRTX-0477 fix details
- `artifacts/SPRINT-0084/VRTX-0478/PLAN.md` — VRTX-0478 fix details

---

## Testing Strategy

### Unit Tests
Existing test patterns in `e2e/healthz-smoke-endpoints-sprint-0082.spec.ts` confirm expected behavior:
- Endpoint returns HTTP 200
- Response body is valid JSON
- Response includes `ok: true` and `variant: "<id>"`
- Content-Type is `application/json`
- Response completes within 1 second
- Concurrent requests succeed

### Test Execution
- Add SPRINT-0084 tests to `e2e/healthz-smoke-endpoints-sprint-0084.spec.ts` (following SPRINT-0082 pattern)
- Run: `bun run test:e2e` or `npx playwright test e2e/healthz-smoke-endpoints-sprint-0084.spec.ts`

### Reviewer Note
**Both VRTX-0477 and VRTX-0478 must include regression tests that explicitly assert the exact JSON response shape**: `{ "ok": true, "variant": "<id>" }`. The test must validate that the `variant` field contains the correct numeric identifier (609817388 for ha endpoint, 1065754851 for ha2 endpoint) to ensure contract compliance with monitoring systems and load balancers that depend on this specific structure.

---

## Observable Behavior Change
✅ **YES** — These endpoints will now respond with 200 instead of 404
- Two previously failing health checks will now succeed
- Monitoring systems will correctly report service as healthy for these variants
- Update to root docs (PRODUCT.md/ARCHITECTURE.md) may be required if health check endpoint registry is documented

---

## Files Modified
1. **New**: `src/app/api/healthz-smoke-bugfix-ha-609817388/route.ts`
2. **New**: `src/app/api/healthz-smoke-bugfix-ha2-1065754851/route.ts`
3. **New**: `e2e/healthz-smoke-endpoints-sprint-0084.spec.ts` (optional but recommended for parity with prior sprints)

---

## Git Commit
Single commit message:
```
fix(sprint-0084): [smoke] Add missing healthz-smoke-bugfix variant endpoints

- Add /api/healthz-smoke-bugfix-ha-609817388 endpoint (VRTX-0477)
- Add /api/healthz-smoke-bugfix-ha2-1065754851 endpoint (VRTX-0478)

Both endpoints return 200 with variant identification for deployment verification.
Monitoring systems can now verify these specific application variants are deployed
and healthy. Follows existing pattern from SPRINT-0070 through SPRINT-0082.
```

---

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Forgetting to add E2E tests | Use SPRINT-0082 tests as template; commit tests with route files |
| Typos in variant IDs | Double-check against ticket descriptions; test locally before push |
| Performance regression | Health checks have no dependencies; trivial inline functions will have <10ms latency |

---

## Sign-Off
- **RCA Completed**: Route handler files missing for these specific variants
- **Fix Strategy Verified**: Matches existing pattern from 46 other variant endpoints
- **Tests Identified**: Use SPRINT-0082 as template, extend to SPRINT-0084
- **Ready for Implementation**: ✅
