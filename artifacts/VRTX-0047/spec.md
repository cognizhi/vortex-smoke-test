# Bug Fix Specification: VRTX-0047 - Missing Discounts Table Schema

**Ticket:** VRTX-0047  
**Type:** DEFECT (Build Blocker)  
**Severity:** Critical  
**Date:** 2026-07-03

---

## 1. Bug Description

The discount feature implementation is incomplete. The merchant schema is missing critical fields, and validation schemas don't match the merchant schema, causing 46+ TypeScript compilation errors that block the production build. The feature was partially started (validation schemas and test suite created) but the core database schema was never completed.

**Symptom:** Build fails with:
```
error TS2304: Cannot find name 'discounts'
error TS2339: Property 'startsAt' does not exist on type ...
error TS2339: Property 'endsAt' does not exist on type ...
error TS2339: Property 'discountPercentage' does not exist on type ...
```

---

## 2. Root Cause Analysis

### Current Implementation (Broken)

**Database Schema (`merchant-schema.ts`, lines 216-233):**
```typescript
const discounts = s.table('discounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  type: text('type', { enum: ['percentage', 'fixed_amount'] }).notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  expirationDate: timestamp('expiration_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  timesUsed: integer('times_used').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Type Exports (lines 252-253):**
```typescript
export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = typeof discounts.$inferInsert;
```
❌ **Problem:** `discounts` is only defined within `createMerchantSchema()` function scope; these exports fail

**Validation Schema (`admin.ts`, lines 212-282):**
```typescript
export const createDiscountSchema = z.object({
  code: discountCodeSchema,
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive(...),
  expirationDate: z.string().datetime(...),
  description: z.string().optional(),
});
```

**Test Expectations (`admin.discount.test.ts`):**
```typescript
// Tests expect these fields:
createDiscountSchema.parseAsync({
  code: 'SUMMER2026',
  discountPercentage: 15,      // ❌ NOT in validation schema!
  startsAt: '2026-12-06T20:13', // ❌ NOT in schema!
  endsAt: '2026-12-10T23:59',   // ❌ NOT in schema!
  description: 'Summer sale'
});
```

### Issue #1: Missing Fields in Database Schema
The merchant schema defines `expirationDate` (when discount expires) but tests expect:
- `startsAt` - when discount becomes active
- `endsAt` - when discount stops being active

This represents a discount "validity window" (e.g., "available from Dec 1-15").

### Issue #2: Mismatched Validation Schema
The validation schema uses generic `type`/`value` fields:
- `type: 'percentage' | 'fixed_amount'`
- `value: number`

But tests expect:
- `discountPercentage: number` (simplified, percentage-only discounts)
- `startsAt: string` (datetime)
- `endsAt: string` (datetime)

### Issue #3: Type Exports in Wrong Scope
Lines 252-253 try to export types from `discounts` variable, but it's not accessible outside `createMerchantSchema()`.

### Issue #4: Test Suite Has 671 Lines of Validation Tests
The test file comprehensively tests:
- Datetime format validation (datetime-local transformation to ISO 8601)
- Date range validation (past dates rejected, current time rejected, ≥1 day in future required)
- Start/end date relationship (end must be after start)
- All validation rules expect these fields to exist

---

## 3. Fix Approach

The tests are the source of truth for the intended design. The fix is to align the database schema and validation schemas with what the tests define.

### Fix #1: Update Database Schema
**File:** `src/lib/db/merchant-schema.ts`

Add missing fields to the discounts table:
```typescript
const discounts = s.table('discounts', {
  // ... existing fields ...
  code: text('code').notNull(),
  type: text('type', { enum: ['percentage', 'fixed_amount'] }).notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  // NEW FIELDS:
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  // ... rest unchanged
});
```

Fix type exports by returning them as part of the schema object:
```typescript
return {
  // ... other tables ...
  discounts,
} as const;

// Export types at module level, not inside function
export type Discount = ReturnType<typeof createMerchantSchema>['discounts'];
```

### Fix #2: Update Validation Schema
**File:** `src/lib/validations/admin.ts`

Replace `type`/`value` with `discountPercentage` and add date range fields:
```typescript
export const createDiscountSchema = z
  .object({
    code: discountCodeSchema,
    discountPercentage: z
      .number()
      .min(0.01, 'Discount must be at least 0.01%')
      .max(100, 'Discount cannot exceed 100%'),
    startsAt: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(Date.now() + 86400000), {
        message: 'Start date must be at least 1 day in the future'
      }),
    endsAt: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(Date.now() + 86400000), {
        message: 'End date must be at least 1 day in the future'
      }),
    description: z.string().max(255).optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'End date must be after start date',
    path: ['endsAt']
  });
```

### Fix #3: Update Discount Types
**File:** `src/lib/types/discount.ts`

Align the interface with schema changes:
```typescript
export interface Discount {
  id: string;
  code: string;
  type: DiscountType; // or remove if moving to discountPercentage only
  value: number;      // or rename to discountPercentage
  startsAt: Date;     // NEW
  endsAt: Date;       // NEW
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Fix #4: Update DDL for Tenant Provisioning
**File:** `src/lib/db/provision-merchant.ts`

Update the `merchantDdl()` function to include the new timestamp fields in the CREATE TABLE statement:
```sql
CREATE TABLE IF NOT EXISTS {schema}.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  description TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

---

## 4. Regression Risk

**Risk Level:** Low (localized changes)
- Changes are contained to discount schema/validation/types
- Discount feature is new (SPRINT-0008) with no dependent code
- Comprehensive test suite catches issues immediately
- No existing bookings reference discounts

**Mitigation:**
- Run full test suite after each fix
- Verify TypeScript compilation
- Check that build succeeds

---

## 5. Fix Acceptance Criteria

✅ **Schema Requirements:**
- `discounts` table includes `startsAt` and `endsAt` timestamp fields
- Type exports work correctly (types are accessible outside function)
- All fields match test expectations

✅ **Validation Requirements:**
- `createDiscountSchema` has: `code`, `discountPercentage`, `startsAt`, `endsAt`, `description`
- `updateDiscountSchema` has all above fields as optional
- Validation rules match test expectations:
  - `startsAt` must be ≥1 day in future
  - `endsAt` must be ≥1 day in future
  - `endsAt` must be after `startsAt`
  - Code validation (3-50 chars, uppercase letters/numbers/hyphens)

✅ **Type Requirements:**
- `Discount` interface has all schema fields
- `CreateDiscountInput` and `UpdateDiscountInput` types infer correctly from schemas

✅ **Build Requirements:**
- `npm run typecheck` passes with 0 errors
- `npm run build` succeeds
- `npm run test src/lib/validations/__tests__/admin.discount.test.ts` passes (all 671 tests)

---

## 6. Affected Code Paths

| File | Scope | Status |
|------|-------|--------|
| `src/lib/db/merchant-schema.ts` | Database schema definition | Fix required |
| `src/lib/db/provision-merchant.ts` | Tenant DDL | Fix required |
| `src/lib/validations/admin.ts` | Input validation | Fix required |
| `src/lib/types/discount.ts` | TypeScript types | Fix required |
| `src/lib/validations/__tests__/admin.discount.test.ts` | Tests | No change (already correct) |

---

## 7. Implementation Order

1. **First:** Update merchant-schema.ts (add fields, fix exports)
2. **Second:** Update admin.ts validation schema (match schema fields)
3. **Third:** Update discount.ts types (align interfaces)
4. **Fourth:** Update provision-merchant.ts DDL (if using raw SQL)
5. **Verify:** Run tests and build to confirm all fixes work together

This order ensures each layer builds on the previous one with minimal backtracking.
