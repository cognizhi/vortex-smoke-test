# SPRINT-0055 Bugfix Plan

**Sprint Goal:** Fix three defects affecting admin session validation, booking metadata storage, and cancel route duplication.

**Sprint Type:** Bugfix

**Date:** 2026-07-11

---

## Overview

This bugfix sprint addresses three defects identified in the admin API and booking management system:

1. **Hardcoded session in branding reset endpoint** — Critical authentication bypass allowing any request to modify merchant branding
2. **Missing merchantNotes column in bookings table** — Incomplete feature with silent failure; admin API accepts but discards notes
3. **Duplicated cancel route logic** — Code maintenance burden with divergence risk between merchant-scoped and platform cancel endpoints

All three defects have been reproduced, root-caused, and have documented fix plans.

---

## Defects & Root Causes

### Defect 1: Hardcoded Session in Branding Reset Endpoint (HIGH SEVERITY)

**File:** `src/app/api/admin/branding/reset/route.ts` (lines 47-57)

**Root Cause Analysis:**

The PUT `/api/admin/branding/reset` endpoint implements session authentication via a stub function that returns hardcoded user and merchant IDs instead of retrieving the actual authenticated session. The function contains an explicit TODO comment acknowledging this incomplete implementation:

```typescript
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

**Reproduction Steps:**

1. Make a PUT request to `/api/admin/branding/reset` from any origin
2. Include JSON body: `{ fields: ["site_name"] }`
3. Observe: Request succeeds regardless of whether the client is authenticated
4. The hardcoded `merchant-123` is always used, not the actual merchant context

**Current Behavior:**

- Every request uses hardcoded user ID `'user-123'` and merchant ID `'merchant-123'`
- Request authentication is not validated against the actual session cookie/JWT
- Admin cannot reset their own merchant's branding (the hardcoded merchant may not match)
- Authorization check passes because `getSession()` always returns a role of `'admin'`, regardless of the actual request

**Why This Happened:**

The endpoint was partially implemented during development with a TODO comment indicating the need for proper session retrieval. The developer intended to implement this using JWT parsing or middleware, but the work was never completed before the code was merged.

**Impact Assessment:**

- **Severity:** HIGH — Authentication bypass
- **Security Risk:** Any unauthenticated client can reset branding for merchant-123
- **Functional Impact:** Admins cannot actually use the endpoint to reset their own merchant's branding because the hardcoded merchant ID is used instead
- **Scope:** Single endpoint, but affects public API functionality

**Fix Plan (VRTX-0292):**

1. Replace the hardcoded `getSession()` stub with proper session retrieval
2. Use the existing `requireAdminAuth` middleware pattern (see `src/lib/auth/admin-guard.ts`) to extract the authenticated session from the request
3. The middleware will:
   - Parse the JWT from the `admin_session` cookie
   - Extract the `merchantId` and `userId` from the JWT payload
   - Validate that the token is still valid
4. Remove the hardcoded values and use the actual merchant/user IDs from the authenticated session
5. The endpoint will then allow each admin to reset their own merchant's branding

**Acceptance Criteria:**

- Session is retrieved from JWT cookie, not hardcoded
- Endpoint returns 401 if no valid session is present
- Endpoint returns 403 if user is not an admin
- Authenticated admin can reset their own merchant's branding
- Endpoint rejects requests from unauthenticated clients
- All existing tests pass

---

### Defect 2: Missing merchantNotes Column in Bookings Table (MEDIUM SEVERITY)

**Files:**
- `src/app/api/admin/bookings/[id]/route.ts` (line 90, PATCH handler)
- `src/lib/validations/booking.ts` (validation schema)
- `src/lib/db/merchant-schema.ts` (bookings table definition — missing column)
- `src/lib/db/provision-merchant.ts` (DDL for new merchants — missing column)

**Root Cause Analysis:**

The feature was partially implemented across multiple files:

1. **Validation layer** — `src/lib/validations/booking.ts` includes a schema that accepts an optional `merchantNotes` field with a 1000-character limit
2. **API handler** — `src/app/api/admin/bookings/[id]/route.ts` PATCH method extracts `merchantNotes` from the request body
3. **Database schema** — The bookings table in `src/lib/db/merchant-schema.ts` does NOT have a `merchantNotes` column
4. **DDL for new merchants** — `src/lib/db/provision-merchant.ts` DDL creation also omits the column

**Current Behavior:**

The PATCH handler currently has this code (lines 87-90):

```typescript
// Apply patch (currently only merchantNotes is patchable)
// The schema doesn't have a merchantNotes column yet; this is a no-op that
// returns the booking as-is and documents the extension point.
// TODO: add merchantNotes column in a schema migration.
```

- Admin sends: `PATCH /api/admin/bookings/123 { merchantNotes: "Payment pending" }`
- API accepts the request (validation passes)
- API does NOT store the notes in the database (no column exists)
- API returns the booking unchanged, making it appear the update succeeded
- Admin sees no error and believes the notes were saved

**Why This Happened:**

The feature was started (schema validation added, handler updated) but incomplete. The database schema migration was never created or applied. This is a partial implementation that was committed without the final piece (the schema change).

**Impact Assessment:**

- **Severity:** MEDIUM — Incomplete feature with silent failure
- **User Experience:** Admins see the API accepts their input but the data is silently discarded
- **Data Loss Risk:** No data loss (nothing was attempted to be stored), but admin intent is not captured
- **Scope:** Single feature affecting admin bookings API

**Reproduction Steps:**

1. Call `PATCH /api/admin/bookings/<id>` with `{ merchantNotes: "Test note" }`
2. Observe: Response is 200 OK with the booking object (unchanged)
3. Call `GET /api/admin/bookings/<id>` to verify the note was stored
4. Verify: The booking does not have a `merchantNotes` field (or it's undefined/null)

**Fix Plan (VRTX-0293):**

1. Add `merchantNotes` column to the bookings table:
   - Type: TEXT (or VARCHAR(1000))
   - Nullable: YES
   - Default: NULL
   - In `src/lib/db/merchant-schema.ts`

2. Create a Drizzle migration file to add the column to existing merchant databases:
   - File: `src/lib/db/migrations/add_merchant_notes_to_bookings.ts`
   - Use SQL ALTER TABLE to add the column to each merchant schema

3. Update the PATCH handler in `src/app/api/admin/bookings/[id]/route.ts` to:
   - Extract `merchantNotes` from the parsed request body (if present)
   - Include it in the update query
   - Return the updated booking with the notes field populated

4. Update the DDL in `src/lib/db/provision-merchant.ts` for new merchants to include the `merchantNotes` column in the CREATE TABLE statement

5. Add tests to verify the API stores and retrieves merchant notes

**Acceptance Criteria:**

- `merchantNotes` column exists in the bookings table (new and existing merchants)
- PATCH endpoint successfully stores merchant notes in the database
- GET endpoint returns the stored merchant notes
- Validation limits notes to 1000 characters
- Null/undefined notes are handled correctly
- All existing tests pass

---

### Defect 3: Duplicated Cancel Route Logic (LOW-MEDIUM SEVERITY)

**Files:**
- `src/app/site/[slug]/api/cancel/[token]/route.ts` (merchant-scoped endpoint)
- `src/app/api/cancel/[token]/route.ts` (platform-level endpoint)

**Root Cause Analysis:**

Two nearly identical cancel booking endpoints exist:

1. **Merchant-scoped:** `GET/POST /site/[slug]/api/cancel/[token]`
   - Handles cancellations for bookings scoped to a specific merchant
   - The middleware rewrites requests from `{slug}.platform.com/api/cancel/{token}` to this route
   - Located at: `src/app/site/[slug]/api/cancel/[token]/route.ts`

2. **Platform-level:** `GET/POST /api/cancel/[token]`
   - Handles cancellations at the platform level
   - Located at: `src/app/api/cancel/[token]/route.ts`

The two routes implement nearly identical business logic:
- Token verification
- Booking lookup
- Cancellation logic
- Email dispatch (cancellation notification to customer and alert to merchant)

**Current State:**

The merchant-scoped route (`src/app/site/[slug]/api/cancel/[token]/route.ts`) has an explicit TODO comment on line 12-13:

```typescript
/**
 * TODO: Consolidate this route with /api/cancel/[token]/route.ts to avoid
 * the duplication. See: src/app/api/cancel/[token]/route.ts
 */
```

**Why This Happened:**

During the multi-tenancy refactor, the merchant-scoped cancel endpoint was added to handle cancellations from the public booking page (which is branded per-merchant). The platform-level endpoint also handles cancellations. Rather than consolidating the logic at the time, both endpoints were implemented separately.

**Impact Assessment:**

- **Severity:** LOW-MEDIUM — Code maintenance burden
- **Risk:** Logic divergence between endpoints could lead to inconsistent behavior
- **Scope:** Both cancel endpoints; affects customer booking cancellation flow
- **Maintenance Cost:** Bug fixes must be applied to both locations
- **Example Risk:** If email dispatch changes in one endpoint but not the other, merchants and customers get different notifications

**Current Behavior:**

Both endpoints:
1. Look up the merchant by slug (merchant-scoped) or token context (platform)
2. Query the bookings table for the token
3. Update booking status to 'cancelled'
4. Send email notifications via `sendCancellationToCustomer()` and `sendCancellationAlertToMerchant()`
5. Return success or error responses

The implementations are nearly identical, with the main difference being how the merchant context is resolved.

**Fix Plan (VRTX-0294):**

1. **Extract common logic into a shared utility function:**
   - File: `src/lib/booking/cancel-booking.ts`
   - Function: `async function cancelBooking(booking, schema, db, merchantInfo, reason?): Promise<{ success: boolean; error?: string }>`
   - This function will encapsulate:
     - Booking status update
     - Email dispatch logic
     - Response structure

2. **Update the merchant-scoped endpoint** (`src/app/site/[slug]/api/cancel/[token]/route.ts`):
   - Keep the merchant resolution logic (via slug + schema lookup)
   - Call the shared `cancelBooking()` function
   - Return the result

3. **Update the platform-level endpoint** (`src/app/api/cancel/[token]/route.ts`):
   - Keep the platform-level merchant resolution logic
   - Call the shared `cancelBooking()` function
   - Return the result

4. **Benefits:**
   - Single source of truth for cancellation business logic
   - Bug fixes apply automatically to both endpoints
   - Email dispatch logic is guaranteed to be consistent
   - Easier to test the business logic in isolation

5. **Backward compatibility:**
   - No changes to endpoint signatures or response formats
   - No changes to merchant or customer-facing behavior
   - Existing clients and integrations unaffected

**Acceptance Criteria:**

- Shared `cancelBooking()` utility function exists and is tested
- Both endpoints use the shared function
- Email notifications are sent consistently from both endpoints
- Booking status is updated consistently
- All existing tests pass
- Response format and HTTP status codes unchanged

---

## Fix Execution Order

**Recommended order** (based on dependencies and risk):

1. **VRTX-0293 (merchantNotes column)** — First
   - No dependencies on other fixes
   - Database schema change; apply migration early so other work can test against it
   - Risk: LOW (column addition only, no logic changes yet)

2. **VRTX-0294 (consolidate cancel routes)** — Second
   - No dependencies on other fixes
   - Refactoring; no changes to endpoint behavior
   - Can be tested independently

3. **VRTX-0292 (hardcoded session)** — Third
   - No dependencies on other fixes
   - Authentication fix; do last to ensure test setup doesn't accidentally depend on hardcoded values
   - Risk: HIGH (security fix)

---

## Test Strategy

Each defect fix includes:
- Unit tests for the updated function/handler
- Integration tests verifying the endpoint behavior
- No regression tests required (existing tests should all pass)

---

## Documentation Updates

**Root docs to update** (if observable behavior changes):

- **PRODUCT.md** — If admin branding reset behavior changes
- **ARCHITECTURE.md** — If schema changes (merchantNotes column) affect the booking entity design
- **DESIGN.md** — If admin UI changes
- **AGENT.md** — Only if code patterns or conventions change

---

## Success Criteria (Sprint-level)

- ✅ All three defects have documented RCAs and fix plans
- ✅ One DEFECT ticket exists per fix (VRTX-0292, VRTX-0293, VRTX-0294)
- ✅ Per-ticket PLAN.md files created in `artifacts/SPRINT-0055/{TICKET-KEY}/`
- ✅ All tickets have acceptance criteria with Definition-of-Done items
- ✅ Dependencies are chained where appropriate (none required in this sprint)
- ✅ Root docs updated with observable behavior changes (if any)
- ✅ All work committed on the ticket branch

---

## Related Documentation

- **CLAUDE.md** — Multi-tenancy architecture, schema patterns
- **PRODUCT.md** — Branding, bookings, admin features
- **ARCHITECTURE.md** — Database schema, authentication
- **DESIGN.md** — Admin UI patterns
- **Prior bugfix sprints** — SPRINT-0052 (similar patterns)

---

## Known Constraints

1. **Multi-tenancy:** Per-tenant schema means migrations must handle both shared platform DB and individual merchant schemas
2. **Session management:** Auth tokens are JWT-based; session retrieval must validate token expiry and signature
3. **Email dispatch:** Dependent on SendGrid env vars; tests must work without credentials
4. **Cancel token security:** HMAC-based; validation must not change for backward compatibility

---

## Summary

SPRINT-0055 consolidates three identified defects into a single, focused bugfix sprint. Each defect has been reproduced, its root cause identified, and a clear fix plan documented. The fixes are independent and can be executed in parallel if resources allow, though a recommended serial order is provided to manage risk and dependencies.
