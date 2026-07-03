# TDD Test Cases: VRTX-0047 - Missing Discounts Table Schema

**Ticket:** VRTX-0047  
**Type:** Bug Fix (TDD red phase tests already exist)  
**Test File:** `src/lib/validations/__tests__/admin.discount.test.ts` (671 lines, 100+ test cases)

---

## Overview

This bug fix leverages the existing, comprehensive test suite that already defines the correct behavior. The test file has 671 lines of tests covering:

1. **Datetime format validation** (20+ tests)
   - Transform datetime-local to ISO 8601
   - Validate datetime format requirements
   - Reject invalid formats

2. **Date range validation** (30+ tests)
   - Reject past dates
   - Reject current date/time
   - Enforce ≥1 day in future requirement
   - Validate end date > start date

3. **Discount percentage validation** (15+ tests)
   - Validate percentage range (0.01–100%)
   - Reject invalid percentages

4. **Code validation** (10+ tests)
   - Validate code format (3–50 chars, uppercase alphanumeric + hyphens)
   - Test case transformation (auto-uppercase)

5. **Type inference validation** (10+ tests)
   - Verify TypeScript types inferred correctly
   - Validate CreateDiscountInput and UpdateDiscountInput types

---

## Expected Test Results (Red Phase)

**Current Status (Before Fix):**
```
FAIL  src/lib/validations/__tests__/admin.discount.test.ts
Error: Property 'startsAt' does not exist on type ...
Error: Property 'endsAt' does not exist on type ...
Error: Property 'discountPercentage' does not exist on type ...

Test Suites  1 failed
Tests  100+ failed
```

**Reason:** The validation schema doesn't define the fields that tests expect.

---

## Test Coverage Matrix

| Test Category | Count | Status | Notes |
|---------------|-------|--------|-------|
| Datetime format validation | 20+ | Will pass after schema update | datetime-local → ISO 8601 |
| Date range validation | 30+ | Will pass after schema update | Past/future/range checks |
| Discount percentage validation | 15+ | Will pass after schema update | Percentage range (0.01–100%) |
| Code validation | 10+ | Already passing | Format validation |
| Type inference | 10+ | Will pass after type update | CreateDiscountInput type checks |
| **Total** | **100+** | **Will all pass** | After all fixes applied |

---

## Key Test Scenarios (Illustrative)

### Datetime Validation Tests
```typescript
// Should pass after fix
it('transforms valid datetime-local format to ISO 8601', async () => {
  const result = await createDiscountSchema.parseAsync({
    code: 'SUMMER2026',
    discountPercentage: 15,
    startsAt: '2026-12-06T20:13',  // datetime-local format
    endsAt: '2026-12-10T23:59',
  });
  // Verify startsAt is transformed: '2026-12-06T20:13:00Z'
  expect(result.startsAt).toBe('2026-12-06T20:13:00Z');
});

// Should fail before fix
it('rejects missing time separator (T)', async () => {
  const result = await createDiscountSchema.safeParseAsync({
    code: 'TEST',
    discountPercentage: 15,
    startsAt: '2026-12-06 20:13',  // space instead of T
    endsAt: '2026-12-10T23:59',
  });
  expect(result.success).toBe(false);
});
```

### Date Range Validation Tests
```typescript
// Should fail before fix
it('rejects date less than 1 day (6 hours)', async () => {
  const soonDate = getFutureDate(0, 6, 0);  // Today + 6 hours
  const result = await createDiscountSchema.safeParseAsync({
    code: 'TEST',
    discountPercentage: 15,
    startsAt: soonDate,
    endsAt: getFutureDate(10),
  });
  expect(result.success).toBe(false);
  expect(result.error?.message).toContain('1 day');
});

// Should fail before fix  
it('rejects end before start', async () => {
  const result = await createDiscountSchema.safeParseAsync({
    code: 'TEST',
    discountPercentage: 15,
    startsAt: getFutureDate(10),  // Later date
    endsAt: getFutureDate(5),     // Earlier date
  });
  expect(result.success).toBe(false);
});
```

### Type Inference Tests
```typescript
// Should fail before fix (fields don't exist)
it('CreateDiscountInput type is inferred correctly', async () => {
  const input = {
    code: 'TEST',
    discountPercentage: 15,
    startsAt: getFutureDate(5),
    endsAt: getFutureDate(10),
    description: 'Test discount'
  };
  
  const result = await createDiscountSchema.parseAsync(input);
  
  // These type checks should compile
  const _percentage: number = result.discountPercentage;
  const _startsAt: string = result.startsAt;
  const _endsAt: string = result.endsAt;
  
  expect(result).toBeDefined();
});
```

---

## Red Phase Behavior

When tests are run **before fixes** are applied:
```
FAIL  src/lib/validations/__tests__/admin.discount.test.ts

Error: Property 'startsAt' does not exist on type 
  'Omit<z.ZodType<any, z.ZodTypeDef, any>, never>'

This error occurs because:
1. Schema doesn't define 'startsAt' and 'endsAt' fields
2. Schema defines 'type' and 'value' instead of 'discountPercentage'
3. Tests try to access non-existent fields → compilation fails
```

---

## Green Phase Behavior

When tests are run **after all fixes** are applied:
```
PASS  src/lib/validations/__tests__/admin.discount.test.ts
✓ 100+ tests passed
```

All tests will pass because:
1. `createDiscountSchema` has all expected fields
2. `updateDiscountSchema` has all expected fields as optional
3. Validation rules match test expectations
4. Types infer correctly

---

## Files Covered by Tests

The test file validates behavior across:
- **Validation Schemas:** `src/lib/validations/admin.ts`
  - `createDiscountSchema`
  - `updateDiscountSchema`
  - `CreateDiscountInput` type
  - `UpdateDiscountInput` type

**NOT directly tested but required by validation:**
- `src/lib/db/merchant-schema.ts` (schema must have the fields)
- `src/lib/types/discount.ts` (types must align with schema)

---

## Test Execution Command

```bash
# Run discount validation tests (will fail until fixes applied)
npm run test -- src/lib/validations/__tests__/admin.discount.test.ts

# Or run all validation tests
npm run test -- src/lib/validations/__tests__/

# Verify build succeeds after fixes
npm run build

# Verify type checking passes
npm run typecheck
```

---

## Success Criteria

✅ **Red Phase (Before Fix):**
- Tests fail with property not found errors
- Error messages indicate missing `startsAt`, `endsAt`, `discountPercentage` fields
- Approximately 100+ tests fail

✅ **Green Phase (After Fix):**
- All 100+ tests pass
- `npm run build` succeeds with 0 TypeScript errors
- `npm run typecheck` reports 0 errors
- All discount validation rules work as designed

---

## Notes

- Tests are already comprehensive and correct
- Tests define the source of truth for discount feature behavior
- No new tests need to be written; just fix the implementation to match test expectations
- The test file is the single source of truth for the discount feature API
