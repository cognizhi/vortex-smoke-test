# Bug Fix Plan: VRTX-0046 - Unused Edit Import Blocks Build

**Ticket:** VRTX-0046  
**Type:** DEFECT (Build Blocker)  
**Sprint:** SPRINT-0008  
**Date:** 2026-07-03  
**Severity:** Critical

---

## Issue Summary

The `Edit` icon from `lucide-react` is imported in `src/app/(admin)/admin/discounts/page.tsx` but never used in the component. TypeScript strict mode treats this as an error, blocking the production build.

**Error Message:**
```
Type error: 'Edit' is declared but its value is never read.
```

---

## Root Cause

During component development, the `Edit` icon was imported as part of the icon set but was never actually used in any JSX. The unused import violates the ESLint rule enforced by tsconfig.json (`--max-warnings 0`).

---

## Fix Strategy

This is a straightforward fix requiring only one change:
1. Remove `Edit` from the lucide-react import statement in the discounts page

**File:** `src/app/(admin)/admin/discounts/page.tsx` (line 4)

**Before:**
```typescript
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Tag } from 'lucide-react'
```

**After:**
```typescript
import { Plus, Trash2, ToggleLeft, ToggleRight, Calendar, Tag } from 'lucide-react'
```

---

## Acceptance Criteria

✅ Remove `Edit` import from lucide-react  
✅ Build succeeds with `npm run build` (0 TypeScript errors)  
✅ Type checking passes: `npm run typecheck`  
✅ No new errors introduced  
✅ File still imports all used icons  

---

## Risk Assessment

**Risk Level:** Minimal
- Single line change
- Only removes unused code
- No logic changes
- No impact on functionality

---

## Timeline

1. Analyze issue (done)
2. Write plan & spec
3. Create test expectations
4. Fix the import
5. Verify build passes
6. Commit and push
7. Create PR
