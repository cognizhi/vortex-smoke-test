# Bug Fix Plan: VRTX-0050 - Unused Request Parameter in Branding Reset Route

**Ticket:** VRTX-0050  
**Type:** DEFECT (Build Blocker - Rework Cycle)  
**Sprint:** SPRINT-0008  
**Date:** 2026-07-03  
**Severity:** Critical

---

## Issue Summary

The `getSession(request: NextRequest)` helper function in the branding reset route has an unused `request` parameter. The function is a TODO/stub implementation that returns hardcoded values without using the request parameter, causing a TypeScript compilation error.

**Error:**
```
Type error: 'request' is declared but its value is never read.
```

**File:** `src/app/api/admin/branding/reset/route.ts` (line 47)

---

## Root Cause

The function is a placeholder/stub implementation with a TODO comment. The `request` parameter was declared for future session implementation but is not currently used.

---

## Fix Strategy

Since this is a stub implementation marked with a TODO, and the proper session handling can be implemented later, the best approach is to:

**Option B (Chosen):** Remove the unused `request` parameter
- Simplify the stub to not require the unused parameter
- Keep the hardcoded return values for now
- Update the caller to not pass the request
- Leave the TODO comment for future proper implementation

**Why Option B:**
- Minimal, focused change (fixes the build blocker)
- Doesn't attempt incomplete session logic
- Preserves the TODO for proper implementation later
- Reduces compiler errors immediately

---

## Changes Required

**1. Update getSession function signature (line 47):**
```typescript
// Before:
async function getSession(request: NextRequest) {

// After:
async function getSession() {
```

**2. Update the function call (line 57):**
```typescript
// Before:
const session = await getSession(request);

// After:
const session = await getSession();
```

---

## Acceptance Criteria

✅ Remove unused `request` parameter from getSession function  
✅ Update the caller to not pass the request  
✅ Build succeeds with `npm run build` (0 TypeScript errors)  
✅ Type checking passes: `npm run typecheck`  
✅ TODO comment preserved for future proper implementation  

---

## Risk Assessment

**Risk Level:** Minimal
- Single parameter removal
- Only affects stub implementation
- No impact on functionality (still returns hardcoded data)
- No impact on other parts of the codebase

---

## Timeline

1. Analyze issue (done)
2. Write plan & spec
3. Create test expectations
4. Fix the code
5. Verify build passes
6. Commit and push
7. Create PR
