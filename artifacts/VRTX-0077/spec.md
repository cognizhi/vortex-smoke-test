# Bug Specification: Overly Strict Content-Type Header Assertions in Unit Tests

**Ticket:** VRTX-0077
**Type:** Bug Fix
**Severity:** High
**Date:** 2026-07-04
**Author:** Engineer Agent

---

## 1. Bug Description

The unit tests for health check endpoints have overly strict assertions for Content-Type headers that cause test failures. The tests expect the exact string `"application/json"` but the endpoints correctly return `"application/json;charset=utf-8"` per RFC 7231 § 3.1.1.1.

This is a **test quality issue**, not an implementation defect. The endpoints function correctly; the tests have incorrect assertions.

---

## 2. Reproduction Steps

1. **Setup:** Run the test suites for both endpoints
2. **Action:** Execute tests for the health check endpoints
   ```bash
   npm run test src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts
   npm run test src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts
   ```
3. **Expected:** All 14 tests per endpoint should pass (28 total)
4. **Actual:** 12 tests per endpoint pass, 2 fail per endpoint (24 pass, 4 fail)
   - 2 failures per endpoint in RH-07 (line 97) and RH-13 (line 166)
   - Error: `AssertionError: expected 'application/json;charset=utf-8' to be 'application/json'`

**Environment:** All environments (dev, test, CI)

---

## 3. Root Cause Analysis

**Root cause:** Test files use `toBe()` for strict equality check on Content-Type header values.

**Affected Lines:**
- File 1: `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
  - Line 97 (RH-07 test): `expect(res.headers.get('Content-Type')).toBe('application/json');`
  - Line 166 (RH-13 test): `expect(res.headers.get('Content-Type')).toBe('application/json');`

- File 2: `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts`
  - Line 97 (RH-07 test): `expect(res.headers.get('Content-Type')).toBe('application/json');`
  - Line 166 (RH-13 test): `expect(res.headers.get('Content-Type')).toBe('application/json');`

**Why it fails:**
- `NextResponse.json()` from Next.js App Router correctly returns RFC 7231-compliant headers with charset
- Actual value: `"application/json;charset=utf-8"`
- Expected value in test: `"application/json"`
- Using `toBe()` requires exact string match, which fails

**RFC 7231 Compliance:**
Per RFC 7231 § 3.1.1.1, media types MAY include parameters like charset. NextResponse correctly includes this parameter for UTF-8 JSON responses. The test assertions are incorrect, not the implementation.

---

## 4. Fix Approach

Replace strict equality assertions with flexible string matching that accepts the charset parameter.

### Fix Option 1: `toContain()` (Recommended)

Replace lines 97 and 166 in both test files:

**Before:**
```typescript
expect(res.headers.get('Content-Type')).toBe('application/json');
```

**After:**
```typescript
expect(res.headers.get('Content-Type')).toContain('application/json');
```

**Rationale:** 
- Simple and readable
- Verifies the critical requirement: JSON content type
- Accepts any parameters (charset, etc.)
- Less brittle than exact matching

### Fix Option 2: Regex Match

Alternative using regex (not recommended but valid):

```typescript
expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
```

### Implementation Plan

1. Update `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
   - Line 97: Replace `toBe()` with `toContain()`
   - Line 166: Replace `toBe()` with `toContain()`

2. Update `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts`
   - Line 97: Replace `toBe()` with `toContain()`
   - Line 166: Replace `toBe()` with `toContain()`

### Why This Fix Is Correct

1. **RFC Compliant:** Accepts standards-compliant Content-Type headers with parameters
2. **Implementation Preserved:** Endpoint behavior is correct; only test assertions change
3. **Broader Coverage:** Tests now verify critical requirement (JSON type) not brittle formatting
4. **Minimal Change:** Only 4 assertions updated; no logic changes

### Why This Fix Is Safe

1. **Test Only:** No implementation code changes
2. **Isolated:** Changes to assertions only, not test logic
3. **No Regression Risk:** Tests still validate the same functional requirements
4. **Reversible:** If needed, can revert in seconds
5. **No Side Effects:** Does not affect other tests or endpoints

---

## 5. Regression Risk

| Area | Risk | Mitigation |
|------|------|------------|
| Test accuracy | LOW | `toContain()` still validates Content-Type is JSON; more robust than exact match |
| Endpoint functionality | NONE | No endpoint code changes; only test assertions |
| Other tests | NONE | Changes isolated to 2 test files; 24+ other tests unaffected |
| Standards compliance | NONE | Fix makes tests more RFC-compliant, not less |

**Overall Risk Level:** LOW

---

## 6. Fix Acceptance Criteria

- **FIX-01:** RH-07 test (line 97) in healthz-smoke-1024087252 test file uses `toContain()` instead of `toBe()`
- **FIX-02:** RH-13 test (line 166) in healthz-smoke-1024087252 test file uses `toContain()` instead of `toBe()`
- **FIX-03:** RH-07 test (line 97) in healthz-smoke-bugfix2-887203910 test file uses `toContain()` instead of `toBe()`
- **FIX-04:** RH-13 test (line 166) in healthz-smoke-bugfix2-887203910 test file uses `toContain()` instead of `toBe()`
- **FIX-05:** All 14 tests pass in healthz-smoke-1024087252 endpoint test suite
- **FIX-06:** All 14 tests pass in healthz-smoke-bugfix2-887203910 endpoint test suite
- **FIX-07:** No regressions in other endpoint tests (all existing tests still pass)
- **FIX-08:** Endpoints remain functionally correct (verified manually before fix)

---

## 7. Test Strategy

### Red Phase (Before Fix)

Expected test output:

```
FAIL src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts (2 failing)
FAIL src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts (2 failing)

Tests: 24 passed, 4 failed out of 28
```

Failing tests:
- RH-07: Content-Type header validation (strict equality fails)
- RH-13: Multiple calls consistency check (strict equality fails)

### Green Phase (After Fix)

Expected test output:

```
PASS src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts (all 14 passing)
PASS src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts (all 14 passing)

Tests: 28 passed out of 28
```

All tests pass because:
- RH-07 now uses `toContain()` which accepts `"application/json;charset=utf-8"`
- RH-13 now uses `toContain()` in consistency check which also accepts the charset
- All 24 other tests remain unchanged and continue to pass

---

## 8. Out of Scope

- Changes to endpoint implementations (they are correct)
- Changes to test logic or test coverage
- Changes to other unrelated test files
- Refactoring of test code beyond the minimal assertion update

---

## 9. Dependencies & Blockers

| Dependency | Type | Status |
|------------|------|--------|
| Vitest test framework | Internal | ✅ Available |
| Existing test files | Internal | ✅ Available (created by VRTX-0074/VRTX-0075) |

No blockers identified. Implementation can proceed immediately.

---

## 10. References

- **RFC 7231 § 3.1.1.1:** HTTP/1.1 Semantics and Content — Media Types
- **Next.js NextResponse API:** Returns RFC-compliant JSON response headers with charset
- **Vitest Documentation:** `toContain()` matcher for string containment checks
- **Related Tickets:**
  - VRTX-0074: Created `/api/healthz-smoke-1024087252` endpoint (created test with strict assertions)
  - VRTX-0075: Created `/api/healthz-smoke-bugfix2-887203910` endpoint (created test with strict assertions)

---

*This spec is the source of truth. Any deviation during implementation must be documented in summary.md.*
