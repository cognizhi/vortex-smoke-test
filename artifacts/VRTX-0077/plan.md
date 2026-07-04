# VRTX-0077: Implementation Plan
## Fix Overly Strict Content-Type Header Assertions

**Ticket**: VRTX-0077  
**Type**: Bug Fix / Test Quality  
**Status**: PLANNING  
**Created**: 2026-07-04

---

## 1. Problem Statement

Two test files contain overly strict Content-Type header assertions that cause test failures:

1. `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
2. `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts`

### Root Cause
- Tests assert `Content-Type` header with strict equality: `toBe('application/json')`
- API endpoints return compliant RFC 7231 headers: `application/json;charset=utf-8`
- Strict `toBe()` fails because actual value includes charset parameter

### Impacted Tests
- **File 1**: Lines 97 (RH-07) and 166 (RH-13)
- **File 2**: Lines 97 (RH-07) and 166 (RH-13)
- **Total failing assertions**: 4

### Test Details

#### Test RH-07: Content-Type header is application/json (Line 97)
```typescript
it('RH-07: Content-Type header is application/json', async () => {
  const res = await GET();
  expect(res.headers.get('Content-Type')).toBe('application/json');  // ← FAILS
});
```
**Status**: FAILING  
**Issue**: Strict equality with charset parameter

#### Test RH-13: Multiple sequential calls return consistent responses (Line 166)
```typescript
it('RH-13: multiple sequential calls return consistent responses', async () => {
  const responses = await Promise.all([GET(), GET(), GET()]);
  const bodies = await Promise.all(responses.map((res) => res.json()));

  responses.forEach((res) => {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');  // ← FAILS
  });

  const expected = { ok: true, variant: '1024087252' };  // or '887203910'
  bodies.forEach((body) => {
    expect(body).toEqual(expected);
  });
});
```
**Status**: FAILING  
**Issue**: Inside loop iteration, line 166 assertion fails due to charset parameter

---

## 2. Solution Design

### Approach: Replace Strict Equality with Flexible Matching

**Rationale**:
- RFC 7231 permits charset parameter in Content-Type headers
- Next.js Response automatically appends `;charset=utf-8` for JSON responses
- Tests should validate the CORE type (`application/json`) not implementation details
- Flexible matching maintains strict semantics while accepting valid variations

### Recommended Fix: `toContain()`

**Why `toContain()` over alternatives**:
- ✓ Clearest intent: "Content-Type header contains application/json"
- ✓ Resilient to charset, boundary parameters, or future variations
- ✓ Standard library method (no regex complexity)
- ✓ Readable and maintainable

**Alternative rejected**:
- `toMatch(/^application\/json/)` — regex more complex, less readable, same result

### Implementation Changes

**File 1**: `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
- Line 97 (RH-07): `toBe('application/json')` → `toContain('application/json')`
- Line 166 (RH-13): `toBe('application/json')` → `toContain('application/json')`

**File 2**: `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts`
- Line 97 (RH-07): `toBe('application/json')` → `toContain('application/json')`
- Line 166 (RH-13): `toBe('application/json')` → `toContain('application/json')`

---

## 3. Acceptance Criteria

### AC-01: Test Assertions Fixed
- [ ] All 4 Content-Type assertions converted to `toContain('application/json')`
- [ ] Lines 97 and 166 in both files updated
- [ ] No other assertions modified

### AC-02: Tests Pass
- [ ] `healthz-smoke-1024087252` test suite: 14/14 passing
- [ ] `healthz-smoke-bugfix2-887203910` test suite: 14/14 passing
- [ ] Total across both files: 28/28 passing

### AC-03: No Regression
- [ ] All other tests in the project remain passing
- [ ] Endpoint functionality unchanged (no implementation edits)
- [ ] Test semantics preserved (still validates JSON content-type)

### AC-04: Code Quality
- [ ] ESLint: 0 warnings
- [ ] TypeScript: strict type checking clean
- [ ] No commented-out code
- [ ] Consistent formatting

---

## 4. Implementation Steps

### Step 1: Verify Current State (Baseline)
- [ ] Read both test files completely
- [ ] Confirm exact locations of failing assertions
- [ ] Run tests to capture current failure output
- [ ] Document baseline: which tests fail, error messages

**Files**:
- `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
- `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts`

### Step 2: Fix Test File 1
- [ ] Open `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
- [ ] Line 97 (RH-07 test):
  - OLD: `expect(res.headers.get('Content-Type')).toBe('application/json');`
  - NEW: `expect(res.headers.get('Content-Type')).toContain('application/json');`
- [ ] Line 166 (RH-13 test):
  - OLD: `expect(res.headers.get('Content-Type')).toBe('application/json');`
  - NEW: `expect(res.headers.get('Content-Type')).toContain('application/json');`

### Step 3: Fix Test File 2
- [ ] Open `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts`
- [ ] Line 97 (RH-07 test):
  - OLD: `expect(res.headers.get('Content-Type')).toBe('application/json');`
  - NEW: `expect(res.headers.get('Content-Type')).toContain('application/json');`
- [ ] Line 166 (RH-13 test):
  - OLD: `expect(res.headers.get('Content-Type')).toBe('application/json');`
  - NEW: `expect(res.headers.get('Content-Type')).toContain('application/json');`

### Step 4: Verify & Test
- [ ] Run tests for both affected files
- [ ] Confirm 14/14 tests pass in each file (28 total)
- [ ] Run full test suite (`npm run test`)
- [ ] Verify no other tests broken

### Step 5: Code Quality Checks
- [ ] Run `npm run lint` (0 warnings)
- [ ] Run `npm run typecheck` (0 errors)
- [ ] Run `npm run format` if needed
- [ ] Review diff to confirm only 4 lines changed

### Step 6: Commit & Complete
- [ ] Create git commit with clear message
- [ ] Commit message template:
  ```
  fix(VRTX-0077): replace strict Content-Type assertions with flexible matching
  
  Tests were using toBe('application/json') to check Content-Type headers,
  but Next.js appends charset parameter: 'application/json;charset=utf-8'.
  RFC 7231 permits this charset parameter, so test assertions were overly
  strict and caused failures.
  
  Changed assertions to use toContain('application/json') to validate the
  core type while accepting valid RFC-compliant variations (charset, etc).
  
  Affected tests:
  - healthz-smoke-1024087252: RH-07 (line 97), RH-13 (line 166)
  - healthz-smoke-bugfix2-887203910: RH-07 (line 97), RH-13 (line 166)
  
  All 28 tests now passing.
  ```

---

## 5. Test Coverage & Verification

### Test Matrix

| Test File | Test Suite | Test Case | Line | Fix | Status |
|-----------|-----------|-----------|------|-----|--------|
| healthz-smoke-1024087252 | RH-07 | Content-Type header is application/json | 97 | toContain | FIX |
| healthz-smoke-1024087252 | RH-13 | Multiple calls return consistent responses | 166 | toContain | FIX |
| healthz-smoke-bugfix2-887203910 | RH-07 | Content-Type header is application/json | 97 | toContain | FIX |
| healthz-smoke-bugfix2-887203910 | RH-13 | Multiple calls return consistent responses | 166 | toContain | FIX |

### Passing Tests (Unmodified)
The following tests should continue to pass (no changes needed):
- RH-01 through RH-06: HTTP status, response structure, field types
- RH-08 through RH-14: Response instance, performance, auth, self-contained

**Total coverage after fix**: 28/28 tests passing

---

## 6. Risk Assessment

### Risk Level: LOW

**Reasoning**:
- Pure test refactoring (no implementation changes)
- No endpoint code modified
- Assertions remain semantically equivalent
- `toContain()` is more lenient, not stricter
- Well-isolated to two test files

### Potential Issues & Mitigation

| Issue | Probability | Mitigation |
|-------|-------------|-----------|
| Typo in assertion | Low | Review diff before commit |
| Wrong line numbers | Low | Verify line counts match |
| Unintended side effects | Minimal | Full test suite run |
| Merge conflict | Minimal | Branch is isolated to test files |

---

## 7. Deliverables Checklist

- [x] **artifacts/VRTX-0077/plan.md** (this file)
  - Implementation strategy documented
  - Acceptance criteria defined
  - Risk assessment included

- [ ] **artifacts/VRTX-0077/tdd-test-cases.md**
  - Test matrix and specifications
  - Expected outcomes documented

- [ ] **artifacts/VRTX-0077/tdd-test-result.md**
  - Baseline test run (before fix)
  - Results after fix
  - Diff summary

- [ ] **artifacts/VRTX-0077/summary.md**
  - Executive summary
  - Changes made
  - Verification results

---

## 8. Related Tickets

- **VRTX-0074**: Implement `/api/healthz-smoke-1024087252` endpoint
- **VRTX-0075**: Implement `/api/healthz-smoke-bugfix2-887203910` endpoint
- **VRTX-0077**: Fix overly strict Content-Type header assertions (THIS TICKET)

---

## 9. Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Planning & Analysis | Now | ✓ Complete |
| Test Baseline | 5 min | — |
| Implementation | 5 min | — |
| Verification | 5 min | — |
| Code Review | 5 min | — |
| Commit & Complete | 2 min | — |
| **TOTAL** | **~22 min** | **—** |

---

## 10. Next Steps

1. ✓ This plan document created
2. Run baseline test suite to confirm failures
3. Apply fixes to both test files (4 changes)
4. Run test suite to verify all pass
5. Commit changes with clear message
6. Create summary report
7. Close ticket as DONE

---

**Plan Author**: Claude Agent  
**Plan Date**: 2026-07-04  
**Ticket**: VRTX-0077  
**Branch**: vortex/fix/VRTX-0077-fix-overly-strict-content-type-header-as
