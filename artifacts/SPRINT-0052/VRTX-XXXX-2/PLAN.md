# PLAN: Add merchantNotes Column to Bookings Table

**Ticket:** VRTX-XXXX-2 (To be created as DEFECT ticket during execution phase)

**Sprint:** SPRINT-0052

**Severity:** MEDIUM (Incomplete feature with silent failure)

**Date:** 2026-07-10

---

## Problem Statement

The booking PATCH endpoint (`PUT /api/admin/bookings/[id]`) accepts a `merchantNotes` field in request validation, but the underlying database table does NOT have this column. Requests including `merchantNotes` are silently discarded with no error, making this a silent failure bug.

**Affected Files:**
- `src/lib/validations/booking.ts` (line 72) — accepts `merchantNotes` in validation
- `src/app/api/admin/bookings/[id]/route.ts` (line 90) — handler extracts but doesn't store
- `src/lib/db/merchant-schema.ts` — missing column definition

---

## Current Code

**Validation Schema (accepts the field):**
```typescript
// src/lib/validations/booking.ts:72
merchantNotes: z.string().max(1000).optional(),
```

**Handler (extracts but doesn't store):**
```typescript
// src/app/api/admin/bookings/[id]/route.ts:87-90
const body = bookingUpdateSchema.parse(await request.json());
const { merchantNotes, ...updateData } = body;

// TODO: add merchantNotes column in a schema migration
// Currently returns booking unchanged
return NextResponse.json(booking);
```

**Schema (column missing):**
```typescript
// src/lib/db/merchant-schema.ts - bookings table does NOT have merchantNotes
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey(),
  // ...other columns...
  // merchantNotes column is MISSING
});
```

---

## Root Cause

The feature was partially implemented:
1. Validation schema updated to accept `merchantNotes` field
2. Handler updated to extract the field from request body
3. BUT: Database schema was never updated with the column
4. Handler contains a TODO acknowledging this incompleteness

This is incomplete work that appears functional but silently fails.

---

## Impact Assessment

**User Impact:**
- Admins see the API accepts `merchantNotes` field
- Attempts to save notes fail silently
- No error message indicates the notes weren't stored
- Notes disappear when the booking is fetched again

**Data Impact:**
- `merchantNotes` data in requests is lost
- No audit trail of attempted note creation
- Admins will be confused why notes don't persist

**System Impact:**
- Feature appears implemented but is non-functional
- Silent failure makes debugging difficult
- Increases support burden (users report "feature doesn't work")

---

## Fix Strategy

### Phase 1: Update Database Schema

**Step 1a: Update Drizzle Table Definition**

In `src/lib/db/merchant-schema.ts`, add the `merchantNotes` column to the bookings table:

```typescript
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull(),
  // ...existing columns...
  
  // Add this new column:
  merchantNotes: text("merchant_notes").default(null),
  
  // ...rest of table definition...
});
```

**Column Specifications:**
- Name: `merchant_notes` (snake_case in DB, camelCase in TypeScript)
- Type: `text` (no length limit in PostgreSQL, but validation limits to 1000 chars)
- Nullable: Yes (default null)
- Not indexed (no performance requirement)

**Step 1b: Generate Drizzle Migration**

Run migration generation to create the DDL:

```bash
npm run db:generate
```

This creates a migration file in `drizzle/` that adds the column to existing merchant schemas.

**Step 1c: Create Manual Migration for New Merchants**

Update `src/lib/db/provision-merchant.ts` to include the column in the per-merchant schema DDL:

```typescript
// In createMerchantSchemaSQL(), add to CREATE TABLE bookings:
`
  CREATE TABLE IF NOT EXISTS ${schemaName}.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id uuid NOT NULL,
    -- ...existing columns...
    merchant_notes text,  -- Add this line
    -- ...rest of columns...
  );
`
```

### Phase 2: Update Handler Logic

**Step 2a: Update PATCH Handler**

In `src/app/api/admin/bookings/[id]/route.ts`, update the handler to store the notes:

```typescript
const body = bookingUpdateSchema.parse(await request.json());
const { merchantNotes, ...updateData } = body;

// Store notes if provided
if (merchantNotes !== undefined) {
  updateData.merchantNotes = merchantNotes;
}

// Update booking with all fields including notes
const updated = await db.update(bookings)
  .set(updateData)
  .where(eq(bookings.id, params.id))
  .returning();

return NextResponse.json(updated[0]);
```

**Step 2b: Remove TODO Comment**

Remove the TODO comment acknowledging the incomplete implementation.

### Phase 3: Update Tests

**Step 3a: Add Unit Tests**

Add tests to verify notes are stored and retrieved:

```typescript
describe("PATCH /api/admin/bookings/[id]", () => {
  it("stores merchantNotes when provided", async () => {
    const booking = await db.query.bookings.findFirst();
    
    const response = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      body: JSON.stringify({ merchantNotes: "Follow up next week" }),
      headers: { "Cookie": authCookie },
    });
    
    expect(response.status).toBe(200);
    const updated = await response.json();
    expect(updated.merchantNotes).toBe("Follow up next week");
  });
  
  it("clears merchantNotes when null provided", async () => {
    const booking = await db.query.bookings.findFirst();
    
    const response = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      body: JSON.stringify({ merchantNotes: null }),
      headers: { "Cookie": authCookie },
    });
    
    expect(response.status).toBe(200);
    const updated = await response.json();
    expect(updated.merchantNotes).toBeNull();
  });
  
  it("validates merchantNotes max length", async () => {
    const booking = await db.query.bookings.findFirst();
    const longNotes = "x".repeat(1001);
    
    const response = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      body: JSON.stringify({ merchantNotes: longNotes }),
      headers: { "Cookie": authCookie },
    });
    
    expect(response.status).toBe(400); // Validation error
  });
});
```

**Step 3b: Add Integration Test**

Test the full flow: create booking → add notes → fetch → verify notes are present

---

## Implementation Checklist

- [ ] Update `src/lib/db/merchant-schema.ts` to add `merchantNotes` column
- [ ] Run `npm run db:generate` to create migration
- [ ] Update `src/lib/db/provision-merchant.ts` DDL for new merchants
- [ ] Update PATCH handler in `src/app/api/admin/bookings/[id]/route.ts` to store notes
- [ ] Remove TODO comment from handler
- [ ] Add unit tests for note storage and retrieval
- [ ] Add validation tests for max length
- [ ] Add integration test for full flow
- [ ] Run migration on test database: `npm run db:migrate`
- [ ] Verify existing tests still pass
- [ ] Run full test suite: `npm run test`
- [ ] Verify TypeScript: `npm run typecheck`
- [ ] Verify linting: `npm run lint`
- [ ] Build successful: `npm run build`

---

## Test Cases

### Test 1: Store New Notes
**Given:** Booking without notes
**When:** PATCH with `merchantNotes: "Follow up next week"`
**Then:** Notes stored and returned in response

### Test 2: Update Existing Notes
**Given:** Booking with notes "Call customer"
**When:** PATCH with `merchantNotes: "Rescheduled to Tuesday"`
**Then:** Notes updated and old notes replaced

### Test 3: Clear Notes
**Given:** Booking with notes
**When:** PATCH with `merchantNotes: null`
**Then:** Notes cleared (set to null)

### Test 4: Omit Notes Field
**Given:** Booking with notes
**When:** PATCH without `merchantNotes` field in body
**Then:** Notes unchanged

### Test 5: Validation: Max Length
**Given:** String 1001 characters long
**When:** PATCH with `merchantNotes: "x".repeat(1001)`
**Then:** Returns 400 validation error

### Test 6: Retrieve Notes
**Given:** Booking with notes stored
**When:** GET `/api/admin/bookings/[id]`
**Then:** Response includes `merchantNotes` field

### Test 7: Migration Works
**Given:** Existing merchant schema without column
**When:** Run `npm run db:migrate`
**Then:** Column added to existing merchant_* schemas

### Test 8: Persistence
**Given:** Booking notes stored
**When:** Close DB connection and reopen
**Then:** Notes still present in database

---

## Success Criteria

✅ `merchantNotes` column added to bookings table  
✅ Drizzle migration generated and applied  
✅ Per-merchant DDL updated for new tenants  
✅ PATCH handler stores notes in database  
✅ PATCH handler retrieves and returns notes  
✅ Validation enforces 1000 char max  
✅ All new tests pass  
✅ Existing tests still pass  
✅ No TypeScript errors  
✅ ESLint clean (0 warnings)  
✅ Build successful  

---

## Effort Estimate

- Schema updates: 15 minutes
- Migration generation: 5 minutes
- Handler updates: 15 minutes
- Test writing: 45 minutes
- Testing/validation: 15 minutes
- **Total: ~2.5 hours**

---

## Dependencies

- None — can be implemented independently

---

## Related Code

**Similar patterns:**
- `src/lib/db/merchant-schema.ts` — other table definitions
- `src/lib/db/provision-merchant.ts` — DDL for new merchants
- `drizzle/` — migration examples
- `src/app/api/admin/bookings/[id]/route.ts` — handler to fix

**Files to modify:**
- `src/lib/db/merchant-schema.ts`
- `src/app/api/admin/bookings/[id]/route.ts`
- `src/lib/db/provision-merchant.ts`

**Migration file:**
- `drizzle/<timestamp>_add_merchant_notes_to_bookings.sql` (auto-generated)

---

## Notes

This defect is unusual because it appears to be working (the API accepts the field) but silently fails. This makes it particularly insidious — users won't notice immediately, but over time they'll realize notes don't persist. The fix is straightforward: complete the unfinished work by adding the database column and updating the handler.
