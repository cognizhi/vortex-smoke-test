# TASK PLAN: VRTX-0578 — E2E tests for healthz-smoke-107173471 endpoints

**Sprint:** SPRINT-0098  
**Story:** VRTX-0576 — Test infrastructure and verification (107173471)  
**Idea:** VST-0085

**Depends On:** VRTX-0571, VRTX-0572, VRTX-0573 (all three endpoints must exist)

---

## 1. Overview

Create comprehensive Playwright E2E tests for all three smoke test endpoints (107173471-a, -b, -c). Tests verify HTTP 200 responses, correct JSON response format, content-type headers, performance baseline, and concurrent request handling through actual HTTP requests.

**Test File:** `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts`  
**Framework:** Playwright  
**Target:** ~100 lines, 6+ test cases  
**Pattern:** Follows SPRINT-0088/0092 E2E test pattern

---

## 2. Test Implementation

### File Location
```
e2e/
  └── healthz-smoke-endpoints-sprint-0098.spec.ts (~100 lines)
```

### Test Structure Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Healthz smoke endpoints — SPRINT-0098 (107173471)', () => {
  // Test 1: Individual endpoint responses
  test('GET /api/healthz-smoke-107173471-a returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-107173471-a')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '107173471' })
  })

  // Test 2: Similar for endpoint -b
  test('GET /api/healthz-smoke-107173471-b returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-107173471-b')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '107173471' })
  })

  // Test 3: Similar for endpoint -c
  test('GET /api/healthz-smoke-107173471-c returns 200 with ok and variant', async ({
    request,
  }) => {
    const response = await request.get('/api/healthz-smoke-107173471-c')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '107173471' })
  })

  // Test 4: Content-type validation
  test('all three endpoints respond with correct content-type', async ({
    request,
  }) => {
    const endpoints = [
      '/api/healthz-smoke-107173471-a',
      '/api/healthz-smoke-107173471-b',
      '/api/healthz-smoke-107173471-c',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      expect(response.headers()['content-type']).toContain('application/json')
    }
  })

  // Test 5: Performance baseline
  test('all three endpoints respond quickly', async ({ request }) => {
    const endpoints = [
      '/api/healthz-smoke-107173471-a',
      '/api/healthz-smoke-107173471-b',
      '/api/healthz-smoke-107173471-c',
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
      '/api/healthz-smoke-107173471-a',
      '/api/healthz-smoke-107173471-b',
      '/api/healthz-smoke-107173471-c',
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
✓ GET /api/healthz-smoke-107173471-a returns 200 with ok and variant (XXms)
✓ GET /api/healthz-smoke-107173471-b returns 200 with ok and variant (XXms)
✓ GET /api/healthz-smoke-107173471-c returns 200 with ok and variant (XXms)
✓ all three endpoints respond with correct content-type (XXms)
✓ all three endpoints respond quickly (XXms)
✓ concurrent requests to all endpoints succeed (XXms)

6 passed (XXms)
```

---

## 5. Acceptance Criteria (Definition of Done)

### Test File
- ✅ Playwright test suite created at `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts`
- ✅ Test: Each endpoint (-a, -b, -c) returns HTTP 200
- ✅ Test: Each endpoint returns `{ok: true, variant: "107173471"}` JSON body
- ✅ Test: All endpoints respond with `application/json` content-type
- ✅ Test: Response time < 1000ms for all endpoints (performance baseline)
- ✅ Test: Concurrent requests (10x parallel) to all three endpoints succeed
- ✅ All 6+ tests pass with 100% pass rate

### Quality
- ✅ Test file follows existing Playwright pattern
- ✅ Tests use Playwright best practices
- ✅ Tests are maintainable and clear
- ✅ No hardcoded timeouts or flaky waits
- ✅ Comments explain non-obvious test logic

### Integration
- ✅ `npm run e2e` passes including these tests
- ✅ No test file conflicts with other tasks
- ✅ Works with production build (`npm run build && npm start`)
- ✅ Works with dev server (`npm run dev`)
- ✅ Committed to feature branch with clear commit message

---

## 6. Acceptance Criteria (Fixed Interface Contract)

**HTTP Interface (via Playwright):**

| Test | HTTP Method | URL | Expected Status | Expected Body |
|------|-------------|-----|-----------------|----------------|
| #1 | GET | /api/healthz-smoke-107173471-a | 200 | `{"ok":true,"variant":"107173471"}` |
| #2 | GET | /api/healthz-smoke-107173471-b | 200 | `{"ok":true,"variant":"107173471"}` |
| #3 | GET | /api/healthz-smoke-107173471-c | 200 | `{"ok":true,"variant":"107173471"}` |
| #4 | GET | all three | 200 | content-type: application/json |
| #5 | GET | all three | 200 | response time < 1000ms each |
| #6 | GET | all three | 200 | 30 concurrent requests (10x3) |

---

## 7. Dependencies

### Blocking Dependencies
- ✅ VRTX-0571 — Endpoint -a must exist
- ✅ VRTX-0572 — Endpoint -b must exist
- ✅ VRTX-0573 — Endpoint -c must exist

### Assumed to be available
- Playwright already configured in `playwright.config.ts`
- Dev server can be started with `npm run dev` or `npm run build && npm start`
- Existing test infrastructure in `e2e/` directory
- Base URL configured in Playwright config

---

## 8. Testing Strategy

### Local Test Execution

```bash
# Run only the SPRINT-0098 tests
npm run e2e -- healthz-smoke-endpoints-sprint-0098

# Run all E2E tests
npm run e2e

# Run specific test
npm run e2e -- -g "concurrent requests"

# Run in debug mode
npx playwright test --debug e2e/healthz-smoke-endpoints-sprint-0098.spec.ts
```

### Prerequisites Before Testing
- All three endpoints deployed (VRTX-0571, VRTX-0572, VRTX-0573 complete)
- Production build available: `npm run build` succeeds
- Dev server running or production build available to test against
- No other infrastructure changes that break HTTP endpoints

---

## 9. CI/CD Integration

### Automated E2E Test Run
```bash
npm run build                  # Build the app with all three endpoints
npm run e2e                    # Run Playwright tests including SPRINT-0098 tests
```

**Success Criteria:**
- All 6+ tests pass
- No flaky test failures
- Response time performance baseline maintained (< 1s)
- Concurrent requests stability verified

---

## 10. File Ownership

**This TASK owns:**
- `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts` (~100 lines)

**This TASK does NOT own:**
- `src/app/api/healthz-smoke-107173471-a/route.ts` (separate TASK: VRTX-0571)
- `src/app/api/healthz-smoke-107173471-b/route.ts` (separate TASK: VRTX-0572)
- `src/app/api/healthz-smoke-107173471-c/route.ts` (separate TASK: VRTX-0573)
- Unit tests (separate TASK: VRTX-0577)

---

## 11. Definition of Done

This TASK is complete when:

1. ✅ Code is committed to ticket branch with clear commit message
2. ✅ All 6+ E2E tests pass locally: `npm run e2e`
3. ✅ Tests pass against production build: `npm run build && npm start`
4. ✅ Tests pass against dev server: `npm run dev` + separate test run
5. ✅ No flaky test failures (run 3 times consecutively)
6. ✅ Performance baseline maintained (responses < 1s)
7. ✅ Concurrent requests test validates stability under load
8. ✅ Test file follows existing Playwright pattern and conventions
9. ✅ No merge conflicts with endpoint implementations
10. ✅ All existing E2E tests still pass
11. ✅ CI pipeline passes all tests

---

## 12. Git Workflow

1. **Branch:** `vortex/feat/VRTX-0578-e2e-tests-107173471`
2. **Commit:** One clear commit with the test file
   ```
   test(e2e): Playwright tests for /api/healthz-smoke-107173471-{a,b,c}

   Adds comprehensive E2E test coverage for variant 107173471 endpoints.
   Tests verify 200 responses, correct JSON, content-type headers, 
   performance baseline, and concurrent request handling.
   Part of SPRINT-0098.
   
   Depends on: VRTX-0571, VRTX-0572, VRTX-0573
   ```
3. **Push:** To feature branch, no force-push
4. **Merge:** Via squash-merge to sprint branch

---

## 13. References

- **Sprint Plan:** artifacts/SPRINT-0098/SPRINT-PLAN.md
- **Story:** VRTX-0576
- **Blocking TASKs:** VRTX-0571, VRTX-0572, VRTX-0573
- **Related Task:** VRTX-0577 (unit tests)
- **Idea:** VST-0085
- **Previous Test Pattern:** `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts`
- **Playwright Config:** playwright.config.ts

---

**Task Status:** 🟡 Ready for Assignment (after endpoint tasks complete)  
**Effort Estimate:** 1 hour  
**Last Updated:** 2026-07-21  
**Document Version:** 1.0
