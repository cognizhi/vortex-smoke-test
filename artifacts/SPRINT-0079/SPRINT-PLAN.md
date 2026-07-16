# SPRINT-0079: Bugfix Plan

**Sprint Goal:** Fix missing visual QA smoke test health check endpoint.

**Date:** 2026-07-16

---

## Defect Summary

One health check endpoint is missing from the API, causing visual QA verification tests to fail.

### Defect List

1. **VRTX-0459**: `/api/healthz-visual-qa-215475973` missing → returns 404, should return 200

---

## Root Cause Analysis

### Environment
- **Project:** Multi-tenant booking SaaS (Next.js 15 / React 19)
- **Route Type:** API endpoint
- **Routing:** Next.js App Router with file-based route generation
- **Build/Deploy:** Visual QA smoke test endpoint for deployment verification

### Observation
The project contains numerous healthz smoke test endpoints under `/src/app/api/healthz-smoke-**/route.ts` and `/src/app/api/healthz-**/route.ts`, following established patterns:

- **Path pattern:** `/api/healthz-<IDENTIFIER>` 
- **Response formats vary:** Some include variant IDs, others include timestamps, others minimal
- **Purpose:** Deployment verification and health monitoring
- **Properties:** Self-contained (no auth, no database, no external deps), designed for quick polling
- **Example patterns:**
  - Simple: `GET /api/health` → `{"status":"healthy","timestamp":"2026-07-16T..."}`
  - With variant: `GET /api/healthz-smoke-276127630-a` → `{"ok":true,"variant":"276127630"}`
  - Target (simpler): `GET /api/healthz-visual-qa-215475973` → `{"ok":true}`

### Root Cause
The required endpoint is not present in the codebase:

1. **Missing:** `/src/app/api/healthz-visual-qa-215475973/route.ts`
   - **Expected response:** `{"ok":true}` with status 200
   - **Current behavior:** 404 Not Found
   - **Reason:** File/directory not created

### Impact
- Visual QA automation cannot verify endpoint availability
- CI/CD smoke tests that rely on this endpoint will fail
- Deployment verification for visual QA build incomplete

---

## Fix Plan

### Strategy
Create the missing endpoint file, following the simpler health check pattern (no variant ID needed). The endpoint:
- Is self-contained with zero dependencies (no middleware, no auth, no DB)
- Returns `{ "ok": true }` with status 200
- Responds quickly (<100ms target, typical <10ms)
- Accepts GET requests

### Implementation Details

#### Fix 1: Create `/src/app/api/healthz-visual-qa-215475973/route.ts`
- **Endpoint ID:** `visual-qa-215475973`
- **Response:** `{ "ok": true }`
- **Status:** 200
- **Handler:** `export async function GET(): Promise<NextResponse>`
- **Pattern:** Simplified health check (no variant tracking needed)
- **Template:** Based on existing healthz patterns, minimal response

### Changes Summary
- **New files:** 1
- **Modified files:** 0
- **Deleted files:** 0
- **Test changes:** None (verified by integration/deployment tests)
- **Documentation changes:** None (pattern already documented in CLAUDE.md)

### Deployment Verification
After fix deployment:
```bash
curl http://localhost:3000/api/healthz-visual-qa-215475973
# Expected: {"ok":true} (HTTP 200)
```

---

## Acceptance Criteria (at the sprint level)

- [x] Root-caused the defect: missing endpoint file
- [x] Documented RCA in this file
- [x] Created DEFECT ticket for VRTX-0459 with DoD criteria
- [x] Created per-DEFECT `artifacts/SPRINT-0079/VRTX-0459/PLAN.md`
- [x] No updates to root docs (behavior is already covered in existing health check patterns)
- [ ] Endpoint implemented and tested during EXECUTION phase
