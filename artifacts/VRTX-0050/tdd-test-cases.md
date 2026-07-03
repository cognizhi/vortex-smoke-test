# TDD Test Cases: VRTX-0050 - Unused Request Parameter in Branding Reset Route

**Ticket:** VRTX-0050  
**Type:** Bug Fix (Code Cleanup)  
**Issue:** Unused `request` parameter in getSession stub

---

## Overview

This bug fix involves removing an unused parameter. Since there's no new functionality being added, there are no traditional unit or component tests. Instead, the "tests" are build verification checks.

---

## Test Strategy

For parameter cleanup, verification focuses on:
1. **Build Success** — Can the project be built without the parameter?
2. **Type Safety** — Does TypeScript pass without errors?
3. **Signature Matching** — Do function definition and caller match?
4. **No Regressions** — Are there any new errors introduced?

---

## Test Cases

| ID | Type | Test Case | Expected Result | Status |
|----|------|-----------|-----------------|--------|
| TC-01 | Build | `npm run build` succeeds | Build passes with 0 errors | Red → Green |
| TC-02 | TypeCheck | `npm run typecheck` passes | 0 type errors | Red → Green |
| TC-03 | Lint | `npm run lint` passes | 0 lint warnings | Red → Green |
| TC-04 | Signature | getSession has no parameters | Function signature simplified | Green ✅ |
| TC-05 | Call Site | getSession called without parameters | Caller updated correctly | Green ✅ |
| TC-06 | Return Value | getSession returns hardcoded data | Stub behavior unchanged | Green ✅ |

---

## Red Phase Behavior (Before Fix)

**Expected:** Build fails with type error for unused parameter

```
$ npm run build

Type error: 'request' is declared but its value is never read.

✖ src/app/api/admin/branding/reset/route.ts:47:27
    async function getSession(request: NextRequest) {
                              ^^^^^^^

BUILD FAILED
```

**Test Results:**
- TC-01: ❌ Build fails
- TC-02: ❌ Type check fails  
- TC-03: ❌ Lint fails (unused parameter)
- TC-04: ✅ Parameter exists (but unused)
- TC-05: ✅ Caller passes request
- TC-06: ✅ Returns hardcoded data

---

## Green Phase Behavior (After Fix)

**Expected:** Build succeeds with no errors

```
$ npm run build

✓ Compiled successfully
BUILD SUCCESSFUL
```

**Test Results:**
- TC-01: ✅ Build passes
- TC-02: ✅ Type check passes  
- TC-03: ✅ Lint passes (no unused parameters)
- TC-04: ✅ getSession has no parameters
- TC-05: ✅ getSession() called without parameters
- TC-06: ✅ Returns same hardcoded data

---

## Verification Commands

```bash
# Verify the fix
npm run build          # Must pass with 0 errors
npm run typecheck      # Must pass with 0 errors
npm run lint           # Must pass with 0 warnings

# Visual inspection
grep -n "getSession" src/app/api/admin/branding/reset/route.ts
# Expected: 
#   Line 47: async function getSession() {
#   Line 57: const session = await getSession();
```

---

## Success Criteria

✅ **Build:** Passes without errors  
✅ **Type Check:** Passes without errors  
✅ **Linting:** Passes without warnings  
✅ **Signature:** Function has no parameters  
✅ **Call Site:** Function called without arguments  
✅ **Functionality:** No regressions  

---

## File Scope

**Only File Modified:**
- `src/app/api/admin/branding/reset/route.ts` (2 locations: line 47 + line 57)

**Changes:**
1. Remove `request: NextRequest` parameter from function definition
2. Remove `request` argument from function call
3. Keep TODO comment and return values unchanged

---

## Regression Tests

To ensure no regressions:

1. **Function Still Works:**
   - getSession still returns an object with user property
   - Return value has correct structure (id, merchantId, role, email)

2. **No Unintended Changes:**
   - TODO comment still present
   - Hardcoded values unchanged
   - No other code modified

3. **No New Errors:**
   - No new type errors
   - No new lint warnings
   - No new build errors

---

## Summary

This is a minimal fix with no functional changes:
- **Before:** Unused `request` parameter causes build to fail
- **After:** Parameter removed, build succeeds

All test results will show:
- Red Phase (before fix): Build fails, 1 TypeScript error
- Green Phase (after fix): Build passes, 0 errors
