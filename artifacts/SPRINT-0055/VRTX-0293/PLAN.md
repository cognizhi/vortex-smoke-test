# VRTX-0293: Add merchantNotes Column to Bookings Table

**Ticket:** VRTX-0293  
**Type:** DEFECT  
**Priority:** P1 (High)  
**Sprint:** SPRINT-0055  
**Related:** `artifacts/SPRINT-0055/SPRINT-PLAN.md` (Section: Defect 2)

---

## Problem Summary

The `merchantNotes` feature was partially implemented: the validation schema accepts the field, the API handler extracts it from the request, but the database table does NOT have a `merchantNotes` column. This results in a **silent failure** where the API appears to accept and store notes, but they are never persisted.

---

## Root Cause

The feature was started but not completed:

1. **Validation schema** (`src/lib/validations/booking.ts`) — Already includes `merchantNotes: z.string().max(1000).optional()`
2. **API handler** (`src/app/api/admin/bookings/[id]/route.ts`) — Already extracts `merchantNotes` from request body
3. **Database schema** (`src/lib/db/merchant-schema.ts`) — Does NOT have `merchantNotes` column in bookings table
4. **DDL for new merchants** (`src/lib/db/provision-merchant.ts`) — Does NOT create the column for new merchants

**Current handler code** (line 87-90):

```typescript
// Apply patch (currently only merchantNotes is patchable)
// The schema doesn't have a merchantNotes column yet; this is a no-op that
// returns the booking as-is and documents the extension point.
// TODO: add merchantNotes column in a schema migration.
```

**Why it happened:** The feature was started (validation + handler updated) but the database schema migration was never created or applied. The work was partial when merged.

---

## Impact

### User-Facing Impact (MEDIUM)
- **Silent Failure:** Admin sends PATCH with `merchantNotes: "Payment pending"`, gets 200 OK, but notes are never saved
- **Poor UX:** Admin believes the notes were saved but they're lost on next page load
- **Feature Non-functional:** The `merchantNotes` field appears to be implemented but is completely non-functional

### Technical Impact
- **Inconsistent Schema:** Validation layer accepts the field but storage layer can't persist it
- **Maintenance Burden:** Developers must remember to update the schema when the feature is completed
- **Testing Gap:** Tests cannot verify note storage because the column doesn't exist

---

## Reproduction

**Steps:**

1. Start the application: `npm run dev`
2. Create a booking or get an existing booking ID
3. Make a PATCH request to update merchant notes:
   ```bash
   curl -X PATCH http://localhost:3000/api/admin/bookings/123 \
     -H "Content-Type: application/json" \
     -H "Cookie: admin_session=..." \
     -d '{"merchantNotes": "Payment pending - call customer Tuesday"}'
   ```
4. **Expected (correct):** 200 OK with booking object including `merchantNotes: "Payment pending - call customer Tuesday"`
5. **Actual (buggy):** 200 OK with booking object, but no `merchantNotes` field (or undefined/null)

**Verification:**

```bash
# Fetch the same booking again
curl http://localhost:3000/api/admin/bookings/123 \
  -H "Cookie: admin_session=..."

# Expected: notes persisted
# Actual: notes are not present because column doesn't exist
```

---

## Technical Details

### Current Database Schema

File: `src/lib/db/merchant-schema.ts`

Bookings table (current, INCOMPLETE):

```typescript
bookings: pgTable('bookings', {
  id: uuid('id').primaryKey(),
  customerId: uuid('customer_id').notNull(),
  staffId: uuid('staff_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  status: text('status').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  confirmationNumber: text('confirmation_number'),
  cancelToken: text('cancel_token'),
  // MISSING: merchantNotes column
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}),
```

### What's Missing

In `src/lib/db/merchant-schema.ts`, the bookings table needs:

```typescript
merchantNotes: text('merchant_notes').default(null), // or VARCHAR(1000)
```

In `src/lib/db/provision-merchant.ts`, the DDL CREATE TABLE needs:

```sql
ALTER TABLE {schema}.bookings ADD COLUMN merchant_notes TEXT DEFAULT NULL;
```

---

## Solution

### Phase 1: Schema Update

**File:** `src/lib/db/merchant-schema.ts`

Add the column to the bookings table definition:

```typescript
bookings: pgTable('bookings', {
  id: uuid('id').primaryKey(),
  customerId: uuid('customer_id').notNull(),
  staffId: uuid('staff_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  status: text('status').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  confirmationNumber: text('confirmation_number'),
  cancelToken: text('cancel_token'),
  // ADD THIS:
  merchantNotes: text('merchant_notes'), // nullable, optional notes
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}),
```

### Phase 2: Migration for Existing Merchants

**File:** `src/lib/db/migrations/add_merchant_notes_to_bookings.ts`

Create a Drizzle migration to add the column to all existing merchant schemas:

```typescript
import { sql } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';

export async function up(db: PgDatabase) {
  // This migration runs against each tenant's schema
  // The column is added as nullable with no default
  await db.execute(sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS merchant_notes TEXT DEFAULT NULL
  `);
}

export async function down(db: PgDatabase) {
  await db.execute(sql`
    ALTER TABLE bookings DROP COLUMN IF EXISTS merchant_notes
  `);
}
```

### Phase 3: Update Handler to Store Notes

**File:** `src/app/api/admin/bookings/[id]/route.ts`

Update the PATCH handler to actually store the notes:

```typescript
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const ctx = await requireAdminAuth(request);
  if (!ctx.ok) return ctx.response;

  const { db, schema } = ctx;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }

  const parsed = patchBookingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_INPUT', parsed.error.errors[0]?.message ?? 'Validation failed', 400);
  }

  // Verify booking exists
  const existing = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  if (existing.length === 0) {
    return apiError('NOT_FOUND', 'Booking not found.', 404);
  }

  // NEW: Build update data from parsed input
  const updateData: Record<string, any> = {};
  if ('merchantNotes' in parsed.data && parsed.data.merchantNotes !== undefined) {
    updateData.merchantNotes = parsed.data.merchantNotes;
  }

  // NEW: Only update if there's data to update
  if (Object.keys(updateData).length > 0) {
    await db
      .update(schema.bookings)
      .set(updateData)
      .where(eq(schema.bookings.id, id));
  }

  // Fetch and return updated booking
  const rows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id));

  return apiSuccess({ booking: rows[0] });
}
```

### Phase 4: Update Provision Script

**File:** `src/lib/db/provision-merchant.ts`

Update the DDL for new merchants to include the column:

```sql
CREATE TABLE {schema}.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES {schema}.customers(id),
  staff_id UUID NOT NULL REFERENCES {schema}.staff(id),
  service_id UUID NOT NULL REFERENCES {schema}.services(id),
  status TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  confirmation_number TEXT,
  cancel_token TEXT,
  merchant_notes TEXT,  -- ADD THIS LINE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Acceptance Criteria

- ✅ `merchantNotes` column added to bookings table schema (`src/lib/db/merchant-schema.ts`)
- ✅ Drizzle migration created to add column to existing merchant databases
- ✅ PATCH `/api/admin/bookings/[id]` endpoint stores `merchantNotes` in database
- ✅ GET `/api/admin/bookings/[id]` endpoint returns stored `merchantNotes`
- ✅ Validation continues to limit notes to 1000 characters
- ✅ Null/undefined notes handled correctly (no storage if not provided)
- ✅ DDL for new merchants includes `merchantNotes` column
- ✅ Migration is applied to CI/test databases
- ✅ All existing tests pass without regression
- ✅ New tests verify note storage and retrieval

---

## Testing Strategy

### Unit Tests

Test file: `src/app/api/admin/bookings/[id]/__tests__/route.test.ts`

**New test cases:**

1. **PATCH with merchantNotes stores the value**
   - Setup: Valid booking, authenticated admin
   - Request: PATCH with `{ merchantNotes: "Customer called at 2pm" }`
   - Expected: 200 OK, booking returned with merchantNotes field

2. **GET returns stored merchantNotes**
   - Setup: Booking with previously stored merchantNotes
   - Request: GET /api/admin/bookings/[id]
   - Expected: 200 OK, booking object includes merchantNotes field

3. **PATCH with empty notes clears them**
   - Setup: Booking with existing merchantNotes
   - Request: PATCH with `{ merchantNotes: null }` or `{ merchantNotes: "" }`
   - Expected: 200 OK, merchantNotes cleared

4. **PATCH without notes doesn't change stored notes**
   - Setup: Booking with existing merchantNotes
   - Request: PATCH with `{ }` (no merchantNotes field)
   - Expected: 200 OK, merchantNotes unchanged

5. **Validation rejects notes > 1000 characters**
   - Setup: Valid booking, authenticated admin
   - Request: PATCH with notes of 1001 characters
   - Expected: 400 Bad Request, validation error

### Integration Tests

1. **Migration applies to test database**
   - Setup: Run migration against test database
   - Expected: Column exists and is queryable
   - Verify: `SELECT merchant_notes FROM bookings` works

2. **New tenants have the column**
   - Setup: Provision a new merchant tenant
   - Expected: Bookings table includes merchant_notes column
   - Verify: Insert and select works correctly

---

## Definition of Done

- [x] Root cause identified and documented
- [ ] Schema updated in `merchant-schema.ts`
- [ ] Migration file created
- [ ] PATCH handler updated to store notes
- [ ] DDL for new merchants updated
- [ ] Migration applied to test databases
- [ ] Unit tests added/updated and passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] All npm scripts pass (typecheck, lint, test)
- [ ] Code review approved
- [ ] Merged into SPRINT-0055 branch

---

## Files Modified

- `src/lib/db/merchant-schema.ts` (add merchantNotes column)
- `src/lib/db/migrations/add_merchant_notes_to_bookings.ts` (NEW)
- `src/app/api/admin/bookings/[id]/route.ts` (update PATCH handler)
- `src/lib/db/provision-merchant.ts` (update DDL for new merchants)
- `src/app/api/admin/bookings/[id]/__tests__/route.test.ts` (add/update tests)

---

## Rollback Plan

If issues arise:

1. Remove the merchantNotes column from merchant-schema.ts
2. The API will continue to accept the field (validation still passes) but won't store it
3. If migration has been applied to production, run the down() migration to drop the column
4. No data loss (column was just added, no critical data on it)

---

## Migration Execution

**For existing merchants:**

```bash
npm run db:migrate
```

This will apply the migration to the connected DATABASE_URL (the shared platform database where merchant schemas live).

**For new merchants:**

When `provisionMerchant()` is called for a new signup, the updated DDL in `provision-merchant.ts` will create the column automatically.

---

## Documentation Updates

**ARCHITECTURE.md:** Update the bookings table schema documentation to include the new column.

---

## Estimated Effort

- **Schema Update:** 15 minutes
- **Migration Creation:** 20 minutes
- **Handler Update:** 15 minutes
- **DDL Update:** 10 minutes
- **Testing:** 60 minutes (write tests, run migrations, verify)
- **Review/Refinement:** 20 minutes
- **Total:** ~2.5 hours

---

## Related Issues

- Feature was partially implemented and committed
- Part of a larger bookings API enhancement
- Related to admin dashboard features

---

## Success Metrics

1. Merchants notes column exists in database
2. PATCH endpoint stores notes successfully
3. GET endpoint retrieves stored notes
4. Validation limits to 1000 characters
5. No data loss during migration
6. All tests pass
7. New tenants automatically get the column
