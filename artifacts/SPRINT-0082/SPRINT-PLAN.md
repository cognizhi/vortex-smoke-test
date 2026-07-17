# SPRINT-0082: Bugfix Plan

## Sprint Goal
Fix missing health check endpoints that are returning 404 errors instead of proper health status responses.

## Defects Identified

### VRTX-0469 & VRTX-0470: Missing Health Check Endpoints

**Issue Summary:**
Two variant-specific health check endpoints are missing from the codebase, causing 404 errors when accessed:
- `GET /api/healthz-smoke-bugfix-ha-30297400` — expected to return 200 with `{"ok":true,"variant":"30297400"}`
- `GET /api/healthz-smoke-bugfix-ha2-244944780` — expected to return 200 with `{"ok":true,"variant":"244944780"}`

**Root Cause:**
The endpoint files are not present in the `/src/app/api/` directory tree. These health check endpoints are used for deployment verification in distributed environments where multiple application variants may be deployed. The platform needs these endpoints to exist at specific paths to enable load balancers and monitoring systems to verify that particular variants are deployed and reachable.

**Impact:**
- Deployment monitoring fails for these variants
- Load balancers cannot verify variant-specific health status
- Smoke tests expecting these endpoints return 404 errors

**Expected Behavior:**
- Each endpoint should be a self-contained health check endpoint
- No authentication required
- No database access
- Response time < 100ms (typically < 10ms)
- Returns HTTP 200 OK with body: `{"ok":true,"variant":"<variant-id>"}`

## Fix Strategy

### Fix Pattern
Each missing endpoint will be implemented following the established pattern from existing health check endpoints (e.g., `healthz-smoke-bugfix-ha-197298697`):

1. Create a Next.js API route file at `/src/app/api/healthz-smoke-bugfix-ha-<variant>/route.ts`
2. Export an async `GET()` handler
3. Return `NextResponse.json({ ok: true, variant: "<variant>" })` with status 200
4. Include comprehensive JSDoc comments explaining the endpoint purpose

### File Structure
```
/src/app/api/healthz-smoke-bugfix-ha-30297400/
  └── route.ts

/src/app/api/healthz-smoke-bugfix-ha2-244944780/
  └── route.ts
```

### Implementation Details
- Use Next.js `NextResponse` from `'next/server'`
- Async GET handler with no parameters
- Return type: `Promise<NextResponse>`
- Hardcoded variant identifier matching the endpoint path
- No dependencies: zero database calls, no middleware, no authentication

## Acceptance Criteria
- [ ] Both missing health check endpoints are created with correct file structure
- [ ] Each endpoint returns HTTP 200 OK with proper JSON response body
- [ ] Variant identifiers in responses match the endpoint paths
- [ ] Endpoints are self-contained with no external dependencies
- [ ] JSDoc comments document the endpoint purpose and behavior
- [ ] No database access or authentication required
- [ ] Endpoints are deployed and verified with curl/smoke test

## Testing Strategy
```bash
# Verify endpoint responses
curl -i http://localhost:3000/api/healthz-smoke-bugfix-ha-30297400
curl -i http://localhost:3000/api/healthz-smoke-bugfix-ha2-244944780

# Expected responses:
# HTTP/1.1 200 OK
# Content-Type: application/json
# {"ok":true,"variant":"30297400"}
# {"ok":true,"variant":"244944780"}
```

## Detailed Plans
- **VRTX-0469:** See `artifacts/SPRINT-0082/VRTX-0469/PLAN.md`
- **VRTX-0470:** See `artifacts/SPRINT-0082/VRTX-0470/PLAN.md`

## Reviewer Note
**Regression Testing Requirement:** Both VRTX-0469 and VRTX-0470 defects must include regression test assertions that validate the exact JSON response shape: `{"ok":true,"variant":"..."}`. This ensures the response format remains stable across future changes and prevents regressions where the JSON structure might be altered (e.g., additional fields added, field order changed, or data types modified).

## Notes
- These are simple infrastructure endpoints, not product features
- No schema changes needed
- No auth/session changes needed
- No database queries required
- Follows existing endpoint pattern for consistency and maintainability
- Both endpoints follow the identical pattern — only variant IDs differ
