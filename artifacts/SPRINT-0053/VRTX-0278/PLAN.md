# VRTX-0278: Write test suite for `/healthz-smoke-28611693` endpoint

**Task Type:** Test & Verification  
**FEATURE:** VRTX-0276 — Implement and test variant endpoint 28611693  
**Depends on:** VRTX-0277  
**Sprint:** SPRINT-0053  

---

## Overview

Create a comprehensive test suite for the `/api/healthz-smoke-28611693` endpoint using Vitest + React Testing Library. Tests must verify response correctness, performance, concurrency, and zero dependencies.

**Scope:** Test suite covering 15 test cases  
**Effort:** 45 min  
**Status:** Ready after VRTX-0277 implementation

---

## Test Strategy

### Test File Location

```
src/app/api/healthz-smoke-28611693/
└── __tests__/
    └── route.test.ts
```

### Test Coverage Goals

- **100% coverage** of route handler code
- **15 test cases** organized into 6 test suites
- **All tests pass** independently and in suite
- **No database access** or external mocking
- **All tests run in jsdom** environment (Vitest config)

### Test Organization

#### Suite 1: Response Status and Body (5 tests)
Tests validate HTTP status and JSON response structure.

- **RH-01:** Returns HTTP 200 status
- **RH-02:** Returns valid JSON with exact response body
- **RH-03:** Response body has exactly 2 fields (ok and variant)
- **RH-04:** `ok` field is boolean `true`
- **RH-05:** `variant` field is string `"28611693"`

#### Suite 2: HTTP Headers (1 test)
Tests validate response headers.

- **RH-06:** Content-Type header is application/json

#### Suite 3: Consistency (1 test)
Tests verify deterministic response across multiple calls.

- **RH-07:** Multiple calls return identical responses (5 calls)

#### Suite 4: Performance (2 tests)
Tests verify response latency meets performance SLA.

- **RH-08:** Response completes in less than 100ms
- **RH-09:** Response completes in less than 50ms (typical)

#### Suite 5: Load Testing (2 tests)
Tests verify endpoint handles concurrent requests.

- **RH-10:** Handles 50 concurrent requests with all returning 200
- **RH-11:** All concurrent requests return correct response body

#### Suite 6: No Dependencies (3 tests)
Tests verify zero external dependencies (no DB, no auth, no side effects).

- **RH-12:** Handler executes without making database queries
- **RH-13:** Handler returns response without requiring authentication
- **RH-14:** Handler has no external side effects

#### Suite 7: Type Safety (1 test)
Tests verify TypeScript types.

- **RH-15:** Response is a NextResponse instance

---

## Implementation Details

### Test File Specification

**File:** `src/app/api/healthz-smoke-28611693/__tests__/route.test.ts`

**Imports:**
```typescript
import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';
```

**Vitest Configuration:**
- Environment: jsdom (default)
- Pool: forks (default)
- No database setup or mocking required
- All tests are deterministic

### Test Patterns

**Basic response validation:**
```typescript
it('RH-01: returns HTTP 200 status', async () => {
  const response = await GET();
  expect(response.status).toBe(200);
});
```

**Concurrent request handling:**
```typescript
it('RH-10: handles 50 concurrent requests', async () => {
  const requests = Array.from({ length: 50 }, () => GET());
  const responses = await Promise.all(requests);
  expect(responses).toHaveLength(50);
  responses.forEach(response => {
    expect(response.status).toBe(200);
  });
});
```

**Performance validation:**
```typescript
it('RH-08: response completes in less than 100ms', async () => {
  const start = performance.now();
  await GET();
  const elapsed = performance.now() - start;
  expect(elapsed).toBeLessThan(100);
});
```

---

## Testing Considerations

### What to Test
- ✅ HTTP status codes (200)
- ✅ Response body structure and values
- ✅ JSON parsing and type checking
- ✅ HTTP headers (Content-Type)
- ✅ Consistency (deterministic responses)
- ✅ Performance (latency < 100ms)
- ✅ Concurrency (50+ concurrent requests)
- ✅ No database dependencies
- ✅ No authentication requirements
- ✅ No side effects

### What NOT to Test
- ❌ Network-layer concerns (routing, middleware) — tested by framework
- ❌ Database integration — handler has no database code
- ❌ Authentication logic — handler has no auth checks
- ❌ External service calls — handler has none

---

## Acceptance Criteria

- [ ] Test file created at `src/app/api/healthz-smoke-28611693/__tests__/route.test.ts`
- [ ] All 15 tests pass when run individually
- [ ] All 15 tests pass when run as full suite
- [ ] Tests organized into 6 describe blocks (one per suite)
- [ ] Each test has descriptive name with test ID (RH-01, RH-02, etc.)
- [ ] All tests import correctly from route handler
- [ ] No tests access database or make external calls
- [ ] Tests run in jsdom environment (Vitest default)
- [ ] Test coverage: 100% of route handler code
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run lint` passes for test file (0 warnings)
- [ ] ESLint and TypeScript strict mode pass
- [ ] No test file modifications needed after implementation

---

## File Ownership & Responsibilities

| File | Owner | Responsibility |
|------|-------|-----------------|
| `src/app/api/healthz-smoke-28611693/__tests__/route.test.ts` | Engineer | Create comprehensive test suite |

---

## Related Artifacts

**Reference:** Test file pattern from SPRINT-0051: `src/app/api/healthz-smoke-453353908/__tests__/route.test.ts`

---

## Verification Strategy

1. Run full test suite: `npm run test -- src/app/api/healthz-smoke-28611693/__tests__/route.test.ts`
2. Run with coverage: `npm run test:coverage`
3. Verify 100% coverage for route handler
4. Run against entire test suite: `npm run test` (all tests still pass)
5. Lint check: `npm run lint`
6. TypeScript strict check: `npm run typecheck`

---

## Definition of Done

1. Test file created at correct path
2. All 15 tests implemented and passing
3. 100% code coverage for route handler
4. Tests run in correct environment (jsdom)
5. No external dependencies or mocking
6. `npm run test` passes
7. `npm run lint` passes (0 warnings)
8. `npm run typecheck` passes (0 errors)
9. Commit pushed to ticket branch
10. Ready for integration verification (VRTX-0279)
