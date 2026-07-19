# TASK PLAN: VRTX-0531 — Configure E2E tests for variant 509572604 endpoints

**Sprint:** SPRINT-0092  
**Epic:** VRTX-0525 — Three independent smoke test endpoints (509572604)  
**Feature:** VRTX-0527 — Test infrastructure and E2E verification  
**Depends On:** VRTX-0528, VRTX-0529, VRTX-0530 (all three endpoints must exist)  
**Blocks:** Sprint completion

---

## 1. Overview

Create comprehensive Playwright E2E tests for all three smoke test endpoints (509572604-a, -b, -c). Tests verify HTTP 200 responses, correct JSON response format, content-type headers, performance baseline, and concurrent request handling.

**Test File:** `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts`  
**Framework:** Playwright  
**Target:** ~80 lines, 6+ test cases  
**Test Pattern:** Follows SPRINT-0088 (healthz-smoke-endpoints-sprint-0088.spec.ts)

---

## 2. Test Implementation

### File Location
```
e2e/
  └── healthz-smoke-endpoints-sprint-0092.spec.ts
```

### Test Structure Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Healthz smoke endpoints — SPRINT-0092 (509572604)', () => {
  // Test 1: Individual endpoint responses
  test('GET /api/healthz-smoke-509572604-a returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-509572604-a')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '509572604' })
  })

  // Test 2: Similar for endpoint -b
  test('GET /api/healthz-smoke-509572604-b returns 200 with ok and variant', ...)

  // Test 3: Similar for endpoint -c
  test('GET /api/healthz-smoke-509572604-c returns 200 with ok and variant', ...)

  // Test 4: Content-type validation
  test('all three endpoints respond with correct content-type', async ({
    request,
  }) => {
    const endpoints = [
      '/api/healthz-smoke-509572604-a',
      '/api/healthz-smoke-509572604-b',
      '/api/healthz-smoke-509572604-c',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      expect(response.headers()['content-type']).toContain('application/json')
    }
  })

  // Test 5: Performance baseline
  test('all three endpoints respond quickly', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-509572604-a',
      '/api/healthz-smoke-509572604-b',
      '/api/healthz-smoke-509572604-c',
    ]

    for (const endpoint of endpoints) {
      const start = Date.now()
      await request.get(endpoint)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Response should be within 1 second
    }
  })

  // Test 6: Concurrent request handling
  test('concurrent requests to all endpoints succeed', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-509572604-a',
      '/api/healthz-smoke-509572604-b',
      '/api/healthz-smoke-509572604-c',
    ]

    const promises = []
    for (let i = 0; i < 10; i++) {
      for (const endpoint of endpoints) {
        promises.push(request.get(endpoint))
      }
    }

    const responses = await Promise.all(promises)
    responses.forEach((response) => {
      expect(response.status()).toBe(200)
    })
  })
})
```

---

## 3. Test Coverage Matrix

| Test Case | Endpoint -a | Endpoint -b | Endpoint -c | Description |
|-----------|-------------|-------------|-------------|-------------|
| Individual response (3 tests) | ✅ | ✅ | ✅ | Each endpoint returns 200 + correct JSON |
| Content-type (1 test loop) | ✅ | ✅ | ✅ | All endpoints return application/json |
| Response time (1 test loop) | ✅ | ✅ | ✅ | All endpoints respond within 1s |
| Concurrent requests (1 test) | ✅ | ✅ | ✅ | 10x parallel requests to all three |
| **Total:** | **6+** | **tests** | | **100% coverage** |

---

## 4. Expected Test Output

When all tests pass:

```
✓ GET /api/healthz-smoke-509572604-a returns 200 with ok and variant (XXms)
✓ GET /api/healthz-smoke-509572604-b returns 200 with ok and variant (XXms)
✓ GET /api/healthz-smoke-509572604-c returns 200 with ok and variant (XXms)
✓ all three endpoints respond with correct content-type (XXms)
✓ all three endpoints respond quickly (XXms)
✓ concurrent requests to all endpoints succeed (XXms)

6 passed (XXms)
```

---

## 5. Acceptance Criteria (Definition of Done)

- ✅ Playwright test suite created at `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts`
- ✅ Test: Each endpoint (-a, -b, -c) returns HTTP 200
- ✅ Test: Each endpoint returns `{ok: true, variant: "509572604"}` JSON body
- ✅ Test: All endpoints respond with `application/json` content-type
- ✅ Test: Response time < 1000ms for all endpoints (performance baseline)
- ✅ Test: Concurrent requests (10x parallel) to all three endpoints succeed
- ✅ All 6+ tests pass with 100% pass rate
- ✅ Test file follows existing Playwright pattern
- ✅ `npm run e2e` passes including these tests

---

## 6. Acceptance Criteria (Fixed Interface Contract)

**Test Interfaces:**

| Test | HTTP Method | URL | Expected Status | Expected Body |
|------|-------------|-----|-----------------|----------------|
| #1 | GET | /api/healthz-smoke-509572604-a | 200 | `{"ok":true,"variant":"509572604"}` |
| #2 | GET | /api/healthz-smoke-509572604-b | 200 | `{"ok":true,"variant":"509572604"}` |
| #3 | GET | /api/healthz-smoke-509572604-c | 200 | `{"ok":true,"variant":"509572604"}` |
| #4 | GET | all three | 200 | content-type: application/json |
| #5 | GET | all three | 200 | response time < 1000ms each |
| #6 | GET | all three | 200 | 30 concurrent requests (10x3) |

---

## 7. Dependencies

### Blocking Dependencies
- ✅ VRTX-0528 — Endpoint -a must exist
- ✅ VRTX-0529 — Endpoint -b must exist
- ✅ VRTX-0530 — Endpoint -c must exist

### Assumed to be available
- Playwright already configured in `playwright.config.ts`
- Dev server can be started with `npm run dev` or `npm run build && npm start`
- Existing test infrastructure in `e2e/` directory

---

## 8. Testing Strategy

### Local Test Execution

```bash
# Run only the SPRINT-0092 tests
npm run e2e -- healthz-smoke-endpoints-sprint-0092

# Run all E2E tests
npm run e2e

# Run specific test
npm run e2e -- -g "concurrent requests"
```

### Prerequisites Before Testing
- All three endpoints deployed (VRTX-0528, VRTX-0529, VRTX-0530 complete)
- Dev server running or production build available
- No other infrastructure changes that break HTTP endpoints

---

## 9. CI/CD Integration

### Automated E2E Test Run
```bash
npm run build                  # Build the app with all three endpoints
npm run e2e                    # Run Playwright tests including SPRINT-0092 tests
```

**Success Criteria:**
- All 6+ tests pass
- No flaky test failures
- Response time performance baseline maintained (< 1s)

---

## 10. File Ownership

**This TASK owns:**
- `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts` (~80 lines)

**This TASK does NOT own:**
- `src/app/api/healthz-smoke-509572604-a/route.ts` (separate TASK: VRTX-0528)
- `src/app/api/healthz-smoke-509572604-b/route.ts` (separate TASK: VRTX-0529)
- `src/app/api/healthz-smoke-509572604-c/route.ts` (separate TASK: VRTX-0530)

---

## 11. Definition of Done

This TASK is complete when:

1. ✅ Code is committed to ticket branch with clear commit message
2. ✅ All 6+ E2E tests pass locally
3. ✅ `npm run e2e` passes including these tests
4. ✅ Performance baseline maintained (no regression)
5. ✅ Concurrent requests test validates stability under load
6. ✅ Test file follows existing Playwright pattern and conventions
7. ✅ Code review approved by peer
8. ✅ No merge conflicts with endpoint implementations
9. ✅ CI pipeline passes all tests

---

## 12. Git Workflow

1. **Branch:** `vortex/feat/VRTX-0531-e2e-tests-509572604`
2. **Commit:** One clear commit with the test file
   ```
   test(e2e): Playwright tests for /api/healthz-smoke-509572604-{a,b,c}
   
   Adds comprehensive E2E test coverage for variant 509572604 endpoints.
   Tests verify 200 responses, correct JSON, content-type headers, 
   performance baseline, and concurrent request handling.
   Part of SPRINT-0092.
   ```
3. **Push:** To feature branch, no force-push
4. **Merge:** Via squash-merge to sprint branch

---

## 13. References

- **Sprint Plan:** artifacts/SPRINT-0092/SPRINT-PLAN.md
- **Epic:** VRTX-0525
- **Related Tasks:** VRTX-0528 (endpoint -a), VRTX-0529 (endpoint -b), VRTX-0530 (endpoint -c)
- **Previous Test Pattern:** e2e/healthz-smoke-endpoints-sprint-0088.spec.ts
- **Playwright Config:** playwright.config.ts
- **Idea:** VST-0079

---

**Task Status:** 🟢 Ready for Assignment (after endpoints complete)  
**Last Updated:** 2026-07-19  
**Document Version:** 1.0
