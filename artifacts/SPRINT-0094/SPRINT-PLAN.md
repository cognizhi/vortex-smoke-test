# SPRINT-0094 Bugfix Plan: Missing Health Check Endpoints

**Sprint Goal:** Implement three missing lightweight health check endpoints for variant-specific smoke testing.

**Status:** Planning Complete

---

## Executive Summary

This sprint addresses three missing smoke test health check endpoints that are currently returning 404 errors. These endpoints are simple, self-contained HTTP health checks with no dependencies (no database, no auth, no external calls), designed for load balancer and monitoring system integration.

### Defects Addressed
- VRTX-0546: `/healthz-smoke-bugfix-261077566` (missing)
- VRTX-0547: `/healthz-smoke-bugfix2-856253589` (missing)
- VRTX-0548: `/healthz-smoke-bugfix3-279760907` (missing)

---

## Root Cause Analysis

### Common RCA for All Three Defects

**Root Cause:** Missing Next.js route handler files

All three endpoints are missing their implementation files. The Next.js app is configured to serve API routes from `src/app/api/`, and a missing route results in a 404 response.

**Expected Behavior:** 
Each endpoint should return HTTP 200 with JSON body:
```json
{
  "ok": true,
  "variant": "<variant_id>"
}
```

**Actual Behavior:**
GET requests to these endpoints return HTTP 404 Not Found.

**Discovery Method:**
Verified by checking the filesystem for route handler directories:
- `/src/app/api/healthz-smoke-bugfix-261077566/` — does not exist
- `/src/app/api/healthz-smoke-bugfix2-856253589/` — does not exist
- `/src/app/api/healthz-smoke-bugfix3-279760907/` — does not exist

---

## Fix Strategy

### Implementation Pattern

Each endpoint follows an identical pattern established by existing smoke test health check endpoints (e.g., `/healthz-smoke-bugfix-487941300`):

1. **Directory Structure:** Create `src/app/api/{endpoint-name}/`
2. **Route Handler:** Create `route.ts` with a GET handler
3. **Behavior:** Return 200 status with `{"ok": true, "variant": "<variant_id>"}`
4. **No Dependencies:** Self-contained, no database queries, no authentication, no external calls

### Template Implementation

Each endpoint uses the Next.js App Router pattern:

```typescript
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '<variant_id>',
    },
    { status: 200 }
  );
}
```

### Per-Defect Fix Plans

#### VRTX-0546: `/healthz-smoke-bugfix-261077566`
- **Variant ID:** `261077566`
- **Fix Details:** See `artifacts/SPRINT-0094/VRTX-0546/PLAN.md`

#### VRTX-0547: `/healthz-smoke-bugfix2-856253589`
- **Variant ID:** `856253589`
- **Fix Details:** See `artifacts/SPRINT-0094/VRTX-0547/PLAN.md`

#### VRTX-0548: `/healthz-smoke-bugfix3-279760907`
- **Variant ID:** `279760907`
- **Fix Details:** See `artifacts/SPRINT-0094/VRTX-0548/PLAN.md`

---

## No Changes to Observable Behavior or Root Docs

This sprint adds three new endpoints that don't exist, so there are no changes to existing observable behavior. The root documentation (`AGENT.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DESIGN.md`) requires no updates.

---

## Acceptance Criteria

✅ Reproduce and verify all three 404 errors  
✅ Create PLAN.md for each DEFECT with RCA + fix implementation  
✅ Update DEFECT tickets with acceptance criteria per fix  
✅ Commit all planning artifacts  
✅ Ensure DEFECT tickets reference this sprint plan  

---

## No Cross-File Dependencies

Each endpoint is independent with no shared code or dependencies between fixes. However, all three are deployed to the same codebase and should be tested together.
