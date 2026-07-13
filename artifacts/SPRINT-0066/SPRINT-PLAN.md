# SPRINT-0066: Bugfix Plan — Missing Smoke Test Healthz Endpoints

**Sprint Goal:** Restore missing variant-specific health check endpoints for smoke testing and monitoring.

## Overview

SPRINT-0066 addresses two missing healthz smoke test endpoints that have been reported as returning 404 instead of 200. These endpoints are self-contained health checks designed for Kubernetes readiness probes and load balancer monitoring — no auth, no database, no external dependencies.

---

## Root Cause Analysis

### Current State

The codebase contains a reference implementation for variant-specific healthz endpoints:
- **Base pattern:** `/api/healthz-smoke` returns `{ data: { ok: true }, error: null }`
- **Variant pattern:** `/api/healthz-smoke-bugfix-<variant>` returns `{ ok: true, variant: "<variant>" }` (e.g., `healthz-smoke-bugfix-449792264`)

### Missing Endpoints

Two specific variant endpoints are expected by monitoring systems but do not exist in the codebase:

1. **VRTX-0371: `/api/healthz-smoke-bugfix-488908419`**
   - **Current behavior:** Returns 404
   - **Expected behavior:** Returns 200 with `{ ok: true, variant: "488908419" }`
   - **Repro:** `curl http://localhost:3000/api/healthz-smoke-bugfix-488908419`

2. **VRTX-0372: `/api/healthz-smoke-bugfix2-471601007`**
   - **Current behavior:** Returns 404
   - **Expected behavior:** Returns 200 with `{ ok: true, variant: "471601007" }`
   - **Repro:** `curl http://localhost:3000/api/healthz-smoke-bugfix2-471601007`

### Root Cause

Both endpoints are missing from the file system. The Next.js app routing requires a directory structure:
```
src/app/api/[endpoint-name]/route.ts
```

Both `src/app/api/healthz-smoke-bugfix-488908419/` and `src/app/api/healthz-smoke-bugfix2-471601007/` directories do not exist, so Next.js returns 404 when these paths are requested.

The monitoring systems are polling these specific variants as part of smoke testing and version/variant tracking for deployment validation.

---

## Fix Strategy

### Approach

Create the two missing endpoint directories and route handlers following the existing variant pattern:

1. **For VRTX-0371:** Create `src/app/api/healthz-smoke-bugfix-488908419/route.ts`
2. **For VRTX-0372:** Create `src/app/api/healthz-smoke-bugfix2-471601007/route.ts`

Both handlers will:
- Return HTTP 200 with the response body `{ ok: true, variant: "<variant_id>" }`
- Include appropriate JSDoc comments explaining the endpoint's purpose
- Have zero dependencies (no database, no auth, no external calls)
- Be suitable for high-frequency polling by load balancers and monitoring systems

### Implementation Details

**File 1: `src/app/api/healthz-smoke-bugfix-488908419/route.ts`**
- Variant ID: `"488908419"`
- Endpoint: GET `/api/healthz-smoke-bugfix-488908419`
- Response: `{ ok: true, variant: "488908419" }`

**File 2: `src/app/api/healthz-smoke-bugfix2-471601007/route.ts`**
- Variant ID: `"471601007"`
- Endpoint: GET `/api/healthz-smoke-bugfix2-471601007`
- Response: `{ ok: true, variant: "471601007" }`

### Definition of Done

- [ ] Endpoint directory created
- [ ] route.ts file created with GET handler
- [ ] Returns 200 status code
- [ ] Returns correct JSON response with variant identifier
- [ ] No database or auth required
- [ ] Manual test passes: `curl http://localhost:3000/api/healthz-smoke-bugfix<variant>` returns 200 with expected body
- [ ] Dev server test passes: `npm run dev` and endpoint is accessible
- [ ] Code follows existing pattern (JSDoc comments, formatting, structure)

---

## Testing

### Manual Smoke Tests

```bash
# Test VRTX-0371
curl http://localhost:3000/api/healthz-smoke-bugfix-488908419
# Expected: { "ok": true, "variant": "488908419" }

# Test VRTX-0372
curl http://localhost:3000/api/healthz-smoke-bugfix2-471601007
# Expected: { "ok": true, "variant": "471601007" }
```

### Verification Steps

1. Start dev server: `npm run dev`
2. In another terminal, run both curl commands above
3. Verify HTTP 200 status code
4. Verify response body matches expected JSON
5. Verify response time < 100ms

---

## Affected Files

- `src/app/api/healthz-smoke-bugfix-488908419/route.ts` (new)
- `src/app/api/healthz-smoke-bugfix2-471601007/route.ts` (new)

## Dependencies

None. These are independent fixes that do not affect other code paths or require coordination.

---

## Risk Assessment

**Risk Level:** Very Low

- No shared code paths affected
- No database changes
- No auth or security implications
- Self-contained, isolated endpoints
- Follows proven existing pattern (hundreds of similar healthz endpoints already in codebase)
- Zero impact on feature functionality or user experience

---

## Sprint Tickets

See per-ticket PLAN.md files:
- `artifacts/SPRINT-0066/VRTX-0371/PLAN.md`
- `artifacts/SPRINT-0066/VRTX-0372/PLAN.md`
