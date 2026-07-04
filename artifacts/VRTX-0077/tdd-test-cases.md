# TDD Test Cases: Content-Type Header Assertion Fix

**Ticket:** VRTX-0077
**Type:** Bug Fix
**Date:** 2026-07-04

---

## Test Suite Overview

**Affected Files:**
- `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts` (2 failing assertions)
- `src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts` (2 failing assertions)

**Framework:** Vitest
**Total Tests:** 28 (14 per file)
**Current Status:** 24 passing, 4 failing

---

## Failing Tests Matrix

| File | Test ID | Line | Current Assertion | Issue | Fix |
|------|---------|------|-------------------|-------|-----|
| healthz-smoke-1024087252 | RH-07 | 97 | `toBe('application/json')` | Fails on `'application/json;charset=utf-8'` | Use `toContain()` |
| healthz-smoke-1024087252 | RH-13 | 166 | `toBe('application/json')` | Fails on `'application/json;charset=utf-8'` | Use `toContain()` |
| healthz-smoke-bugfix2-887203910 | RH-07 | 97 | `toBe('application/json')` | Fails on `'application/json;charset=utf-8'` | Use `toContain()` |
| healthz-smoke-bugfix2-887203910 | RH-13 | 166 | `toBe('application/json')` | Fails on `'application/json;charset=utf-8'` | Use `toContain()` |

---

## Detailed Test Specifications

### Test RH-07: Content-Type Header Validation

**Location:** Line 97 in both test files
**Type:** HTTP Headers & Meta group
**Purpose:** Verify Content-Type header is application/json

**Before (Failing):**
```typescript
// AC-07: Content-Type header is application/json
it('RH-07: Content-Type header is application/json', async () => {
  const res = await GET();
  expect(res.headers.get('Content-Type')).toBe('application/json');
});
```

**Issue:** 
- Actual header: `"application/json;charset=utf-8"`
- Expected by test: `"application/json"`
- `toBe()` requires exact match → FAIL

**After (Passing):**
```typescript
// AC-07: Content-Type header is application/json
it('RH-07: Content-Type header is application/json', async () => {
  const res = await GET();
  expect(res.headers.get('Content-Type')).toContain('application/json');
});
```

**Why Fix Works:**
- `toContain()` checks substring presence, not exact match
- Accepts `"application/json;charset=utf-8"` because it contains `"application/json"`
- Still validates the critical requirement: JSON content type
- RFC 7231 compliant

---

### Test RH-13: Multiple Calls Consistency Check

**Location:** Line 166 in both test files
**Type:** Public Access & Consistency group
**Purpose:** Verify multiple sequential calls return consistent responses

**Before (Failing):**
```typescript
// AC-13: Consistency — multiple sequential calls return identical responses
it('RH-13: multiple sequential calls return consistent responses', async () => {
  const responses = await Promise.all([GET(), GET(), GET()]);
  const bodies = await Promise.all(responses.map((res) => res.json()));

  responses.forEach((res) => {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');  // ← FAILS HERE
  });

  const expected = { ok: true, variant: '...' };
  bodies.forEach((body) => {
    expect(body).toEqual(expected);
  });
});
```

**Issue:**
- Same as RH-07: `toBe()` on `"application/json;charset=utf-8"`
- Fails in the loop when checking Content-Type header

**After (Passing):**
```typescript
// AC-13: Consistency — multiple sequential calls return consistent responses
it('RH-13: multiple sequential calls return consistent responses', async () => {
  const responses = await Promise.all([GET(), GET(), GET()]);
  const bodies = await Promise.all(responses.map((res) => res.json()));

  responses.forEach((res) => {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');  // ← FIXED
  });

  const expected = { ok: true, variant: '...' };
  bodies.forEach((body) => {
    expect(body).toEqual(expected);
  });
});
```

**Why Fix Works:**
- Same rationale as RH-07
- Now accepts `"application/json;charset=utf-8"` in loop iterations
- Still validates Content-Type is JSON across all 3 calls

---

## Unaffected Tests

These 24 tests require NO changes and should continue to pass:

### healthz-smoke-1024087252 (12 passing tests)
- RH-01: HTTP 200 status ✓
- RH-02: Correct JSON structure ✓
- RH-03: No extra fields ✓
- RH-04: Exactly two root fields ✓
- RH-05: ok field is boolean true ✓
- RH-06: variant field is string ✓
- **RH-07: Content-Type (BEING FIXED)**
- RH-08: NextResponse instance ✓
- RH-09: Response time < 100ms ✓
- RH-10: Response time < 10ms ✓
- RH-11: Load test (50 concurrent) ✓
- RH-12: No authentication required ✓
- **RH-13: Multiple calls consistency (BEING FIXED)**
- RH-14: Self-contained ✓

### healthz-smoke-bugfix2-887203910 (12 passing tests)
- Same as above (2 being fixed, 12 unaffected)

---

## Test Execution Strategy

### Phase 1: Red (Current State)

```bash
npm run test run src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts
# Expected: 12/14 passing
# Failures: RH-07, RH-13 (Content-Type strict equality)

npm run test run src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts
# Expected: 12/14 passing
# Failures: RH-07, RH-13 (Content-Type strict equality)
```

### Phase 2: Green (After Fix)

```bash
npm run test run src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts
# Expected: 14/14 passing ✓

npm run test run src/app/api/healthz-smoke-bugfix2-887203910/__tests__/route.test.ts
# Expected: 14/14 passing ✓

npm run test run
# Expected: All tests pass (no regressions)
```

---

## Acceptance Criteria Mapping

| Criterion | Test Coverage |
|-----------|----------------|
| FIX-01: Line 97 healthz-smoke-1024087252 uses `toContain()` | RH-07 assertion update |
| FIX-02: Line 166 healthz-smoke-1024087252 uses `toContain()` | RH-13 assertion update |
| FIX-03: Line 97 healthz-smoke-bugfix2-887203910 uses `toContain()` | RH-07 assertion update |
| FIX-04: Line 166 healthz-smoke-bugfix2-887203910 uses `toContain()` | RH-13 assertion update |
| FIX-05: All 14 tests pass (healthz-smoke-1024087252) | All 14 tests green |
| FIX-06: All 14 tests pass (healthz-smoke-bugfix2-887203910) | All 14 tests green |
| FIX-07: No regressions in other tests | 24 other tests continue passing |
| FIX-08: Endpoint functionality preserved | Manual verification (already done) |

---

## Notes

- **No Test Logic Changes:** Only assertions are updated; test flow and coverage remain identical
- **No Implementation Changes:** Endpoints function correctly; only test assertions were too strict
- **Backward Compatible:** Fix doesn't break any test semantics; it broadens valid values as intended
- **RFC Compliant:** Tests now accept RFC 7231-compliant headers with charset parameters

---

*This test matrix is the contract for the fix. Any deviation must be documented in summary.md.*
