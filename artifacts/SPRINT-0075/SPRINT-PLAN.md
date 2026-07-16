# SPRINT-0075 Bugfix Plan

**Sprint Goal:** Fix missing health check endpoints (smoke test variants)

**Date:** 2026-07-16

---

## Summary

This sprint addresses two missing health check endpoints required for deployment verification and monitoring. Both defects follow the same pattern: a smoke test health check endpoint is missing from the codebase, returning 404 when accessed, but should return 200 with a JSON response containing the variant identifier.

---

## Defect Analysis

### VRTX-0439: Missing `/api/healthz-smoke-bugfix-1022820422` endpoint

**Root Cause:**
The endpoint file `src/app/api/healthz-smoke-bugfix-1022820422/route.ts` does not exist in the codebase.

**Current Behavior:**
- Request: `GET /api/healthz-smoke-bugfix-1022820422`
- Response: 404 Not Found

**Expected Behavior:**
- Request: `GET /api/healthz-smoke-bugfix-1022820422`
- Response: 200 OK with body `{"ok":true,"variant":"1022820422"}`

**Impact:**
Deployment verification and monitoring systems cannot validate that this specific application variant is deployed and reachable. This affects smoke testing and health check monitoring for this variant.

**Fix Plan:**
Create a new route file `src/app/api/healthz-smoke-bugfix-1022820422/route.ts` following the established pattern of other health check endpoints. The endpoint should:
- Accept GET requests only
- Return a 200 status with JSON body `{"ok":true,"variant":"1022820422"}`
- Require no authentication or database access
- Be self-contained for fast response times

**Acceptance Criteria:**
- Route file created at `src/app/api/healthz-smoke-bugfix-1022820422/route.ts`
- GET request to `/api/healthz-smoke-bugfix-1022820422` returns status 200
- Response body is exactly `{"ok":true,"variant":"1022820422"}`
- No authentication or database dependencies
- Endpoint can be verified with: `curl -s http://localhost:3000/api/healthz-smoke-bugfix-1022820422 | jq`

---

### VRTX-0440: Missing `/api/healthz-smoke-bugfix2-712753350` endpoint

**Root Cause:**
The endpoint file `src/app/api/healthz-smoke-bugfix2-712753350/route.ts` does not exist in the codebase.

**Current Behavior:**
- Request: `GET /api/healthz-smoke-bugfix2-712753350`
- Response: 404 Not Found

**Expected Behavior:**
- Request: `GET /api/healthz-smoke-bugfix2-712753350`
- Response: 200 OK with body `{"ok":true,"variant":"712753350"}`

**Impact:**
Deployment verification and monitoring systems cannot validate that this specific application variant is deployed and reachable. This affects smoke testing and health check monitoring for this variant.

**Fix Plan:**
Create a new route file `src/app/api/healthz-smoke-bugfix2-712753350/route.ts` following the established pattern of other health check endpoints. The endpoint should:
- Accept GET requests only
- Return a 200 status with JSON body `{"ok":true,"variant":"712753350"}`
- Require no authentication or database access
- Be self-contained for fast response times

**Acceptance Criteria:**
- Route file created at `src/app/api/healthz-smoke-bugfix2-712753350/route.ts`
- GET request to `/api/healthz-smoke-bugfix2-712753350` returns status 200
- Response body is exactly `{"ok":true,"variant":"712753350"}`
- No authentication or database dependencies
- Endpoint can be verified with: `curl -s http://localhost:3000/api/healthz-smoke-bugfix2-712753350 | jq`

---

## Implementation Notes

Both fixes follow the same pattern established by existing health check endpoints (e.g., `/api/healthz-smoke-800427409`). Each endpoint:

1. Is a self-contained Next.js API route with no dependencies
2. Returns a simple JSON response with status 200
3. Includes documentation explaining the purpose and usage
4. Is designed for high-frequency polling by monitoring/load balancer systems
5. Has minimal response time requirements (target < 100ms, typical < 10ms)

The fixes do not require any changes to:
- Database schema or migrations
- Existing routes or middleware
- Authentication or authorization logic
- Root documentation (PRODUCT.md, ARCHITECTURE.md, DESIGN.md, AGENT.md)

---

## References

- Existing health check endpoint example: `src/app/api/healthz-smoke-800427409/route.ts`
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Per-ticket RCA and fix details: See `artifacts/SPRINT-0075/VRTX-0439/PLAN.md` and `artifacts/SPRINT-0075/VRTX-0440/PLAN.md`
