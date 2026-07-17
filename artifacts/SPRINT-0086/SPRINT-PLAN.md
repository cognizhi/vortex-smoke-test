# SPRINT-0086 Bugfix Plan

## Overview
SPRINT-0086 fixes two missing health check variant endpoints that are currently returning 404 errors instead of the expected 200 response with variant identification. These are self-contained smoke test endpoints used by monitoring systems and load balancers to verify deployment and service health.

## Defects in Scope

### VRTX-0488: `/healthz-smoke-bugfix-ha-28079633` returns 404
### VRTX-0489: `/healthz-smoke-bugfix-ha2-506894661` returns 404

---

## Root Cause Analysis (RCA)

### Problem
Two specific health check variant endpoints are not implemented:
- `GET /api/healthz-smoke-bugfix-ha-28079633` → Currently returns 404, should return 200
- `GET /api/healthz-smoke-bugfix-ha2-506894661` → Currently returns 404, should return 200

### Root Cause
Missing route handler directories and `route.ts` files for these specific endpoints. The codebase has established a pattern where each health check variant gets its own directory under `/src/app/api/` with a hardcoded `route.ts` file that returns a variant-specific response. This pattern has been consistently applied across previous sprints (SPRINT-0070 through SPRINT-0084). These two specific variants were never created as individual routes.

### Investigation
1. **Explored existing health check structure**: Found 46+ existing `healthz-smoke-bugfix*` endpoint directories under `/src/app/api/`
2. **Identified pattern**: Each variant gets its own directory with a hardcoded `route.ts` file containing a GET handler
3. **Verified expectations**: Cross-referenced ticket descriptions with actual implementation locations
4. **Confirmed missing endpoints**: 
   - `/src/app/api/healthz-smoke-bugfix-ha-28079633/` does not exist
   - `/src/app/api/healthz-smoke-bugfix-ha2-506894661/` does not exist

### Why This Matters
These are health check endpoints used by:
- Kubernetes readiness probes for pod orchestration
- Load balancers for traffic verification
- Monitoring systems (e.g., DataDog, Prometheus)
- Deployment verification pipelines

Missing endpoints cause monitoring systems to report the service as unhealthy even if it's functioning correctly, leading to potential service disruption.

---

## Fix Strategy

### High-Level Approach
Create two new route handler directories with hardcoded response files that return variant-specific health check responses.

### Implementation Details

#### Fix 1: Create `/api/healthz-smoke-bugfix-ha-28079633` endpoint
- **Location**: `src/app/api/healthz-smoke-bugfix-ha-28079633/route.ts`
- **Response**: `200 OK` with `{ "ok": true, "variant": "28079633" }`
- **Pattern**: Follows existing variant endpoint pattern (see `healthz-smoke-bugfix-ha-30297400` for reference)
- **Dependencies**: None (no database, no auth, no external calls)
- **Performance Target**: < 100ms (typical < 10ms)

#### Fix 2: Create `/api/healthz-smoke-bugfix-ha2-506894661` endpoint
- **Location**: `src/app/api/healthz-smoke-bugfix-ha2-506894661/route.ts`
- **Response**: `200 OK` with `{ "ok": true, "variant": "506894661" }`
- **Pattern**: Follows existing variant endpoint pattern (see `healthz-smoke-bugfix-ha2-244944780` for reference)
- **Dependencies**: None (no database, no auth, no external calls)
- **Performance Target**: < 100ms (typical < 10ms)

### Why Hardcoded Routes Instead of Dynamic?
The `/api/healthz-smoke-bugfix-[...]/` dynamic catch-all route exists but historical pattern shows individual routes are the established convention. Using individual routes ensures:
1. Consistency with all previous sprints (SPRINT-0070 through SPRINT-0084)
2. Explicit, debuggable routes that appear in filesystem and routing tables
3. Direct control over variant identifiers in responses

---

## Acceptance Criteria per Defect

See individual `PLAN.md` files:
- `artifacts/SPRINT-0086/VRTX-0488/PLAN.md` — VRTX-0488 fix details
- `artifacts/SPRINT-0086/VRTX-0489/PLAN.md` — VRTX-0489 fix details

---

## Testing Strategy

### Unit Tests
Existing test patterns confirm expected behavior:
- Endpoint returns HTTP 200
- Response body is valid JSON
- Response includes `ok: true` and `variant: "<id>"`
- Content-Type is `application/json`
- Response completes within 1 second
- Concurrent requests succeed

### Manual Verification
```bash
# Test VRTX-0488
curl -s http://localhost:3000/api/healthz-smoke-bugfix-ha-28079633 | jq

# Test VRTX-0489
curl -s http://localhost:3000/api/healthz-smoke-bugfix-ha2-506894661 | jq
```

Expected response for both:
```json
{
  "ok": true,
  "variant": "<variant-id>"
}
```

### Reviewer Note
⚠️ **REGRESSION TEST REQUIREMENT**: Both VRTX-0488 and VRTX-0489 defects **MUST** include regression tests that validate the exact JSON response shape `{"ok":true,"variant":"<id>"}`. Previous sprints have seen infrastructure routing issues that silently return 404 HTML instead of the expected 200 JSON response. The regression test prevents this from regressing by explicitly asserting both the HTTP 200 status code AND the precise JSON structure with the correct variant ID.

---

## Observable Behavior Change
✅ **YES** — These endpoints will now respond with 200 instead of 404
- Two previously failing health checks will now succeed
- Monitoring systems will correctly report service as healthy for these variants
- Root docs do not require updates as this is a bugfix to existing endpoints pattern

---

## Files Modified
1. **New**: `src/app/api/healthz-smoke-bugfix-ha-28079633/route.ts`
2. **New**: `src/app/api/healthz-smoke-bugfix-ha2-506894661/route.ts`

---

## Git Commit
Single commit message:
```
fix(sprint-0086): [smoke] Add missing healthz-smoke-bugfix variant endpoints

- Add /api/healthz-smoke-bugfix-ha-28079633 endpoint (VRTX-0488)
- Add /api/healthz-smoke-bugfix-ha2-506894661 endpoint (VRTX-0489)

Both endpoints return 200 with variant identification for deployment verification.
Monitoring systems can now verify these specific application variants are deployed
and healthy. Follows existing pattern from SPRINT-0070 through SPRINT-0084.
```

---

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Typos in variant IDs | Double-check against ticket descriptions; test locally before push |
| Performance regression | Health checks have no dependencies; trivial inline functions will have <10ms latency |
| Missing tests | Each endpoint tested locally with curl to verify JSON response |

---

## Sign-Off
- **RCA Completed**: Route handler files missing for these specific variants
- **Fix Strategy Verified**: Matches existing pattern from 46+ other variant endpoints
- **Tests Identified**: Manual curl verification per endpoint
- **Ready for Implementation**: ✅
