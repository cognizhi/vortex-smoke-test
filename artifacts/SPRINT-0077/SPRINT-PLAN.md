# SPRINT-0077 Bugfix Plan

## Overview
This sprint addresses two missing health check endpoints that return 404 instead of 200.

## Defects

### VRTX-0449: Missing `/healthz-smoke-bugfix-ha-197298697` endpoint
- **Root Cause**: The endpoint directory and route handler do not exist in the codebase
- **Current Behavior**: GET request returns 404 (Not Found)
- **Expected Behavior**: GET request returns 200 with response body `{"ok":true,"variant":"197298697"}`
- **Impact**: Health check failures for this variant, preventing load balancer verification
- **Fix Plan**: Create new Next.js API route at `/src/app/api/healthz-smoke-bugfix-ha-197298697/route.ts` returning the specified response
- **Plan Reference**: `artifacts/SPRINT-0077/VRTX-0449/PLAN.md`

### VRTX-0450: Missing `/healthz-smoke-bugfix-ha2-454075717` endpoint
- **Root Cause**: The endpoint directory and route handler do not exist in the codebase
- **Current Behavior**: GET request returns 404 (Not Found)
- **Expected Behavior**: GET request returns 200 with response body `{"ok":true,"variant":"454075717"}`
- **Impact**: Health check failures for this variant, preventing load balancer verification
- **Fix Plan**: Create new Next.js API route at `/src/app/api/healthz-smoke-bugfix-ha2-454075717/route.ts` returning the specified response
- **Plan Reference**: `artifacts/SPRINT-0077/VRTX-0450/PLAN.md`

## Implementation Notes

Both fixes follow the same pattern as existing health check endpoints (e.g., `/healthz-smoke-bugfix-1021340604`):
- Self-contained, no database access
- No authentication required
- Fast response (< 100ms typical)
- JSON response with `ok: true` and the variant identifier
- Public endpoints suitable for load balancer/monitoring polls

## Testing
Each endpoint can be tested with:
```bash
curl http://localhost:3000/api/healthz-smoke-bugfix-ha-197298697
curl http://localhost:3000/api/healthz-smoke-bugfix-ha2-454075717
```

Expected response:
```json
{"ok":true,"variant":"<variant-id>"}
```

## Reviewer Note
Both defects require a regression test to assert the exact JSON shape `{"ok":true,"variant":"..."}` is returned. The test should verify the response format exactly matches the contract, not just that the endpoint returns 200 status. This ensures future changes do not alter the response structure that monitoring and load-balancer systems depend on.
