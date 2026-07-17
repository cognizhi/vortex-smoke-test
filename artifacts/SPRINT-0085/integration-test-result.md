# Integration Test Result — SPRINT-0085

## Test Command
```bash
bun run e2e -- --project=chromium
```

## Playwright Run Summary

**Test Execution Environment:**
- Project: chromium (Desktop Chrome)
- Total Tests: 21 (across 3 test files)
- Test Files:
  - e2e/healthz-smoke-endpoints.spec.ts (SPRINT-0070 — 9 tests)
  - e2e/healthz-smoke-endpoints-sprint-0080.spec.ts (4 tests)
  - e2e/healthz-smoke-endpoints-sprint-0082.spec.ts (4 tests)
  - e2e/healthz-smoke-endpoints-sprint-0085.spec.ts (4 tests) — **NEW**

## SPRINT-0085 Test Results

### Test Cases (4 total)

#### 1. GET /api/healthz-smoke-bugfix-ha-57235969 returns 200 with ok and variant
- **Status:** ❌ FAILED
- **Expected:** HTTP 200, JSON: `{ ok: true, variant: "57235969" }`
- **Actual:** HTTP 404, HTML (default 404 page)
- **Error:** `Expected: 200 Received: 404`

#### 2. GET /api/healthz-smoke-bugfix-ha2-409438860 returns 200 with ok and variant
- **Status:** ❌ FAILED
- **Expected:** HTTP 200, JSON: `{ ok: true, variant: "409438860" }`
- **Actual:** HTTP 404, HTML (default 404 page)
- **Error:** `Expected: 200 Received: 404`

#### 3. Both endpoints respond with correct content-type
- **Status:** ❌ FAILED
- **Expected:** Content-Type contains "application/json"
- **Actual:** Content-Type: "text/html; charset=utf-8"
- **Error:** `Expected substring: "application/json" Received string: "text/html; charset=utf-8"`

#### 4. Concurrent requests to both endpoints succeed
- **Status:** ❌ FAILED
- **Expected:** All 20 concurrent requests (10 iterations × 2 endpoints) return 200
- **Actual:** All return 404
- **Error:** `Expected: 200 Received: 404`

### Summary per Specification

| Test Name | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Endpoint 1: status code | 200 | 404 | ❌ FAIL |
| Endpoint 1: response body | `{ok: true, variant: "57235969"}` | HTML 404 page | ❌ FAIL |
| Endpoint 2: status code | 200 | 404 | ❌ FAIL |
| Endpoint 2: response body | `{ok: true, variant: "409438860"}` | HTML 404 page | ❌ FAIL |

## Overall Result

```
E2E-RESULT: chromium 9 passed, 12 failed
```

**Note:** The 9 passed tests are from SPRINT-0070 (generic healthz endpoints). All 4 SPRINT-0085 tests failed, along with 8 tests from SPRINT-0080 and SPRINT-0082, indicating a systemic issue with how the Next.js app server routes API requests through the built distribution.

## Build Verification

✅ Build completed successfully: `bun run build`
- Both route.ts files are present in source code
- Both routes compiled to .js in .next/server/app/api/

```
/workspace/repo/.next/server/app/api/healthz-smoke-bugfix-ha-57235969/route.js (6775 bytes)
/workspace/repo/.next/server/app/api/healthz-smoke-bugfix-ha2-409438860/route.js (6782 bytes)
```

## Conclusion

**Critical Defect Found:** The Next.js production server (via `bun run start`) is returning 404 HTML responses for API routes instead of properly routing them to the compiled route handlers. This affects all sprint-specific health check endpoints (SPRINT-0080, -0082, -0085) but not the base SPRINT-0070 endpoints, suggesting a potential regression in the middleware or routing configuration.
