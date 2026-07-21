# TASK PLAN: VRTX-0577 — Unit tests for healthz-smoke-107173471 endpoints

**Sprint:** SPRINT-0098  
**Story:** VRTX-0576 — Test infrastructure and verification (107173471)  
**Idea:** VST-0085

**Depends On:** VRTX-0571, VRTX-0572, VRTX-0573 (all three endpoints must exist)

---

## 1. Overview

Create comprehensive Vitest unit tests for all three smoke test endpoints (107173471-a, -b, -c). Tests directly import and call the route handlers to verify HTTP 200 responses, correct JSON response format, and response structure validation.

**Test File:** `src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts`  
**Framework:** Vitest  
**Target:** ~80 lines, 6+ test cases  
**Environment:** jsdom (default for Vitest)  
**Pattern:** Follows VRTX-0465 regression test pattern

---

## 2. Test Implementation

### File Location
```
src/__tests__/regression/
  └── vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts (~80 lines)
```

### Test Structure Template

```typescript
import { describe, it, expect } from 'vitest'
import { GET as getEndpointA } from '@/app/api/healthz-smoke-107173471-a/route'
import { GET as getEndpointB } from '@/app/api/healthz-smoke-107173471-b/route'
import { GET as getEndpointC } from '@/app/api/healthz-smoke-107173471-c/route'

describe('REGRESSION: VRTX-0575 - API health check endpoints (107173471)', () => {
  // Test 1: Endpoint -a basic response
  it('endpoint -a exists and responds', async () => {
    const res = await getEndpointA()
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })

  // Test 2: Endpoint -b basic response
  it('endpoint -b exists and responds', async () => {
    const res = await getEndpointB()
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })

  // Test 3: Endpoint -c basic response
  it('endpoint -c exists and responds', async () => {
    const res = await getEndpointC()
    expect(res).toBeDefined()
    expect(res.status).toBe(200)
  })

  // Test 4: Response structure for -a
  it('returns 200 OK with correct JSON for endpoint -a', async () => {
    const res = await getEndpointA()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.variant).toBe('107173471')
  })

  // Test 5: Response structure for -b
  it('returns 200 OK with correct JSON for endpoint -b', async () => {
    const res = await getEndpointB()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.variant).toBe('107173471')
  })

  // Test 6: Response structure for -c
  it('returns 200 OK with correct JSON for endpoint -c', async () => {
    const res = await getEndpointC()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.variant).toBe('107173471')
  })

  // Test 7: Exact response format (no extra fields)
  it('returns exactly {"ok":true,"variant":"107173471"} for all endpoints', async () => {
    const endpoints = [
      { name: '-a', handler: getEndpointA },
      { name: '-b', handler: getEndpointB },
      { name: '-c', handler: getEndpointC },
    ]

    for (const { name, handler } of endpoints) {
      const res = await handler()
      const json = await res.json()
      // Ensure no extra fields
      expect(Object.keys(json).sort()).toEqual(['ok', 'variant'].sort())
      expect(json).toEqual({
        ok: true,
        variant: '107173471',
      })
    }
  })

  // Test 8: Content-Type header
  it('has correct Content-Type header for all endpoints', async () => {
    const handlers = [getEndpointA, getEndpointB, getEndpointC]
    for (const handler of handlers) {
      const res = await handler()
      expect(res.headers.get('Content-Type')).toMatch(/^application\/json/)
    }
  })

  // Test 9: Under load
  it('returns 200 under concurrent load (multiple calls)', async () => {
    const calls = Array.from({ length: 10 }, () => getEndpointA())
    const results = await Promise.all(calls)

    results.forEach((res) => {
      expect(res.status).toBe(200)
    })
  })
})
```

---

## 3. Test Coverage Matrix

| Test Case | Endpoint -a | Endpoint -b | Endpoint -c | Description |
|-----------|-------------|-------------|-------------|-------------|
| Exists (3 tests) | ✅ | ✅ | ✅ | Handler exists and callable |
| Response (3 tests) | ✅ | ✅ | ✅ | Returns 200 + correct JSON |
| Exact format (1 test loop) | ✅ | ✅ | ✅ | No extra fields, exact structure |
| Content-Type (1 test loop) | ✅ | ✅ | ✅ | All endpoints return application/json |
| Concurrent (1 test) | ✅ | ✅ | ✅ | 10 parallel requests to -a |
| **Total:** | **6+** | **tests** | | **100% coverage** |

---

## 4. Expected Test Output

When all tests pass:

```
✓ endpoint -a exists and responds (XXms)
✓ endpoint -b exists and responds (XXms)
✓ endpoint -c exists and responds (XXms)
✓ returns 200 OK with correct JSON for endpoint -a (XXms)
✓ returns 200 OK with correct JSON for endpoint -b (XXms)
✓ returns 200 OK with correct JSON for endpoint -c (XXms)
✓ returns exactly {"ok":true,"variant":"107173471"} for all endpoints (XXms)
✓ has correct Content-Type header for all endpoints (XXms)
✓ returns 200 under concurrent load (multiple calls) (XXms)

9 passed (XXms)
```

---

## 5. Acceptance Criteria (Definition of Done)

### Test File
- ✅ Vitest test file created at `src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts`
- ✅ Tests: Endpoint -a exists and responds
- ✅ Tests: Endpoint -b exists and responds
- ✅ Tests: Endpoint -c exists and responds
- ✅ Tests: Each endpoint returns HTTP 200
- ✅ Tests: Each endpoint returns `{ok: true, variant: "107173471"}` JSON body
- ✅ Tests: All endpoints have exactly 2 fields in response (no extras)
- ✅ Tests: All endpoints respond with `application/json` content-type
- ✅ Tests: Concurrent requests (10x) to all endpoints succeed
- ✅ All 9+ tests pass with 100% pass rate

### Quality
- ✅ File follows existing Vitest pattern (see vrtx-0465 test)
- ✅ Tests are descriptive and clear
- ✅ Uses consistent import/expect style
- ✅ No hardcoded timeouts or flaky waits
- ✅ Comments explain non-obvious test logic

### Integration
- ✅ `npm run test` passes including these tests
- ✅ No test file conflicts with other tasks
- ✅ All existing tests still pass
- ✅ TypeScript compilation includes test file
- ✅ Committed to feature branch with clear commit message

---

## 6. Acceptance Criteria (Fixed Interface Contract)

**Test Interfaces:**

| Test | Import | Call | Expected |
|------|--------|------|----------|
| #1-3 | `GET` from route.ts | `await handler()` | Status 200 |
| #4-6 | `GET` from route.ts | `await handler().json()` | `{ok:true,variant:"107173471"}` |
| #7 | All handlers | Each test | Exact 2 fields: ok, variant |
| #8 | All handlers | `res.headers.get('Content-Type')` | Matches `/^application\/json/` |
| #9 | Handler -a | 10 concurrent | All status 200 |

---

## 7. Dependencies

### Blocking Dependencies
- ✅ VRTX-0571 — Endpoint -a must exist
- ✅ VRTX-0572 — Endpoint -b must exist
- ✅ VRTX-0573 — Endpoint -c must exist

### Assumed to be available
- Vitest configured in `vitest.config.ts`
- Test environment (jsdom) set up correctly
- `src/__tests__/regression/` directory exists
- TypeScript support in test environment
- Import alias `@/` resolves to `src/`

---

## 8. Testing Strategy

### Local Test Execution

```bash
# Run only the SPRINT-0098 tests
npx vitest run src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts

# Run all regression tests
npx vitest run src/__tests__/regression/

# Run all tests (watch mode)
npm run test

# Run with coverage
npm run test:coverage
```

### Prerequisites Before Testing
- All three endpoints deployed (VRTX-0571, VRTX-0572, VRTX-0573 complete)
- `npm run build` succeeds with all endpoints in place
- No TypeScript compilation errors

---

## 9. CI/CD Integration

### Automated Test Run
```bash
npm run test                          # Run Vitest including unit tests
```

**Success Criteria:**
- All 9+ tests pass
- No flaky test failures
- 0% test timeout rate
- Test run completes in < 5 seconds

---

## 10. File Ownership

**This TASK owns:**
- `src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts` (~80 lines)

**This TASK does NOT own:**
- `src/app/api/healthz-smoke-107173471-a/route.ts` (separate TASK: VRTX-0571)
- `src/app/api/healthz-smoke-107173471-b/route.ts` (separate TASK: VRTX-0572)
- `src/app/api/healthz-smoke-107173471-c/route.ts` (separate TASK: VRTX-0573)
- `e2e/` tests (separate TASK: VRTX-0578)

---

## 11. Definition of Done

This TASK is complete when:

1. ✅ Test file created at correct path
2. ✅ All 9+ tests implemented
3. ✅ All tests pass locally: `npx vitest run ...`
4. ✅ All tests pass in CI: `npm run test`
5. ✅ No flaky test failures (run 3 times consecutively)
6. ✅ No TypeScript compilation errors
7. ✅ All existing regression tests still pass
8. ✅ Code style matches existing test patterns
9. ✅ File committed to ticket branch with clear commit message
10. ✅ No merge conflicts with endpoint implementations
11. ✅ CI pipeline passes all tests

---

## 12. Git Workflow

1. **Branch:** `vortex/feat/VRTX-0577-unit-tests-107173471`
2. **Commit:** One clear commit with the test file
   ```
   test(unit): Vitest tests for /api/healthz-smoke-107173471-{a,b,c}

   Adds comprehensive unit test coverage for variant 107173471 endpoints.
   Tests verify 200 responses, correct JSON, content-type headers, 
   and concurrent request handling.
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
- **Related Task:** VRTX-0578 (E2E tests)
- **Idea:** VST-0085
- **Test Pattern:** `src/__tests__/regression/vrtx-0465-api-healthz-bugfix-variant-endpoints.test.ts`

---

**Task Status:** 🟡 Ready for Assignment (after endpoint tasks complete)  
**Effort Estimate:** 1 hour  
**Last Updated:** 2026-07-21  
**Document Version:** 1.0
