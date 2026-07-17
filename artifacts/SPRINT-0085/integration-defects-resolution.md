# Integration Defects Resolution — SPRINT-0085

## Defect Summary

**Total Defects Found:** 1 (Critical, unfixable in-place)

---

## DEFECT-1: Sprint-Specific Endpoint 404 Routing Failure

**Ticket ID:** To be created as future-sprint defect  
**Status:** ⛔ **UNFIXABLE IN SPRINT** (Exceeds 3 fix/validate cycles; requires infrastructure investigation)  
**Root Cause:** Next.js 15 production server routing failure for endpoints with naming pattern `healthz-smoke-bugfix-ha-*`

### Discovery
- **Test Run:** E2E integration tests, full suite (21 tests)
- **Test File:** `e2e/healthz-smoke-endpoints-sprint-0085.spec.ts`
- **Failures:** 4/4 SPRINT-0085 tests failed with HTTP 404
- **Reproducibility:** 100% (consistent across all test runs)

### Fix Attempts

#### Attempt 1: Adding NextRequest Parameter
- **Hypothesis:** Route handler missing NextRequest parameter (interface mismatch)
- **Change:** Modified both route handlers to include `_request: NextRequest` parameter
- **Rationale:** Generic SPRINT-0070 endpoints include this parameter; sprint-specific ones initially didn't
- **Result:** ❌ Still 404 after rebuild and E2E retest
- **Verdict:** Issue is not handler signature

#### Attempt 2: Simplifying Route File Structure
- **Hypothesis:** Excessive comments/documentation confusing Next.js parser
- **Change:** Stripped all JSDoc comments to minimal route file (matching SPRINT-0070 format exactly)
- **Rationale:** SPRINT-0070 files are minimal; SPRINT-0085 files were verbose
- **Result:** ❌ Still 404 after rebuild and E2E retest
- **Verdict:** Issue is not code formatting or documentation

#### Attempt 3: Clean Rebuild and Cache Clear
- **Hypothesis:** Stale build artifacts or Next.js cache preventing route discovery
- **Change:** `rm -rf .next node_modules/.vite && bun run build`
- **Rationale:** Force complete rebuild, clear all intermediate caches
- **Result:** ❌ Still 404 after full rebuild and test rerun
- **Verdict:** Issue is not build cache or staleness

### Investigation Results

**What Works:**
- ✅ Generic endpoint pattern: `/api/healthz-smoke-1012136249-a` → 200 OK with JSON
- ✅ Same server, same configuration, same route compilation logic

**What Doesn't Work:**
- ❌ Sprint-specific pattern: `/api/healthz-smoke-bugfix-ha-57235969` → 404 HTML
- ❌ Also affects: `/api/healthz-smoke-bugfix-ha-30297400` (SPRINT-0082)
- ❌ Also affects: `/api/healthz-smoke-bugfix-ha-986931698` (SPRINT-0080)
- ❌ Systematic across ALL sprint-specific naming patterns

**Artifacts Verified:**
- ✅ Source files present and correct
- ✅ Compiled route handlers in `.next/server/app/api/`
- ✅ Routes registered in `app-paths-manifest.json`
- ✅ Middleware not blocking (API routes exempt from rewrite)
- ✅ No auth/database issues (handlers have no dependencies)

### Why This Is Unfixable In-Sprint

1. **Root cause is infrastructure-level:** This is not a code bug in the endpoint logic. It's a routing/compilation issue in Next.js or the build system.

2. **Requires specialized investigation:** Fixing this requires:
   - Deep Next.js internals debugging
   - Potentially reproduction of the issue in isolation
   - Possible upgrade/downgrade of Next.js if it's a known bug
   - Possible changes to `next.config.js` or build configuration

3. **Cannot be fixed by endpoint authors:** The route handlers are correct. The issue is how Next.js discovers/routes to them.

4. **Exceeds 3-cycle limit:** Already attempted 3 distinct approaches; each one failed and would require completely different investigation paths (Next.js source code, build config, middleware logic, etc.).

5. **Blocks all SPRINT-0080/0082/0085 endpoints:** The issue is systematic, not specific to SPRINT-0085. Fixing SPRINT-0085 without fixing the pattern will just move the problem.

### Recommendation

**Action: File Future-Sprint Defect Ticket**

Create a dedicated infrastructure/debugging ticket:
- **Title:** "[INFRA] Fix Next.js 15 route discovery for sprint-specific endpoint naming pattern"
- **Type:** Defect (Infrastructure/Build)
- **Priority:** P0 (All smoke-test sprints blocked)
- **Scope:** Investigate why endpoints matching `healthz-smoke-bugfix-ha-*` pattern return 404
- **Deliverable:** Root cause analysis + fix that allows all SPRINT-0080/0082/0085 endpoints to be deployed

**Do NOT:** Try to work around this in code (e.g., rename endpoints, use different routing pattern). The root cause must be fixed systematically.

**Timeline:**  
- File ticket: Immediately
- Assign to: Infrastructure/DevOps or Next.js expert
- Target: Pre-production sprint (before next deployment wave)

---

## Outcome

### SPRINT-0085 Status
- **Code Quality:** ✅ PASS
- **Integration Verification:** ❌ FAIL (blocked by infrastructure issue)
- **Fix Required Before Merge:** ✅ YES
- **Can Be Fixed By This Sprint:** ❌ NO

### Recommended Action
- **HOLD SPRINT** pending infrastructure fix
- **File blocking defect:** Reference this analysis
- **Escalate to:** Platform/Infrastructure team for RCA and fix

---

## Appendix: Technical Details

### Comparison: Working vs. Non-Working Endpoints

**Working (SPRINT-0070):**
```
File: src/app/api/healthz-smoke-1012136249-a/route.ts
Curl: curl http://localhost:3000/api/healthz-smoke-1012136249-a
Result: 200 OK
Body: {"ok":true,"variant":"1012136249"}
```

**Not Working (SPRINT-0085):**
```
File: src/app/api/healthz-smoke-bugfix-ha-57235969/route.ts
Curl: curl http://localhost:3000/api/healthz-smoke-bugfix-ha-57235969
Result: 404 Not Found (HTML page)
Body: <html>...<h1>404</h1>...</html>
```

**Code Comparison:**
- Signature: Identical (after Attempt 1 fix)
- Return value: Identical
- Compilation output: Both produce route.js with correct handler
- Manifest: Both registered in app-paths-manifest.json
- Difference: **Only the endpoint naming pattern**

### File Sizes
- Generic endpoint route.ts: 226 bytes
- Sprint endpoint route.ts (after minimization): ~200 bytes
- Difference: Negligible

### Build Artifacts
Both present in `.next/server/app/api/`:
- `healthz-smoke-1012136249-a/route.js` (works)
- `healthz-smoke-bugfix-ha-57235969/route.js` (doesn't work)
- File sizes similar (~6.7KB minified/compressed)

### Next.js Configuration
No route-specific configuration found that would explain this pattern. The issue appears to be in how Next.js' built-in router matches incoming requests to route files.
