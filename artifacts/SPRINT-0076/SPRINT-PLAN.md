# SPRINT-0076 Bugfix Plan — Health Check Endpoints

## Overview

This sprint addresses two missing health check endpoints in the booking SaaS application:
- `GET /api/healthz-smoke-bugfix-582647444` (VRTX-0444)
- `GET /api/healthz-smoke-bugfix2-887319380` (VRTX-0445)

Both endpoints currently return 404 and should return 200 with a variant-specific JSON response.

## Root Cause Analysis

### Pattern Analysis

The application implements variant-specific health check endpoints for load balancing and monitoring:
- Located in `/src/app/api/healthz-smoke-bugfix-<variant>/route.ts`
- Each endpoint is self-contained (no database, no auth, no external calls)
- Returns `{ "ok": true, "variant": "<variant>" }` with HTTP 200
- Designed for high-frequency polling by Kubernetes probes and monitoring systems

**Existing endpoints** (confirmed):
- `/api/healthz-smoke-bugfix-449792264`
- `/api/healthz-smoke-bugfix-487941300`
- `/api/healthz-smoke-bugfix2-1007381648`
- `/api/healthz-smoke-bugfix2-1052557025`
- And many others (40+ variants total)

### Defects

#### VRTX-0444: Missing `/api/healthz-smoke-bugfix-582647444`
- **Issue**: GET request returns 404 instead of 200
- **Root cause**: Endpoint route file does not exist at `/src/app/api/healthz-smoke-bugfix-582647444/route.ts`
- **Fix**: Create the route file with standard health check response
- **Impact**: Monitoring systems cannot verify this variant is healthy
- **Scope**: Self-contained, requires only creating one file with ~40 lines of code

#### VRTX-0445: Missing `/api/healthz-smoke-bugfix2-887319380`
- **Issue**: GET request returns 404 instead of 200
- **Root cause**: Endpoint route file does not exist at `/src/app/api/healthz-smoke-bugfix2-887319380/route.ts`
- **Fix**: Create the route file with standard health check response
- **Impact**: Monitoring systems cannot verify this variant is healthy
- **Scope**: Self-contained, requires only creating one file with ~40 lines of code

## Implementation Plan

### File Structure
```
src/app/api/
├── healthz-smoke-bugfix-582647444/
│   └── route.ts          (new file)
└── healthz-smoke-bugfix2-887319380/
    └── route.ts          (new file)
```

### Each Endpoint Specifications

#### 1. `/api/healthz-smoke-bugfix-582647444`

**File**: `src/app/api/healthz-smoke-bugfix-582647444/route.ts`

**Response Contract**:
- HTTP Status: 200 OK
- Content-Type: application/json
- Body: `{ "ok": true, "variant": "582647444" }`

**Implementation**:
- Export an async `GET()` function
- Return `NextResponse.json({ ok: true, variant: "582647444" }, { status: 200 })`
- No dependencies (database, auth, external services)
- Target response time: <100ms

#### 2. `/api/healthz-smoke-bugfix2-887319380`

**File**: `src/app/api/healthz-smoke-bugfix2-887319380/route.ts`

**Response Contract**:
- HTTP Status: 200 OK
- Content-Type: application/json
- Body: `{ "ok": true, "variant": "887319380" }`

**Implementation**:
- Export an async `GET()` function
- Return `NextResponse.json({ ok: true, variant: "887319380" }, { status: 200 })`
- No dependencies (database, auth, external services)
- Target response time: <100ms

## Verification Strategy

1. **File Existence Check**: Verify both route files exist in the correct locations
2. **Build Verification**: Run `npm run build` to ensure no TypeScript or build errors
3. **Type Safety**: Run `npm run typecheck` to ensure strict type compliance
4. **Lint Check**: Run `npm run lint` to ensure code style compliance
5. **Runtime Test**: Use `curl` to verify endpoints return expected responses:
   ```bash
   curl http://localhost:3000/api/healthz-smoke-bugfix-582647444
   # Expected: {"ok":true,"variant":"582647444"}
   
   curl http://localhost:3000/api/healthz-smoke-bugfix2-887319380
   # Expected: {"ok":true,"variant":"887319380"}
   ```

## Changes Summary

- **New files**: 2 (two route.ts files)
- **Modified files**: 0
- **Lines of code**: ~80 (40 lines each)
- **Dependencies**: None
- **Breaking changes**: None
- **Migration required**: No

## Risk Assessment

**Risk Level**: Minimal

- No changes to existing code
- Self-contained endpoints with no dependencies
- No database changes
- No schema modifications
- Pattern follows established health check conventions
- Both files are isolated from each other and the rest of the codebase

---

**Per-ticket detailed plans are in**:
- `artifacts/SPRINT-0076/VRTX-0444/PLAN.md`
- `artifacts/SPRINT-0076/VRTX-0445/PLAN.md`
