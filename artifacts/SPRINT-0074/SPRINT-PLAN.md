# SPRINT-0074 Bugfix Plan

**Sprint:** SPRINT-0074  
**Type:** Bugfix  
**Planning Date:** 2026-07-16  
**Committed Tickets:** VRTX-0434, VRTX-0435  

---

## Executive Summary

This sprint addresses two missing healthz smoke test endpoints that currently return 404 instead of the expected health check responses. Both defects stem from the same root cause: missing Next.js route handler files. Fixes are straightforward and low-risk: create two new endpoint files following the established pattern used by 20+ existing healthz-smoke-* endpoints in the codebase.

**Estimated Effort:** ~15 minutes (straightforward file creation)  
**Risk Level:** Minimal (self-contained, no dependencies, no shared state)  
**Observable Behavior Changes:** None (only adds missing endpoints)

---

## Defects & Root Causes

### VRTX-0434: /api/healthz-smoke-bugfix-804297523 returns 404

**Description:**  
GET `/api/healthz-smoke-bugfix-804297523` currently returns HTTP 404. Expected: HTTP 200 with response body `{ "ok": true, "variant": "804297523" }`.

**Root Cause:**  
The route handler file `src/app/api/healthz-smoke-bugfix-804297523/route.ts` does not exist. Next.js routing cannot locate a handler and falls through to the 404 catch-all.

**Pattern Baseline:**  
Examined similar endpoints:
- `src/app/api/healthz-smoke-bugfix-20499480/route.ts` ✓ exists, follows expected pattern
- `src/app/api/healthz-smoke-bugfix-254027906/route.ts` ✓ exists, follows expected pattern
- 30+ other healthz-smoke-* variants ✓ all exist

All working endpoints use the same self-contained pattern: no database, no auth, fast response, variant identification in JSON body.

**Fix Plan:**  
Create `src/app/api/healthz-smoke-bugfix-804297523/route.ts` following the established Next.js API route pattern. See `artifacts/SPRINT-0074/VRTX-0434/PLAN.md` for full specification.

---

### VRTX-0435: /api/healthz-smoke-bugfix2-1027966570 returns 404

**Description:**  
GET `/api/healthz-smoke-bugfix2-1027966570` currently returns HTTP 404. Expected: HTTP 200 with response body `{ "ok": true, "variant": "1027966570" }`.

**Root Cause:**  
The route handler file `src/app/api/healthz-smoke-bugfix2-1027966570/route.ts` does not exist. Next.js routing cannot locate a handler and falls through to the 404 catch-all.

**Pattern Baseline:**  
Examined similar endpoints:
- `src/app/api/healthz-smoke-bugfix2-156326201/route.ts` ✓ exists, follows expected pattern
- `src/app/api/healthz-smoke-bugfix2-691130485/route.ts` ✓ exists, follows expected pattern
- 30+ other healthz-smoke-* variants ✓ all exist

All working endpoints use the same self-contained pattern: no database, no auth, fast response, variant identification in JSON body.

**Fix Plan:**  
Create `src/app/api/healthz-smoke-bugfix2-1027966570/route.ts` following the established Next.js API route pattern. See `artifacts/SPRINT-0074/VRTX-0435/PLAN.md` for full specification.

---

## Implementation Notes

### No Observable Behavior Changes

These fixes only **add missing endpoints**; no existing behavior changes. Root docs (AGENT.md, PRODUCT.md, ARCHITECTURE.md, DESIGN.md) require no updates.

### File Creation Pattern

Both fixes follow the identical pattern:
1. Create directory: `src/app/api/healthz-smoke-{variant}/`
2. Create route handler: `src/app/api/healthz-smoke-{variant}/route.ts`
3. Export `async function GET()` that returns `NextResponse.json({ ok: true, variant: "<variant-id>" }, { status: 200 })`
4. Include JSDoc comments for consistency with existing endpoints

### Verification

Each fix is verified by:
- Manual curl/fetch to confirm HTTP 200 response
- Response body matches `{ "ok": true, "variant": "<id>" }` exactly
- Content-Type header is `application/json`
- Response time < 100ms (typical < 10ms)

Automated e2e tests in `e2e/healthz-smoke-endpoints.spec.ts` will validate the new endpoints once committed.

### Dependencies

No inter-ticket dependencies. Both fixes are independent; they touch different file paths and can be implemented in parallel.

---

## Artifacts

- **VRTX-0434 Plan:** `artifacts/SPRINT-0074/VRTX-0434/PLAN.md`
- **VRTX-0435 Plan:** `artifacts/SPRINT-0074/VRTX-0435/PLAN.md`

---

## Acceptance Criteria for This Sprint

- [x] Root-cause analysis complete for both defects; documented in this SPRINT-PLAN.md
- [x] Per-defect PLAN.md files created with full fix specifications
- [x] Defect tickets VRTX-0434 and VRTX-0435 exist with acceptance criteria defined
- [x] No observable behavior changes (only adds missing endpoints)
- [x] Root docs (AGENT.md, PRODUCT.md, ARCHITECTURE.md, DESIGN.md) require no updates
- [ ] Defect fixes committed by engineer (@engineer) on ticket branch per PLAN.md
- [ ] All commits pushed to remote
- [ ] Ticket VRTX-0436 transitioned to "done"
