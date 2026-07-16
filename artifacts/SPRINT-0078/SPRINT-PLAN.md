# SPRINT-0078: Bugfix Plan

**Sprint Goal:** Fix missing healthz variant-specific smoke test endpoints.

**Date:** 2026-07-16

---

## Defect Summary

Two variant-specific health check endpoints are missing from the API, causing monitoring systems and load balancers to fail their deployment verification checks.

### Defect List

1. **VRTX-0454**: `/api/healthz-smoke-bugfix-ha-296486100` missing → returns 404, should return 200
2. **VRTX-0455**: `/api/healthz-smoke-bugfix-ha2-633156065` missing → returns 404, should return 200

---

## Root Cause Analysis

### Environment
- **Project:** Multi-tenant booking SaaS (Next.js 15 / React 19)
- **Route Type:** API endpoints
- **Routing:** Next.js App Router with file-based route generation
- **Build/Deploy:** Smoke test endpoints are pre-deployed identifiers for deployment verification

### Observation
The project contains numerous healthz smoke test endpoints under `/src/app/api/healthz-smoke-**/route.ts`, following a consistent pattern:

- **Path pattern:** `/api/healthz-smoke-bugfix-ha-<VARIANT_ID>` or `/api/healthz-smoke-bugfix-ha2-<VARIANT_ID>`
- **Response:** `{ "ok": true, "variant": "<VARIANT_ID>" }` (status 200)
- **Purpose:** Deployment verification for specific application variants
- **Properties:** Self-contained (no auth, no database, no external deps), designed for high-frequency polling (<100ms)
- **Example:** See `/src/app/api/healthz-smoke-bugfix-ha-197298697/route.ts`

### Root Cause
The two required endpoints are not present in the codebase:

1. **Missing:** `/src/app/api/healthz-smoke-bugfix-ha-296486100/route.ts`
   - **Expected:** Variant "296486100"
   - **Current behavior:** 404 Not Found
   - **Reason:** File/directory not created

2. **Missing:** `/src/app/api/healthz-smoke-bugfix-ha2-633156065/route.ts`
   - **Expected:** Variant "633156065"
   - **Current behavior:** 404 Not Found
   - **Reason:** File/directory not created

### Impact
- Monitoring systems cannot verify these specific application variants are deployed
- Load balancers fail deployment verification checks for these variants
- CI/CD smoke tests that rely on these endpoints will fail

---

## Fix Plan

### Strategy
Create the two missing endpoint files, following the existing pattern and documentation convention. Each endpoint:
- Is self-contained with zero dependencies (no middleware, no auth, no DB)
- Returns `{ "ok": true, "variant": "<VARIANT_ID>" }` with status 200
- Responds in <100ms
- Accepts GET requests

### Implementation Details

#### Fix 1: Create `/src/app/api/healthz-smoke-bugfix-ha-296486100/route.ts`
- **Variant ID:** `296486100`
- **Response:** `{ "ok": true, "variant": "296486100" }`
- **Status:** 200
- **Handler:** `export async function GET(): Promise<NextResponse>`
- **Template:** Copy existing pattern from `healthz-smoke-bugfix-ha-197298697`, update variant ID and comments

#### Fix 2: Create `/src/app/api/healthz-smoke-bugfix-ha2-633156065/route.ts`
- **Variant ID:** `633156065`
- **Response:** `{ "ok": true, "variant": "633156065" }`
- **Status:** 200
- **Handler:** `export async function GET(): Promise<NextResponse>`
- **Template:** Copy existing pattern from `healthz-smoke-bugfix-ha2-454075717`, update variant ID and comments

### Changes Summary
- **New files:** 2
- **Modified files:** 0
- **Deleted files:** 0
- **Test changes:** None (smoke test endpoints are verified by integration/deployment tests)
- **Documentation changes:** None (behavior is already fully documented in CLAUDE.md for health check patterns)

### Deployment Verification
After fix deployment:
```bash
curl http://localhost:3000/api/healthz-smoke-bugfix-ha-296486100
# Expected: {"ok":true,"variant":"296486100"} (HTTP 200)

curl http://localhost:3000/api/healthz-smoke-bugfix-ha2-633156065
# Expected: {"ok":true,"variant":"633156065"} (HTTP 200)
```

---

## Reviewer Note

⚠️ **Regression Test Requirement:** Both VRTX-0454 and VRTX-0455 defect fixes **must include regression tests** that assert the exact JSON response shape `{"ok":true,"variant":"<VARIANT_ID>"}` (no additional fields, no null values, strict format). This ensures monitoring systems and load balancers receive exactly the expected response structure for deployment verification. Tests should verify both the schema and the status code (200) together.

---

## Acceptance Criteria (at the sprint level)

- [x] Root-caused both defects: missing endpoint files
- [x] Documented RCA in this file
- [x] Created DEFECT ticket for VRTX-0454 with DoD criteria
- [x] Created DEFECT ticket for VRTX-0455 with DoD criteria
- [x] Created per-DEFECT `artifacts/SPRINT-0078/<TICKET-KEY>/PLAN.md` files
- [x] No updates to root docs (behavior is already covered in existing health check patterns)
- [ ] Endpoints implemented and tested during EXECUTION phase
