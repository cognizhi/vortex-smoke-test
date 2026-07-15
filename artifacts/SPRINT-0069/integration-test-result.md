# Integration E2E Test Results — SPRINT-0069

## Command Executed

```bash
bun run e2e -- --project=chromium
```

## Test Environment

- **Framework:** Playwright Test v1.61.1
- **Browser:** Chromium
- **Base URL:** http://localhost:3000
- **Test Directory:** e2e/healthz-smoke-endpoints.spec.ts

## Playwright Run Summary

```
Running 6 tests using 4 workers

[1/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:13:3 › Healthz smoke endpoints › GET /api/healthz-smoke-276127630-b returns 200 with ok and variant
[2/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:31:3 › Healthz smoke endpoints › all three endpoints respond with correct content-type
[3/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:4:3 › Healthz smoke endpoints › GET /api/healthz-smoke-276127630-a returns 200 with ok and variant
[4/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:46:3 › Healthz smoke endpoints › all three endpoints respond quickly
[5/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:22:3 › Healthz smoke endpoints › GET /api/healthz-smoke-276127630-c returns 200 with ok and variant
[6/6] [chromium] › e2e/healthz-smoke-endpoints.spec.ts:61:3 › Healthz smoke endpoints › concurrent requests to all endpoints succeed
  6 passed (3.0s)
```

## Test Results Summary

| Test Case | Endpoint | Status | Details |
|-----------|----------|--------|---------|
| GET /api/healthz-smoke-276127630-a returns 200 with ok and variant | `/api/healthz-smoke-276127630-a` | ✅ PASS | Returns 200, body matches `{ok: true, variant: "276127630"}` |
| GET /api/healthz-smoke-276127630-b returns 200 with ok and variant | `/api/healthz-smoke-276127630-b` | ✅ PASS | Returns 200, body matches `{ok: true, variant: "276127630"}` |
| GET /api/healthz-smoke-276127630-c returns 200 with ok and variant | `/api/healthz-smoke-276127630-c` | ✅ PASS | Returns 200, body matches `{ok: true, variant: "276127630"}` |
| all three endpoints respond with correct content-type | All endpoints | ✅ PASS | All responses contain `application/json` in `Content-Type` header |
| all three endpoints respond quickly | All endpoints | ✅ PASS | All responses complete within 1 second |
| concurrent requests to all endpoints succeed | All endpoints | ✅ PASS | 30 concurrent requests (10 rounds × 3 endpoints) all returned 200 status |

## Coverage by Acceptance Criteria

| Criterion | Endpoint | Result | Notes |
|-----------|----------|--------|-------|
| Returns `{ok: true, variant: "276127630"}` | `/api/healthz-smoke-276127630-a` | ✅ PASS | Verified via E2E test |
| Returns `{ok: true, variant: "276127630"}` | `/api/healthz-smoke-276127630-b` | ✅ PASS | Verified via E2E test |
| Returns `{ok: true, variant: "276127630"}` | `/api/healthz-smoke-276127630-c` | ✅ PASS | Verified via E2E test |
| HTTP 200 status code | All endpoints | ✅ PASS | All endpoints return 200 |
| Content-Type: application/json | All endpoints | ✅ PASS | All responses properly formatted |
| Performance: response time < 1s | All endpoints | ✅ PASS | All responses complete quickly |
| Concurrency support | All endpoints | ✅ PASS | Handles 30 concurrent requests |

---

E2E-RESULT: chromium 6 passed, 0 failed
