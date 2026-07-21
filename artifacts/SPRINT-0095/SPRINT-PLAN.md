# SPRINT-0095 Bugfix Plan

**Sprint Goal:** Fix three missing healthz-smoke-bugfix variant endpoints that return 404 instead of 200 with variant identification.

**Date:** 2026-07-21

## Overview

This sprint addresses three defects in the health check endpoint suite. Each defect is a missing lightweight smoke test endpoint that should return a 200 status with JSON payload `{"ok":true,"variant":"<variant-id>"}` but currently returns 404 Not Found.

These endpoints are used by Kubernetes readiness probes, load balancers, and monitoring services to verify that the service is healthy and to identify the specific build variant. They are self-contained (no database, no auth, no external dependencies) and should respond in < 100ms.

---

## Defect RCA & Fixes

### VRTX-0552: Missing /healthz-smoke-bugfix-863883409 endpoint

**Root Cause:**
The endpoint directory `/src/app/api/healthz-smoke-bugfix-863883409/` and its `route.ts` handler do not exist. The pattern established by existing variant endpoints (e.g., `healthz-smoke-bugfix-ha2-244944780`) is well-documented but not applied to this variant.

**Expected Behavior:**
- URL: `/api/healthz-smoke-bugfix-863883409`
- HTTP Method: GET
- Response Status: 200
- Response Body: `{"ok":true,"variant":"863883409"}`
- Latency: < 100ms (typical < 10ms)
- Dependencies: None (no auth, no database, no external calls)

**Fix Plan:**
Create the missing endpoint:
1. Create directory: `src/app/api/healthz-smoke-bugfix-863883409/`
2. Create handler: `src/app/api/healthz-smoke-bugfix-863883409/route.ts` with the standard variant-health-check pattern
3. Response: `NextResponse.json({ok:true, variant:"863883409"}, {status:200})`
4. Verify response matches contract

**Reference Implementation:** See `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts` for the exact pattern.

---

### VRTX-0553: Missing /healthz-smoke-bugfix2-813098132 endpoint

**Root Cause:**
The endpoint directory `/src/app/api/healthz-smoke-bugfix2-813098132/` and its `route.ts` handler do not exist. This follows the same pattern as VRTX-0552 — a missing variant endpoint.

**Expected Behavior:**
- URL: `/api/healthz-smoke-bugfix2-813098132`
- HTTP Method: GET
- Response Status: 200
- Response Body: `{"ok":true,"variant":"813098132"}`
- Latency: < 100ms (typical < 10ms)
- Dependencies: None (no auth, no database, no external calls)

**Fix Plan:**
Create the missing endpoint:
1. Create directory: `src/app/api/healthz-smoke-bugfix2-813098132/`
2. Create handler: `src/app/api/healthz-smoke-bugfix2-813098132/route.ts` with the standard variant-health-check pattern
3. Response: `NextResponse.json({ok:true, variant:"813098132"}, {status:200})`
4. Verify response matches contract

**Reference Implementation:** See `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts` for the exact pattern.

---

### VRTX-0554: Missing /healthz-smoke-bugfix3-739668299 endpoint

**Root Cause:**
The endpoint directory `/src/app/api/healthz-smoke-bugfix3-739668299/` and its `route.ts` handler do not exist. This is the third missing variant endpoint in the same family.

**Expected Behavior:**
- URL: `/api/healthz-smoke-bugfix3-739668299`
- HTTP Method: GET
- Response Status: 200
- Response Body: `{"ok":true,"variant":"739668299"}`
- Latency: < 100ms (typical < 10ms)
- Dependencies: None (no auth, no database, no external calls)

**Fix Plan:**
Create the missing endpoint:
1. Create directory: `src/app/api/healthz-smoke-bugfix3-739668299/`
2. Create handler: `src/app/api/healthz-smoke-bugfix3-739668299/route.ts` with the standard variant-health-check pattern
3. Response: `NextResponse.json({ok:true, variant:"739668299"}, {status:200})`
4. Verify response matches contract

**Reference Implementation:** See `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts` for the exact pattern.

---

## Severity & Impact

**Severity:** P1 (High)
- These endpoints are critical infrastructure for deployment verification and monitoring.
- Missing endpoints cause load balancers and orchestration platforms to fail health checks.
- Blocking production deployments and causing service unavailability.

**Impact Scope:**
- Kubernetes readiness/liveness probes fail
- Load balancer health checks fail
- Canary deployments unable to verify variant-specific health
- Monitoring systems cannot identify which variant is running

---

## Testing Strategy

Each fix includes:
1. **Unit/Integration Test:** Test the endpoint returns 200 with correct JSON contract
2. **Regression Test:** Verify the variant ID is correctly embedded in response
3. **Response Time Test:** Confirm response time < 100ms
4. **No Database Dependency Test:** Verify endpoint works without database access

Existing test patterns can be found in:
- `src/__tests__/regression/vrtx-0546-api-healthz-smoke-bugfix-261077566.test.ts`
- `e2e/healthz-smoke-endpoints-sprint-0094.spec.ts`

---

## Files Modified

```
src/app/api/healthz-smoke-bugfix-863883409/route.ts (NEW)
src/app/api/healthz-smoke-bugfix2-813098132/route.ts (NEW)
src/app/api/healthz-smoke-bugfix3-739668299/route.ts (NEW)
```

No changes to:
- `AGENT.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DESIGN.md` (observable behavior is self-evident in the endpoint implementation; no architectural changes)
- Database schema or migrations
- Existing endpoints or configuration

---

## Implementation Order

All three fixes are independent and can be implemented in parallel:
1. No shared dependencies between endpoints
2. No overlapping file changes
3. Each endpoint is self-contained

**Recommended parallelization:** All three tasks can be assigned to the same engineer concurrently.

---

## Acceptance Criteria for Sprint

- [ ] All three endpoints implemented and return 200 with correct JSON contract
- [ ] All endpoints respond in < 100ms
- [ ] All endpoints work without database or auth dependencies
- [ ] Response bodies match specified variant IDs exactly
- [ ] No regressions to existing endpoints
- [ ] All tasks marked as done

---

## References

- **Existing Variant Endpoint:** `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts`
- **Base Endpoint:** `src/app/api/healthz-smoke/route.ts`
- **Related Test Fixtures:** `src/__tests__/regression/vrtx-0546-api-healthz-smoke-bugfix-261077566.test.ts`
- **E2E Tests:** `e2e/healthz-smoke-endpoints-sprint-0094.spec.ts`
