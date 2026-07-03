# Bug Fix Specification: VRTX-0050 - Unused Request Parameter in Branding Reset Route

**Ticket:** VRTX-0050  
**Type:** DEFECT (Build Blocker)  
**Severity:** Critical  
**Date:** 2026-07-03

---

## 1. Bug Description

The `getSession()` helper function in the branding reset route has an unused `request` parameter that causes TypeScript strict mode to fail compilation. The function is a TODO/stub implementation that returns hardcoded values without needing or using the request.

**Symptom:** Build fails with type error for unused parameter.

---

## 2. Root Cause Analysis

**File:** `src/app/api/admin/branding/reset/route.ts`  
**Function:** `getSession()` (line 47)  
**Issue:** Unused `request: NextRequest` parameter

```typescript
// Current (broken):
async function getSession(request: NextRequest) {  // ← 'request' never used
  // TODO: Implement session retrieval
  return {
    user: {
      id: 'user-123',
      merchantId: 'merchant-123',
      role: 'admin',
      email: 'admin@example.com',
    },
  };
}

// Called with (line 57):
const session = await getSession(request);  // ← Passes request but not needed
```

**Why It Happens:**
- Function is a stub/placeholder implementation
- TODO comment indicates incomplete session logic
- Parameter was declared for future implementation but not used
- TypeScript strict mode catches unused parameters as errors

---

## 3. Fix Approach

Remove the unused parameter from the function signature and its caller.

**Decision Rationale:**
- Option A (implement proper session logic): Too large for a build blocker fix; better done as separate ticket
- Option B (remove unused parameter): Minimal change, fixes build immediately, preserves TODO for later

**Chosen: Option B**

**Changes:**

**Change 1: Function Signature (line 47)**
```typescript
// Before:
async function getSession(request: NextRequest) {
  // TODO: Implement session retrieval
  return {
    user: {
      id: 'user-123',
      merchantId: 'merchant-123',
      role: 'admin',
      email: 'admin@example.com',
    },
  };
}

// After:
async function getSession() {
  // TODO: Implement session retrieval
  return {
    user: {
      id: 'user-123',
      merchantId: 'merchant-123',
      role: 'admin',
      email: 'admin@example.com',
    },
  };
}
```

**Change 2: Function Call (line 57)**
```typescript
// Before:
const session = await getSession(request);

// After:
const session = await getSession();
```

---

## 4. What Stays the Same

- Function return type and structure
- Hardcoded values (for now, pending TODO implementation)
- TODO comment indicating incomplete implementation
- All other route logic and error handling
- No impact on functionality (still stub behavior)

---

## 5. Future Implementation Notes

When proper session handling is implemented, the function should:

1. Extract session cookie from request:
   ```typescript
   const sessionCookie = request.cookies.get('admin_session')?.value;
   ```

2. Verify the JWT token using the project's session utilities:
   - Use `verifySessionToken()` from `src/lib/auth/session.ts`
   - Parse the JWT payload to get session data
   - Return `null` or throw error if invalid

3. Reference existing patterns:
   - `src/lib/auth/admin-guard.ts` — proper session extraction
   - `src/lib/auth/session.ts` — session token verification utilities

---

## 6. Verification

**Before Fix:**
```
npm run build
↓
Type error: 'request' is declared but its value is never read.
❌ BUILD FAILED
```

**After Fix:**
```
npm run build
↓
✓ Compiled successfully (0 errors)
✅ BUILD SUCCESSFUL

npm run typecheck
↓
✓ 0 type errors
✅ PASS
```

---

## 7. Impact Analysis

**Scope:** Minimal
- Single function parameter removal
- Only affects stub implementation
- No logic changes
- Stub still returns hardcoded data

**Risk:** None
- Removing unused parameters is always safe
- Function signature becomes simpler
- No breaking changes

---

## 8. Acceptance Criteria

✅ **Parameter Removed:**
- `request` parameter deleted from function signature
- Function call updated to not pass request

✅ **Build Success:**
- `npm run build` succeeds with 0 errors
- No new TypeScript errors introduced

✅ **Type Checking:**
- `npm run typecheck` passes with 0 errors

✅ **Code Preserved:**
- TODO comment remains for future implementation
- Return type and structure unchanged
- Hardcoded values unchanged

---

## 9. Testing Strategy

Since this is parameter cleanup on a stub:

**Tests:**
1. Build compilation: `npm run build`
2. Type checking: `npm run typecheck`
3. Visual inspection: Verify the call and function signature match

**Expected Outcome:**
- Build succeeds
- Zero TypeScript errors
- No regressions

---

## 10. Regression Risk

**Risk Level:** Zero
- Removing unused parameters cannot cause regressions
- Stub behavior unchanged
- Function still returns same hardcoded data
- No code paths affected
