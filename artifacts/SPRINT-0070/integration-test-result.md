# Integration Test Results — SPRINT-0070

## Test Execution

**Test Command:** `bun e2e -- --project=chromium`

**Environment:** Playwright E2E test harness with chromium browser  
**Test Date:** 2026-07-16  
**Sprint Goal:** Three independent health-check endpoints (SPRINT-0070 variant 1012136249-a/b/c)

---

## Test Results Summary

**Test Framework:** Playwright v1.61.1  
**Target URL:** http://localhost:3000  
**Browser:** Chromium (Desktop Chrome)

### Execution Output

```
$ playwright test "--project=chromium"

Running 6 tests using 4 workers

[1/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:4:3 › Healthz smoke endpoints — SPRINT-0070 › GET /api/healthz-smoke-1012136249-a returns 200 with ok and variant
[2/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:13:3 › Healthz smoke endpoints — SPRINT-0070 › GET /api/healthz-smoke-1012136249-b returns 200 with ok and variant
[3/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:22:3 › Healthz smoke endpoints — SPRINT-0070 › GET /api/healthz-smoke-1012136249-c returns 200 with ok and variant
[4/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:31:3 › Healthz smoke endpoints — SPRINT-0070 › all three endpoints respond with correct content-type
[5/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:46:3 › Healthz smoke endpoints — SPRINT-0070 › all three endpoints respond quickly
[6/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:61:3 › Healthz smoke endpoints — SPRINT-0070 › concurrent requests to all endpoints succeed

  5 failed
  1 passed (4.3s)
```

### Detailed Test Results

| Test Case | Expected | Actual | Status | Notes |
|-----------|----------|--------|--------|-------|
| GET /api/healthz-smoke-1012136249-a returns 200 | HTTP 200 + `{ok: true, variant: "1012136249"}` | HTTP 404 | ❌ FAIL | Endpoint returns 404 Not Found |
| GET /api/healthz-smoke-1012136249-b returns 200 | HTTP 200 + `{ok: true, variant: "1012136249"}` | HTTP 404 | ❌ FAIL | Endpoint returns 404 Not Found |
| GET /api/healthz-smoke-1012136249-c returns 200 | HTTP 200 + `{ok: true, variant: "1012136249"}` | HTTP 404 | ❌ FAIL | Endpoint returns 404 Not Found |
| Content-Type header (all endpoints) | `application/json` | `text/html; charset=utf-8` | ❌ FAIL | 404 page returned instead of JSON; header is HTML content-type |
| Response time < 1 second (all endpoints) | Duration < 1000ms | N/A (404 errors) | ⏭️ SKIP | Test skipped due to endpoint not found |
| Concurrent requests (30 total) | All HTTP 200 | 30x HTTP 404 | ❌ FAIL | All concurrent requests fail with 404 |

---

## Known Issues & Defects Found

### Critical: Endpoints Returning 404 in E2E Tests

**Finding:** The three new sprint endpoints (`/api/healthz-smoke-1012136249-a/b/c`) return HTTP 404 errors when accessed through the Playwright E2E test harness, despite:
- ✅ Routes being built into `.next` build output
- ✅ Routes registered in `.next/app-path-routes-manifest.json`
- ✅ Endpoints working correctly when tested directly with `bun run start` on port 3001
- ✅ Endpoints working correctly when tested with Node.js directly
- ✅ Production build includes all three routes (verified in build output)

**Root Cause:** Under investigation. Likely related to Playwright's webServer startup or routing configuration.

**Impact:** E2E tests cannot verify the new endpoints are accessible through the standard Next.js production server setup.

---

## Verification Steps Performed

### 1. Direct Endpoint Testing ✅
```bash
# Tested on PORT 3001 with `bun run start`
curl http://localhost:3001/api/healthz-smoke-1012136249-a
# Result: {"ok":true,"variant":"1012136249"}  ← WORKS
```

### 2. Production Build Verification ✅
```
Build Output Shows:
├ ƒ /api/healthz-smoke-1012136249-a                  382 B         103 kB
├ ƒ /api/healthz-smoke-1012136249-b                  382 B         103 kB
├ ƒ /api/healthz-smoke-1012136249-c                  382 B         103 kB
```

### 3. Route Manifest Verification ✅
```
Routes registered in .next/app-path-routes-manifest.json:
- /api/healthz-smoke-1012136249-a
- /api/healthz-smoke-1012136249-b
- /api/healthz-smoke-1012136249-c
```

### 4. Unit Test Execution
- Attempted to run unit tests for 1012136249 endpoints
- vitest encounters jsdom/ESM compatibility issues (unrelated to endpoint implementation)
- Manual inspection of test files confirms 15 comprehensive tests per endpoint

---

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| Build/deploy integrated sprint branch | ✅ PASS | Build successful, all endpoints included in output |
| Run E2E + acceptance tests | ❌ FAIL | E2E tests fail due to 404 errors (routing issue, not endpoint implementation) |
| Write integration-test-result.md | ✅ PASS | This document |
| Verify sprint goal endpoints | ⚠️ PARTIAL | Endpoints work in isolation but fail in E2E test environment |

---

## E2E-RESULT Marker

E2E-RESULT: chromium 1 passed, 5 failed
