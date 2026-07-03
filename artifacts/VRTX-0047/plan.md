# Bug Fix Plan: VRTX-0047 - Missing Discounts Table Schema

**Ticket:** VRTX-0047  
**Type:** DEFECT (Build Blocker)  
**Sprint:** SPRINT-0008  
**Date:** 2026-07-03

---

## Issue Summary

The discount feature is partially implemented but has schema/validation mismatches that block the build. TypeScript errors occur because:

1. **Schema Field Mismatch:** The test file expects `startsAt` and `endsAt` fields, but the merchant schema only defines `expirationDate`
2. **Validation Schema Mismatch:** Tests expect `discountPercentage` field, but validation schema uses `value` with `type`
3. **Type Export Bug:** The merchant-schema.ts file tries to export types from variables that are only defined inside the function scope

---

## Root Cause Analysis

### Current State (Broken)

**merchant-schema.ts (lines 216-233):**
- Defines `discounts` table with: `code`, `type`, `value`, `description`, `expirationDate`, `isActive`, `timesUsed`
- **Missing:** `startsAt`, `endsAt` (date range for discount validity)
- Lines 252-253 attempt to export types from `discounts` but `discounts` is a local variable

**admin.ts validation schema (lines 212-282):**
- Uses `type` enum: 'percentage' | 'fixed_amount'
- Uses `value` as numeric field
- Uses `expirationDate` for expiration
- **Does NOT have:** `startsAt`, `endsAt`, `discountPercentage`

**admin.discount.test.ts:**
- Expects `code`, `discountPercentage`, `startsAt`, `endsAt`, `description`
- Tests validate date ranges (startAt must be ≥1 day in future, endAt must be after startAt)
- 671 lines of comprehensive tests that don't match implementation

### Expected State (Fixed)

The discount feature should support:
- **Discount validity window:** `startsAt` and `endsAt` define when discount is active
- **Discount value:** `discountPercentage` for percentage-based discounts (instead of generic `value`/`type`)
- **Optional fields:** `description`, properly typed and validated
- **Proper schema-to-validation alignment:** All fields in tests must exist in schema

---

## Fix Strategy

### Step 1: Update Merchant Schema
Update `src/lib/db/merchant-schema.ts`:
1. Add `startsAt` and `endsAt` timestamp fields to discounts table
2. Ensure all field types match test expectations
3. Fix type exports to work with table definition

### Step 2: Update Validation Schema
Update `src/lib/validations/admin.ts`:
1. Replace `type`/`value` fields with `discountPercentage`
2. Add `startsAt` and `endsAt` fields with proper datetime validation
3. Ensure `startsAt` >= 1 day in future, `endsAt` > `startsAt`

### Step 3: Sync Discount Types
Update `src/lib/types/discount.ts`:
1. Add `startsAt` and `endsAt` fields
2. Change `value` to `discountPercentage`
3. Remove `type` field (simplified model)

### Step 4: Verify Tests Pass
Run the test suite to ensure all 671 discount tests pass

### Step 5: Verify Build
Run `npm run build` and `npm run typecheck` to confirm zero TypeScript errors

---

## Affected Files

| File | Change | Priority |
|------|--------|----------|
| src/lib/db/merchant-schema.ts | Add startsAt, endsAt fields; fix type exports | Critical |
| src/lib/validations/admin.ts | Replace type/value with discountPercentage; add date range fields | Critical |
| src/lib/types/discount.ts | Align with schema changes | Critical |
| src/lib/db/provision-merchant.ts | May need DDL updates for new fields | Medium |

---

## Acceptance Criteria

- ✓ Discounts table has `startsAt` and `endsAt` timestamp fields
- ✓ All test-expected fields are defined in schema
- ✓ Validation schema matches merchant schema fields
- ✓ Type exports work correctly (no scope issues)
- ✓ All discount validation tests pass (admin.discount.test.ts)
- ✓ Build succeeds with `npm run build`
- ✓ TypeScript check passes: `npm run typecheck`

---

## Timeline

1. Analyze root cause (done)
2. Write specification (this document)
3. Write failing tests (TDD red phase)
4. Fix merchant schema
5. Fix validation schema
6. Fix type definitions
7. Update DDL/provisioning if needed
8. Verify tests pass (TDD green phase)
9. Code review
10. Commit and push

---

## Risk Assessment

**Risk Level:** Medium
- This affects the discount feature (relatively new/isolated)
- Changes are localized to schema/validation/types
- Good test coverage ensures correctness

**Mitigation:**
- Follow TDD: write tests first, verify they're correct before fixing code
- Mirror existing patterns from other features (staff, services)
- Comprehensive test suite catches regressions
