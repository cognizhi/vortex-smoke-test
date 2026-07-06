# TDD Test Cases: Create /api/healthz-smoke-572185676 Endpoint

**Ticket:** VRTX-0143
**Type:** Route Handler Tests
**Framework:** Vitest
**Testing Library:** React Testing Library (route handler tests use direct handler invocation)

---

## Test Matrix

| ID | Type | Category | Description | Expected Outcome | Acceptance Criteria |
|----|------|----------|-------------|------------------|-------------------|
| RH-01 | Route | Happy Path | GET request returns HTTP 200 status | Status = 200 | AC-01 |
| RH-02 | Route | Happy Path | Response body contains correct structure | `{ ok: true, variant: "572185676" }` | AC-02 |
| RH-03 | Route | Happy Path | Content-Type header is application/json | Header present and correct | AC-03 |
| RH-04 | Route | Auth | No authentication required | GET succeeds without auth headers | AC-04 |
| RH-05 | Route | Edge Case | Response is consistent across calls | All 3 calls identical | AC-07 |
| RH-06 | Route | Edge Case | Response is NextResponse instance | Type check passes | Type Safety |
| RH-07 | Route | Performance | Response completes within 100ms | Elapsed time < 100ms | AC-06 |

---

## Test File

**Location:** `src/app/api/healthz-smoke-572185676/__tests__/route.test.ts`

**Pattern Reference:** `src/app/api/healthz-smoke/__tests__/route.test.ts`

**Key Implementation Details:**
- Import the GET handler directly: `import { GET } from '../route'`
- Call handler as: `const res = await GET()`
- Parse JSON as: `const json = await res.json()`
- No mocking required (no dependencies)
- Use performance.now() for timing tests
- Use Vitest + jsdom environment (default for route handlers)

---

## Test Pseudocode

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-572185676', () => {
  
  // RH-01: Returns HTTP 200 status
  it('returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // RH-02: Response body has correct structure
  it('returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('572185676');
  });

  // RH-03: Content-Type header
  it('Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // RH-04: No authentication required
  it('endpoint requires no authentication', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // RH-05: Consistency
  it('multiple calls return consistent responses', async () => {
    const res1 = await GET();
    const res2 = await GET();
    const res3 = await GET();
    const json1 = await res1.json();
    const json2 = await res2.json();
    const json3 = await res3.json();
    expect(json1).toEqual(json2);
    expect(json2).toEqual(json3);
  });

  // RH-06: Type safety
  it('response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // RH-07: Performance
  it('response time is less than 100ms', async () => {
    const start = performance.now();
    await GET();
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

---

## Coverage Goals

- **Line coverage:** 100% (simple handler, all paths covered)
- **Branch coverage:** 100% (no conditionals)
- **Function coverage:** 100% (one GET function)

---

## Dependencies & Mocks

| Item | Type | Required? | Reason |
|------|------|-----------|--------|
| Database | Database | No | Health check is self-contained |
| Auth Guard | Function | No | Endpoint is public |
| Environment Variables | Config | No | No config needed |
| External APIs | API | No | No external calls |

**Mocking Strategy:** No mocks required. The handler is self-contained and has zero dependencies.

---

## Test Execution

### Red Phase (Step 7/6)
Run before implementation:
```bash
npx vitest run src/app/api/healthz-smoke-572185676/__tests__/route.test.ts --reporter=verbose
```

Expected: **All tests FAIL** with `Cannot find module` error (route.ts does not exist yet)

### Green Phase (Step 11/10)
Run after implementation:
```bash
npx vitest run src/app/api/healthz-smoke-572185676/__tests__/route.test.ts
```

Expected: **All tests PASS** (7/7 passing)

---

## Defect Avoidance Checklist

- [ ] Handler is exported as `export async function GET()`
- [ ] Return type is `NextResponse`
- [ ] Response status is exactly 200 (not 201 or other)
- [ ] Response body is `{ ok: true, variant: "572185676" }` (no extra fields)
- [ ] No database queries in handler
- [ ] No authentication checks
- [ ] No environment variable access
- [ ] JSDoc documentation present
- [ ] Follows healthz-smoke pattern exactly

---

## Notes

- This endpoint is extremely simple — no side effects, no branches, no error states
- All tests should pass because the handler has no failure modes
- If a test fails, it indicates a deviation from requirements
- No edge cases or error states to test (self-contained smoke test)
