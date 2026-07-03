# Bug Fix Plan: VRTX-0049 - Incomplete Discount Schema Update

**Ticket:** VRTX-0049  
**Type:** DEFECT (Build Blocker - Rework Cycle)  
**Related:** VRTX-0047 (incomplete)  
**Sprint:** SPRINT-0008  
**Date:** 2026-07-03  
**Severity:** Critical

---

## Issue Summary

PR #32 (VRTX-0047) added `startsAt`/`endsAt` fields to the discounts schema but failed to synchronize dependent code (forms, validations, types, tests). This creates 25+ TypeScript compilation errors across multiple files, blocking the build.

**Root Cause:** VRTX-0047 was incomplete - it only updated the schema definition without updating all dependent code.

---

## Current State Analysis

### Database Schema (merchant-schema.ts)
- Has: `code`, `type` (enum), `value` (numeric), `description`, `startsAt`, `endsAt`, `isActive`, `timesUsed`
- Problem: Uses `type`/`value` instead of `discountPercentage`

### Validation Schema (admin.ts) - Already Fixed
- Has: `code`, `discountPercentage`, `startsAt`, `endsAt`, `description`
- Status: Correct, aligned with intended design

### Components (CreateDiscountForm)
- Expects: Fields matching validation schema
- Problem: Form tries to use undefined `type` field

### Types (discount.ts)
- Problem: Outdated field definitions

### Tests (multiple files)
- Problem: Reference old field names

---

## Fix Strategy

**Decision:** Align database schema with validation schema (which is already correct)

1. Update merchant-schema.ts:
   - Remove `type` field (no longer needed - percentage only)
   - Rename `value` to `discountPercentage`
   - Keep `startsAt` and `endsAt`

2. Update provision-merchant.ts:
   - Update DDL to match new schema

3. Update discount.ts type definition:
   - Remove `type` field
   - Change `value` to `discountPercentage`

4. Update components:
   - CreateDiscountForm will automatically work (uses validation schema)

5. Update tests:
   - Sync test data with new field names

6. Verify all files compile and tests pass

---

## Affected Files Summary

| File | Changes | Type |
|------|---------|------|
| merchant-schema.ts | Remove `type`, rename `value` to `discountPercentage` | Schema |
| provision-merchant.ts | Update DDL | DDL |
| discount.ts | Update type definition | Types |
| admin.ts | Already correct (no change needed) | Validation |
| CreateDiscountForm.tsx | Already correct (no change needed) | Component |
| CreateDiscountForm.test.tsx | Update test data | Tests |
| admin.discount.test.ts | Update test data | Tests |
| Other discount files | Minor field reference updates | Various |

---

## Acceptance Criteria

✅ Database schema uses `discountPercentage` instead of `type`/`value`  
✅ All type definitions updated  
✅ All components use correct field names  
✅ All tests updated and passing  
✅ Build succeeds: `npm run build` (0 TypeScript errors)  
✅ Type checking passes: `npm run typecheck` (0 errors)  
✅ All discount tests pass: `npm run test src/lib/validations/__tests__/admin.discount.test.ts`

---

## Timeline

1. Analyze issue and create plan (done)
2. Write specification and test plan
3. Update schema files
4. Update type definitions
5. Update test fixtures
6. Verify build and tests pass
7. Commit and push
8. Create PR

---

## Risk Assessment

**Risk Level:** Medium
- Schema changes require database migration consideration
- Multiple files affected
- Existing tests define expectations

**Mitigation:**
- Changes are atomic (field rename/removal)
- Validation schema already correct (reduces risk)
- Tests provide safety net
