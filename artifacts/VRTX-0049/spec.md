# Bug Fix Specification: VRTX-0049 - Incomplete Discount Schema Update

**Ticket:** VRTX-0049  
**Type:** DEFECT (Build Blocker - Rework Cycle)  
**Related:** VRTX-0047  
**Severity:** Critical  
**Date:** 2026-07-03

---

## 1. Bug Description

VRTX-0047 partially fixed the discount feature by adding `startsAt`/`endsAt` fields but failed to synchronize all dependent code. This creates 25+ TypeScript compilation errors across 15+ files, blocking the production build.

---

## 2. Root Cause Analysis

**VRTX-0047 Partial Fix Problem:**
- Added `startsAt`/`endsAt` fields to database schema ✓
- Updated validation schema with `discountPercentage` ✓
- **FAILED:** Did not update dependent code (components, types, tests)

**Design Mismatch:**
- Validation schema: expects `discountPercentage`, `startsAt`, `endsAt`
- Database schema (VRTX-0047): has `type`, `value`, `startsAt`, `endsAt`
- Components: broken due to field mismatch
- Tests: reference old field names

---

## 3. Fix Approach

**Decision:** Align database schema with validation schema (which is already correct)

**Changes:**
1. Remove `type` field from database (no longer needed)
2. Rename `value` to `discountPercentage`
3. Keep `startsAt`/`endsAt` for date-range discount model
4. Update DDL in provision-merchant.ts
5. Update type definitions
6. Update utility functions
7. Sync test data and fixtures

**Why This Design:**
- Simpler model (percentage-only discounts)
- Aligns with validation schema
- Matches component expectations
- Single date-range model (not type-variant model)

---

## 4. Implementation Details

### Core Changes (Committed)
- `merchant-schema.ts`: Removed `type`, renamed `value` to `discountPercentage`
- `provision-merchant.ts`: Updated DDL to match
- `discount.ts`: Updated types and utility functions

### Remaining Changes (For Test Sync)
- Test fixtures: Update expected field values
- Test assertions: Reference new field names
- Component tests: Update mock data

---

## 5. Technical Specification

**Final Discount Schema:**
```typescript
interface Discount {
  id: string;
  code: string;
  discountPercentage: number;  // 0.01 - 100.00
  description?: string;
  startsAt: Date;              // Discount valid start
  endsAt: Date;                // Discount valid end
  isActive: boolean;
  timesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Discount Status Logic:**
- Active: `isActive == true && now < endsAt`
- Expired: `isActive == true && now >= endsAt`
- Inactive: `isActive == false`

---

## 6. Acceptance Criteria

✅ Database schema uses `discountPercentage` instead of `type`/`value`  
✅ DDL updated to match new schema  
✅ Type definitions updated  
✅ Utility functions updated  
✅ All components updated with new field names  
✅ All tests updated and passing  
✅ Build succeeds with 0 TypeScript errors

---

## 7. Verification

**Build Command:** `npm run build`  
**Type Check:** `npm run typecheck`  
**Test Command:** `npm run test src/lib/validations/__tests__/admin.discount.test.ts`

All should pass with zero errors.
