# TASK VRTX-0419: Test Harness — All three endpoints

**Phase:** Test Harness (SPRINT-0072)

**Objective:** Write comprehensive test suites for all three endpoints (A, B, C).

**Dependencies:** VRTX-0416, VRTX-0417, VRTX-0418 (endpoints must be implemented first)

---

## 1. Scope

Write complete test suites for all three endpoints. Each endpoint receives its own independent test file with 15 tests.

**Total test count:** 45 tests (15 per endpoint)

---

## 2. File Structure

```
src/app/api/healthz-smoke-737151464-a/
├── route.ts
└── __tests__/
    └── route.test.ts     ← 15 tests

src/app/api/healthz-smoke-737151464-b/
├── route.ts
└── __tests__/
    └── route.test.ts     ← 15 tests (independent)

src/app/api/healthz-smoke-737151464-c/
├── route.ts
└── __tests__/
    └── route.test.ts     ← 15 tests (independent)
```

---

## 3. File Ownership Map

| File | Owner | Responsibility |
|------|-------|-----------------|
| `src/app/api/healthz-smoke-737151464-a/__tests__/route.test.ts` | This TASK | 15 tests for endpoint A |
| `src/app/api/healthz-smoke-737151464-b/__tests__/route.test.ts` | This TASK | 15 tests for endpoint B |
| `src/app/api/healthz-smoke-737151464-c/__tests__/route.test.ts` | This TASK | 15 tests for endpoint C |

---

## 4. Test Structure (per endpoint)

### Test Organization

Tests are organized into 5 groups with 3 tests per group:

```
RH-01 through RH-15
├── GROUP 1: HTTP Status & Response Body (RH-01 through RH-05)
├── GROUP 2: Field Type Safety (RH-06 through RH-08)
├── GROUP 3: HTTP Headers & Meta (RH-09 through RH-10)
├── GROUP 4: Performance (RH-11 through RH-13)
└── GROUP 5: Public Access & Consistency (RH-14 through RH-16)
```

### Test Details

**GROUP 1: HTTP Status & Response Body (5 tests)**

1. **RH-01: returns HTTP 200 status**
   - Call GET()
   - Expect: status === 200, ok === true

2. **RH-02: returns correct JSON structure with ok and variant**
   - Call GET()
   - Parse response JSON
   - Expect: json.ok === true, json.variant === "737151464"

3. **RH-03: variant field is correct value**
   - Call GET()
   - Parse response JSON
   - Expect: json.variant === "737151464" (exact string match)

4. **RH-04: response JSON structure is exactly two fields**
   - Call GET()
   - Parse response JSON
   - Expect: Object.keys(json) has exactly 2 keys: ["ok", "variant"]

5. **RH-05: ok field is exactly true (not truthy)**
   - Call GET()
   - Parse response JSON
   - Expect: typeof json.ok === "boolean" && json.ok === true

**GROUP 2: Field Type Safety (3 tests)**

6. **RH-06: ok field is boolean true (not just truthy)**
   - Call GET()
   - Parse response JSON
   - Expect: typeof json.ok === "boolean"
   - Expect: json.ok === true (not just truthy)

7. **RH-07: variant field is string (not number)**
   - Call GET()
   - Parse response JSON
   - Expect: typeof json.variant === "string"
   - Expect: json.variant === "737151464" (not 737151464 as number)

8. **RH-08: response has exactly two fields (ok and variant)**
   - Call GET()
   - Parse response JSON
   - Expect: Object.keys(json).length === 2
   - Expect: keys are ["ok", "variant"] (in any order)

**GROUP 3: HTTP Headers & Meta (2 tests)**

9. **RH-09: Content-Type header is application/json**
   - Call GET()
   - Check response headers
   - Expect: Content-Type contains "application/json"

10. **RH-10: response is a NextResponse instance**
    - Call GET()
    - Expect: response instanceof NextResponse

**GROUP 4: Performance (3 tests)**

11. **RH-11: response time is less than 100ms**
    - Measure time with performance.now()
    - Call GET()
    - Measure time with performance.now()
    - Expect: elapsed < 100ms

12. **RH-12: response time is typically fast (< 10ms)**
    - Measure time with performance.now()
    - Call GET()
    - Measure time with performance.now()
    - Expect: elapsed < 10ms (soft assertion)

13. **RH-13: under load (50 concurrent calls), all respond within 100ms**
    - Create 50 concurrent GET() calls
    - Measure total time
    - Expect: all return status 200
    - Expect: total time is reasonable (< 5 seconds)

**GROUP 5: Public Access & Consistency (2 tests)**

14. **RH-14: endpoint requires no authentication**
    - Call GET() without auth headers
    - Expect: status 200 (no 401, 403, etc.)

15. **RH-15: multiple sequential calls return consistent responses**
    - Call GET() three times
    - Expect: all return status 200
    - Expect: all have Content-Type application/json
    - Expect: all return identical JSON bodies

---

## 5. Test Implementation Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-737151464-{a,b,c}', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // GROUP 1: HTTP Status & Response Body (5 tests)
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // [... remaining 14 tests ...]
});
```

---

## 6. File Ownership Map

### Test file for endpoint A

`src/app/api/healthz-smoke-737151464-a/__tests__/route.test.ts`
- 15 tests, all testing the A endpoint
- Imports from `../route`
- Completely independent test suite

### Test file for endpoint B

`src/app/api/healthz-smoke-737151464-b/__tests__/route.test.ts`
- 15 tests, all testing the B endpoint
- Imports from `../route`
- Completely independent test suite (not copied from A's tests)

### Test file for endpoint C

`src/app/api/healthz-smoke-737151464-c/__tests__/route.test.ts`
- 15 tests, all testing the C endpoint
- Imports from `../route`
- Completely independent test suite (not copied from A's or B's tests)

---

## 7. Test Execution

### Run all tests
```bash
npm run test
```

### Run tests for specific endpoint
```bash
npx vitest run src/app/api/healthz-smoke-737151464-a/__tests__/route.test.ts
```

### Check coverage
```bash
npm run test:coverage
```

### Expected result
- All 45 tests pass
- Coverage > 85% for new code
- No test warnings or errors

---

## 8. Definition of Done

- [ ] Test file created for endpoint A with 15 tests
- [ ] Test file created for endpoint B with 15 tests (independent)
- [ ] Test file created for endpoint C with 15 tests (independent)
- [ ] All 45 tests pass: `npm run test`
- [ ] Coverage > 85% for new code
- [ ] Tests follow 5-group structure (Status, Types, Headers, Performance, Public)
- [ ] Each test is properly named with RH-## prefix
- [ ] Tests are independent — no test depends on another endpoint
- [ ] Code committed to git with clear message

---

## 9. Acceptance Criteria (from sprint plan)

- [ ] 15 tests per endpoint (45 total)
- [ ] All tests pass: `npm run test`
- [ ] Coverage > 85% for new code
- [ ] Tests organized into 5 groups
- [ ] Load testing included (50 concurrent calls)
- [ ] Performance assertions: < 100ms hard limit, < 10ms soft target
- [ ] Code committed and pushed

