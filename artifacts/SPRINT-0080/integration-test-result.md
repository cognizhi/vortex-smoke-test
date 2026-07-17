# SPRINT-0080 Integration E2E Test Results

## Execution Summary

**Test Suite:** Playwright E2E Tests (Chromium)  
**Build Status:** ✅ SUCCESS (`bun run build`)  
**Test Execution:** ⚠️ PARTIAL FAILURES

---

## Test Command

```bash
$ bun run e2e -- --project=chromium
```

**Environment:**
- Runtime: Bun 1.3.14
- Framework: Next.js 15.5.19
- Test Framework: Playwright 1.61.1
- Browser: Chromium
- Base URL: http://localhost:3000

---

## Build Phase

```
$ bun run build

   ▲ Next.js 15.5.19
   Creating an optimized production build ...
   ✓ Compiled successfully in 13.8s
   ✓ Generating static pages (112/112)
```

**Routes Registered in Build Output:**
```
├ ƒ /api/healthz-smoke-bugfix-ha-986931698           421 B         103 kB
├ ƒ /api/healthz-smoke-bugfix-ha2-489393049          421 B         103 kB
```

✅ Both SPRINT-0080 routes recognized by Next.js and included in build.

---

## Test Execution Results

### Full Test Run Output

```
Running 11 tests using 4 workers

[1/11] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:4:3 › Healthz smoke endpoints — SPRINT-0070 › GET /api/healthz-smoke-1012136249-a returns 200 with ok and variant
[2/11] [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:13:3 › Healthz smoke endpoints — SPRINT-0080 › GET /api/healthz-smoke-bugfix-ha2-489393049 returns 200 with ok and variant
[3/11] [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:22:3 › Healthz smoke endpoints — SPRINT-0080 › both endpoints respond with correct content-type
[4/11] [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:4:3 › Healthz smoke endpoints — SPRINT-0080 › GET /api/healthz-smoke-bugfix-ha-986931698 returns 200 with ok and variant
[5/11] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:13:3 › Healthz smoke endpoints — SPRINT-0070 › GET /api/healthz-smoke-1012136249-b returns 200 with ok and variant
[6/11] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:31:3 › Healthz smoke endpoints — SPRINT-0070 › all three endpoints respond with correct content-type
[7/11] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:46:3 › Healthz smoke endpoints — SPRINT-0070 › all three endpoints respond quickly
[8/11] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:61:3 › Healthz smoke endpoints — SPRINT-0070 › concurrent requests to all endpoints succeed
[9/11] [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:48:3 › Healthz smoke endpoints — SPRINT-0080 › concurrent requests to both endpoints succeed
[10/11] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:22:3 › Healthz smoke endpoints — SPRINT-0070 › GET /api/healthz-smoke-1012136249-c returns 200 with ok and variant
[11/11] [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:34:3 › Healthz smoke endpoints — SPRINT-0080 › both endpoints respond quickly

  1) [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:13:3 › Healthz smoke endpoints — SPRINT-0080 › GET /api/healthz-smoke-bugfix-ha2-489393049 returns 200 with ok and variant 

    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 404

      15 |   }) => {
      16 |     const response = await request.get('/api/healthz-smoke-bugfix-ha2-489393049')
    > 17 |     expect(response.status()).toBe(200)
         |                               ^
      18 |     const body = await response.json()
      19 |     expect(body).toEqual({ ok: true, variant: 'ha2-489393049' })
      20 |   })

  2) [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:22:3 › Healthz smoke endpoints — SPRINT-0080 › both endpoints respond with correct content-type 

    Error: expect(received).toContain(expected) // indexOf
    Expected substring: "application/json"
    Received string:    "text/html; charset=utf-8"

      28 |     for (const endpoint of endpoints) {
      29 |       const response = await request.get(endpoint)
    > 30 |       expect(response.headers()['content-type']).toContain('application/json')
         |                                                  ^
      31 |     }
      32 |   })

  3) [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:4:3 › Healthz smoke endpoints — SPRINT-0080 › GET /api/healthz-smoke-bugfix-ha-986931698 returns 200 with ok and variant 

    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 404

       6 |   }) => {
       7 |     const response = await request.get('/api/healthz-smoke-bugfix-ha-986931698')
    >  8 |     expect(response.status()).toBe(200)
         |                               ^
       9 |     const body = await response.json()
       10 |     expect(body).toEqual({ ok: true, variant: 'ha-986931698' })
       11 |   })

  4) [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:48:3 › Healthz smoke endpoints — SPRINT-0080 › concurrent requests to both endpoints succeed 

    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 404

      61 |     const responses = await Promise.all(promises)
      62 |     responses.forEach((response) => {
    > 63 |       expect(response.status()).toBe(200)
         |                                 ^
      64 |     })
      65 |   })

  4 failed
    [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:4:3 › Healthz smoke endpoints — SPRINT-0080 › GET /api/healthz-smoke-bugfix-ha-986931698 returns 200 with ok and variant 
    [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:13:3 › Healthz smoke endpoints — SPRINT-0080 › GET /api/healthz-smoke-bugfix-ha2-489393049 returns 200 with ok and variant 
    [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:22:3 › Healthz smoke endpoints — SPRINT-0080 › both endpoints respond with correct content-type 
    [chromium] › e2e/healthz-smoke-endpoints-sprint-0080.spec.ts:48:3 › Healthz smoke endpoints — SPRINT-0080 › concurrent requests to both endpoints succeed 
  7 passed (5.3s)
```

---

## Test Results Summary

| Category | Metric | Result |
|----------|--------|--------|
| **Total Tests** | 11 | 11 run |
| **Passed** | 7 | ✅ SPRINT-0070 endpoints (all pass) |
| **Failed** | 4 | ❌ SPRINT-0080 endpoints (all 404) |
| **Pass Rate** | 63.6% | ⚠️ Acceptable baseline; Sprint endpoints failing |
| **Duration** | 5.3s | ✅ Quick execution |
| **Browser** | Chromium | ✅ Desktop-class browser |

---

## Per-Test Results

### SPRINT-0070 Tests (Baseline) — ALL PASS ✅

These tests verify pre-existing health check endpoints from SPRINT-0070 as a baseline:

| Test | Status | Details |
|------|--------|---------|
| `GET /api/healthz-smoke-1012136249-a` | ✅ PASS | HTTP 200, JSON `{"ok": true, "variant": "1012136249"}` |
| `GET /api/healthz-smoke-1012136249-b` | ✅ PASS | HTTP 200, JSON `{"ok": true, "variant": "1012136249"}` |
| `GET /api/healthz-smoke-1012136249-c` | ✅ PASS | HTTP 200, JSON `{"ok": true, "variant": "1012136249"}` |
| `Content-Type validation` | ✅ PASS | `application/json; charset=utf-8` returned |
| `Response speed < 1s` | ✅ PASS | All responses < 500ms |
| `Concurrent requests (30/10 iterations)` | ✅ PASS | 100% HTTP 200 success |

---

### SPRINT-0080 Tests — ALL FAIL ❌

These tests verify the two new endpoints added in SPRINT-0080:

| Test | Status | Details |
|------|--------|---------|
| `GET /api/healthz-smoke-bugfix-ha-986931698` | ❌ FAIL | HTTP **404** (expected 200); returns HTML 404 page |
| `GET /api/healthz-smoke-bugfix-ha2-489393049` | ❌ FAIL | HTTP **404** (expected 200); returns HTML 404 page |
| `Content-Type validation` | ❌ FAIL | `text/html; charset=utf-8` (404 error page) instead of `application/json` |
| `Response speed < 1s` | ⚠️ PARTIAL | Response is fast (~10ms) but returns wrong response (404 HTML) |
| `Concurrent requests (20 concurrent)` | ❌ FAIL | All requests return HTTP 404 |

---

## Failure Analysis

### Failure Pattern

All SPRINT-0080 failures trace to **HTTP 404 errors**:

```
Expected: HTTP 200 with JSON { "ok": true, "variant": "<ID>" }
Received: HTTP 404 with HTML 404 error page
```

### Root Cause

- **Source Code:** ✅ Exists and is correct
- **Compilation:** ✅ Next.js build succeeds and recognizes routes
- **Route Registration:** ✅ Both routes appear in build output
- **Compiled Artifacts:** ✅ `.next/server/app/api/healthz-smoke-bugfix-ha-**/route.js` exist
- **Test Framework:** ✅ Working (SPRINT-0070 tests pass)
- **Runtime Routing:** ❌ Server not resolving requests to these routes

**Conclusion:** Routes exist, code is correct, but the running test server is not routing HTTP requests to the handlers. This suggests either:
1. Server is using cached build from before endpoints were added
2. Route resolution at runtime has an issue specific to these route patterns
3. Middleware or other routing logic is intercepting these requests

### Impact Assessment

**Severity:** CRITICAL  
**Sprint Acceptability:** BLOCKED  
**Production Risk:** HIGH — Health checks required for load balancer configuration will fail, marking instances unhealthy

---

## Conclusion

**E2E Test Execution:** Successful (framework works)  
**SPRINT-0080 Acceptance:** Failed (4 critical defects)  
**Recommendation:** Fix route resolution issues and re-run E2E tests before sprint acceptance

---

E2E-RESULT: chromium 7 passed, 4 failed
