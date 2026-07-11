# SPRINT-0056 Bugfix Plan

## Overview
SPRINT-0056 addresses two smoke test endpoint defects where expected health check endpoints return 404 instead of 200 with the expected JSON response.

**Committed Defects:**
- VRTX-0297: GET /api/healthz-smoke-bugfix-787744862 returns 404 (should return 200)
- VRTX-0298: GET /api/healthz-smoke-bugfix2-780855936 returns 404 (should return 200)

---

## Root Cause Analysis (RCA)

### Defect VRTX-0297: Missing endpoint /api/healthz-smoke-bugfix-787744862

**Symptoms:**
- GET request to `/api/healthz-smoke-bugfix-787744862` returns HTTP 404
- Expected response: HTTP 200 with `{"ok": true, "variant": "787744862"}`

**RCA:**
The endpoint route handler is completely missing from the codebase. A directory `/workspace/repo/src/app/api/healthz-smoke-bugfix-787744862/` and its `route.ts` handler do not exist.

**Pattern Analysis:**
The codebase contains 44+ similar smoke test endpoints (e.g., `/api/healthz-smoke-bugfix-1021340604/`, `/api/healthz-smoke-28611693/`, etc.), each following an identical pattern:
- Directory: `src/app/api/healthz-smoke-{variant}/` (Next.js App Router)
- Handler: `route.ts` exporting `GET` function
- Response: HTTP 200 with `{ ok: true, variant: "{variant}" }` (no dependencies, no auth, no DB)

**Example (existing endpoint):**
```typescript
// src/app/api/healthz-smoke-bugfix-1021340604/route.ts
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '1021340604' },
    { status: 200 }
  );
}
```

**Fix:** Create the missing directory and route handler following the established pattern.

---

### Defect VRTX-0298: Missing endpoint /api/healthz-smoke-bugfix2-780855936

**Symptoms:**
- GET request to `/api/healthz-smoke-bugfix2-780855936` returns HTTP 404
- Expected response: HTTP 200 with `{"ok": true, "variant": "780855936"}`

**RCA:**
Identical to VRTX-0297: the endpoint route handler is missing. Directory `/workspace/repo/src/app/api/healthz-smoke-bugfix2-780855936/` and its `route.ts` do not exist.

**Pattern:** Same smoke test endpoint pattern as VRTX-0297.

**Fix:** Create the missing directory and route handler following the established pattern.

---

## Fix Summary

Both defects require **identical fixes**: creating a new route handler directory and `route.ts` file for each endpoint.

- **Files to create:**
  1. `src/app/api/healthz-smoke-bugfix-787744862/route.ts`
  2. `src/app/api/healthz-smoke-bugfix2-780855936/route.ts`

- **Implementation:** Boilerplate Next.js API endpoint with no dependencies, following the existing pattern in the codebase.

- **No code reuse refactoring needed:** The pattern is simple and duplicated by design (variant identifier must be hardcoded in each endpoint).

- **No root doc updates:** Observable behavior is adding new endpoints; no changes to existing behavior or architecture.

- **Dependencies:** None between fixes; can be implemented in parallel.

---

## Per-Ticket Plans

See linked ticket-specific PLAN.md files:
- VRTX-0297: `artifacts/SPRINT-0056/VRTX-0297/PLAN.md`
- VRTX-0298: `artifacts/SPRINT-0056/VRTX-0298/PLAN.md`
