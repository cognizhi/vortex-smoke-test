# SPRINT-0068 Bugfix Plan

## Overview

SPRINT-0068 addresses two missing health-check endpoints that are required for smoke testing and monitoring. Both endpoints are lightweight, stateless health checks with no database or auth dependencies.

---

## Defect Summary

### VRTX-0384: `/healthz-smoke-bugfix-20499480` returns 404

**Reproduction:**
```bash
curl http://localhost:3000/healthz-smoke-bugfix-20499480
# Currently returns: 404 Not Found
# Expected: 200 OK with {"ok":true,"variant":"20499480"}
```

**Root Cause:**
The endpoint handler at `src/app/api/healthz-smoke-bugfix-20499480/route.ts` does not exist. In Next.js, API routes are defined by creating a file at the corresponding path, and Next.js automatically routes HTTP requests to the handler. Since the directory and `route.ts` file are missing, the request returns a 404.

**Fix Plan:**
Create the missing endpoint by:
1. Creating directory: `src/app/api/healthz-smoke-bugfix-20499480/`
2. Creating file: `src/app/api/healthz-smoke-bugfix-20499480/route.ts`
3. Implementing a GET handler that returns `{ "ok": true, "variant": "20499480" }` with a 200 status code
4. No database, auth, or external dependencies required

**Follow-up Document:**
See `artifacts/SPRINT-0068/VRTX-0384/PLAN.md` for implementation details.

---

### VRTX-0385: `/healthz-smoke-bugfix2-156326201` returns 404

**Reproduction:**
```bash
curl http://localhost:3000/healthz-smoke-bugfix2-156326201
# Currently returns: 404 Not Found
# Expected: 200 OK with {"ok":true,"variant":"156326201"}
```

**Root Cause:**
The endpoint handler at `src/app/api/healthz-smoke-bugfix2-156326201/route.ts` does not exist. Like VRTX-0384, this is a missing Next.js API route that should be auto-discovered and mounted, but the underlying file structure is absent.

**Fix Plan:**
Create the missing endpoint by:
1. Creating directory: `src/app/api/healthz-smoke-bugfix2-156326201/`
2. Creating file: `src/app/api/healthz-smoke-bugfix2-156326201/route.ts`
3. Implementing a GET handler that returns `{ "ok": true, "variant": "156326201" }` with a 200 status code
4. No database, auth, or external dependencies required

**Follow-up Document:**
See `artifacts/SPRINT-0068/VRTX-0385/PLAN.md` for implementation details.

---

## Architecture Impact

- **Scope:** Strictly isolated to new API endpoints; no schema, auth, or platform changes
- **Dependencies:** None. Each endpoint is self-contained and independent
- **Observable Behavior Changes:** Two new public endpoints become available for health checks and smoke testing
- **Root Docs Update:** Not required — these are new endpoints with no impact on existing functionality

---

## Fix Dependencies

- **VRTX-0384** and **VRTX-0385** are independent and can be developed in parallel
- No other tickets in this sprint depend on these fixes
- No shared file changes; each endpoint is isolated

---

## Testing Strategy

Each endpoint will be tested via:
1. **Functional test:** `curl http://localhost:3000/healthz-smoke-bugfix-20499480` returns 200 with correct JSON
2. **Functional test:** `curl http://localhost:3000/healthz-smoke-bugfix2-156326201` returns 200 with correct JSON
3. **Integration:** Verify endpoints remain available under load (smoke test harness)
4. **No auth/db access:** Confirm endpoints return immediately without database queries or auth checks

---

## Acceptance Criteria

For this planning document:
- [x] Root-cause analysis completed for each defect
- [x] Fix plan documented with technical details
- [x] DEFECT tickets exist (see below)
- [x] Per-ticket PLAN.md files created (see below)
- [x] No root docs changes needed
- [x] Ready for EXECUTION phase

---

## Linked DEFECT Tickets

| Ticket | Title | Plan Document |
|--------|-------|---------------|
| VRTX-0384 | Add missing /healthz-smoke-bugfix-20499480 endpoint | `artifacts/SPRINT-0068/VRTX-0384/PLAN.md` |
| VRTX-0385 | Add missing /healthz-smoke-bugfix2-156326201 endpoint | `artifacts/SPRINT-0068/VRTX-0385/PLAN.md` |
