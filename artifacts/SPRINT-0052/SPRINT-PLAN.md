# SPRINT-0052 Bugfix Plan

**Sprint Goal:** Fix three defects affecting branding reset authentication, booking note storage, and cancel route duplication.

**Sprint Type:** Bugfix

**Date:** 2026-07-10

---

## Overview

This bugfix sprint addresses three defects identified in the current codebase:

1. **Hardcoded session in branding reset endpoint** — Critical authentication bypass
2. **Missing merchantNotes column in bookings table** — Incomplete feature with silent failure
3. **Duplicated cancel route logic** — Code maintenance burden and divergence risk

All three defects have root causes identified and fix plans documented. This sprint consolidates and prioritizes these fixes.

---

## Defects & Root Causes

### Defect 1: Hardcoded Session in Branding Reset Endpoint (HIGH SEVERITY)

**File:** `src/app/api/admin/branding/reset/route.ts` (lines 47-57)

**Root Cause:**
The branding reset endpoint has a stub `getSession()` function that returns hardcoded user and merchant IDs (`"user-123"` and `"merchant-123"`) instead of retrieving the actual session from the incoming request. The function contains a TODO comment acknowledging this incomplete implementation.

**Current Behavior:**
```typescript
function getSession() {
  // TODO: Implement proper session retrieval
  return {
    userId: "user-123",
    merchantId: "merchant-123"
  };
}
```

**Impact:**
- Any request to `PUT /api/admin/branding/reset` uses the hardcoded merchant and user ID
- Actual authenticated user identity is ignored
- Admin cannot reset their own merchant's branding
- Security risk: endpoint does not validate the requesting user

**Why This Happened:**
The endpoint was partially implemented during development but never completed. The developer added a TODO comment but the implementation was never finished before the code was merged.

**Fix Plan (VRTX-XXXX-1):**
Replace hardcoded session with proper authentication using `requireAdminAuth` middleware or direct JWT parsing from cookies, similar to other admin routes in `src/lib/auth/admin-guard.ts`. Validate that the requesting user owns the merchant before allowing the reset.

---

### Defect 2: Missing merchantNotes Column in Bookings Table (MEDIUM SEVERITY)

**Files:**
- `src/app/api/admin/bookings/[id]/route.ts` (line 90, PATCH handler)
- `src/lib/validations/booking.ts` (line 72, validation schema)
- `src/lib/db/merchant-schema.ts` (bookings table definition — missing merchantNotes column)

**Root Cause:**
The feature was partially implemented:
- The validation schema accepts an optional `merchantNotes` field (max 1000 characters)
- The PATCH endpoint handler extracts the `merchantNotes` from the request body
- However, the booking table schema does NOT have a `merchantNotes` column
- The handler currently returns the booking unchanged (no-op) with a TODO comment

**Current Behavior:**
```typescript
// In validation schema:
merchantNotes: z.string().max(1000).optional(),

// In PATCH handler (line 90):
// TODO: add merchantNotes column in a schema migration
// Currently this field is accepted but not stored
```

**Impact:**
- Admin API endpoint silently discards `merchantNotes` from requests
- Admins see that the API accepts the field but their notes are never saved
- No error is raised; the silent failure makes this a "works but doesn't" bug
- Feature appears to be implemented but is non-functional

**Why This Happened:**
The feature was started (schema validation added, handler updated) but the database schema migration was never created or applied. The table definition was not updated to include the new column.

**Fix Plan (VRTX-XXXX-2):**
1. Update `src/lib/db/merchant-schema.ts` to add `merchantNotes` column to the bookings table
2. Create a Drizzle migration file to add the column to existing merchant schemas
3. Update the PATCH handler to actually store the notes in the database
4. Update per-merchant schema DDL in `src/lib/db/provision-merchant.ts` to include the column for new merchants

---

### Defect 3: Duplicated Cancel Route Logic (LOW-MEDIUM SEVERITY)

**Files:**
- `src/app/api/cancel/[token]/route.ts` (284 lines)
- `src/app/site/[slug]/api/cancel/[token]/route.ts` (217 lines)

**Root Cause:**
Two separate implementations of the booking cancellation endpoint exist:
1. A global endpoint at `/api/cancel/[token]` (no tenant context in URL)
2. A tenant-scoped endpoint at `/site/[slug]/api/cancel/[token]` (explicit tenant slug)

Both endpoints implement similar logic:
- Token validation and parsing
- Booking lookup and ownership verification
- Cancellation state updates
- Email dispatch (SendGrid)
- Response formatting

The merchant-scoped route contains a TODO comment stating: "Consolidate this route with `/api/cancel/[token]/route.ts` to avoid duplication."

**Current Behavior:**
```typescript
// /api/cancel/[token]/route.ts — 284 lines of logic
export async function POST(request: Request, { params }: { params: { token: string } }) { ... }

// /site/[slug]/api/cancel/[token]/route.ts — 217 lines of similar logic
export async function POST(request: Request, { params }: { params: { slug: string; token: string } } }) { ... }
```

**Impact:**
- Code maintenance burden: any bug fix must be applied in two places
- Risk of divergence: changes to one endpoint may not propagate to the other
- Both endpoints comment that "Both routes must stay in sync"
- Increased test maintenance (same logic tested twice)
- Increased likelihood of bugs creeping in due to inconsistent updates

**Why This Happened:**
The endpoints evolved during development with different tenant resolution strategies (global lookup vs. explicit slug). Instead of consolidating into a shared handler, both were kept as-is for backward compatibility or incremental refactoring.

**Fix Plan (VRTX-XXXX-3):**
1. Extract common cancellation logic into a shared `lib/booking/cancel-booking.ts` module
2. Update both route handlers to call the shared module
3. Keep both endpoints for backward compatibility but eliminate code duplication
4. Ensure both endpoints continue to pass their existing tests

---

## Tickets & Dependencies

This sprint creates three DEFECT tickets, one per identified defect:

1. **VRTX-XXXX-1** — Fix hardcoded session in branding reset (HIGH priority, no dependencies)
2. **VRTX-XXXX-2** — Add merchantNotes column to bookings (MEDIUM priority, no dependencies)
3. **VRTX-XXXX-3** — Consolidate duplicated cancel routes (LOW priority, no dependencies)

Each ticket includes:
- Detailed root cause analysis
- Step-by-step fix plan
- Test strategy
- Acceptance criteria
- Per-ticket artifacts at `artifacts/SPRINT-0052/<TICKET-KEY>/PLAN.md`

**Dependency Chain:**
- VRTX-XXXX-2 (merchantNotes) depends on VRTX-XXXX-1 (hardcoded session) — both touch admin auth patterns
  - Actually, these are independent; no dependency needed
- All three tickets can be worked in parallel

---

## Fix Prioritization

1. **VRTX-XXXX-1 (Branding Reset)** — Priority: P0 (Critical)
   - Blocks actual use of branding reset feature
   - Security issue: authentication bypass
   - Fast fix (1-2 hours)

2. **VRTX-XXXX-2 (merchantNotes)** — Priority: P1 (High)
   - Incomplete feature with silent failure
   - Admin UX issue: looks like it works but doesn't
   - Medium complexity (2-3 hours, includes migration)

3. **VRTX-XXXX-3 (Cancel Route Duplication)** — Priority: P2 (Medium)
   - Code quality / technical debt
   - Affects maintainability, not user-facing functionality
   - Medium complexity (2-3 hours, refactoring + test updates)

---

## Acceptance Criteria

All three defects must be:
1. ✅ Root cause verified and documented
2. ✅ Fix implemented and tested
3. ✅ Regression tests ensure the fix works
4. ✅ Related endpoints tested and working
5. ✅ Build passes (lint, typecheck, test, build)
6. ✅ Documentation updated if behavior changes

---

## Success Metrics

- [x] All defects identified and root-caused
- [x] Fix plans documented per defect
- [ ] VRTX-XXXX-1 implemented and passing tests
- [ ] VRTX-XXXX-2 implemented and passing tests
- [ ] VRTX-XXXX-3 implemented and passing tests
- [ ] All three tickets marked DONE
- [ ] Build clean with all tests passing

---

## Timeline & Effort Estimate

| Defect | Est. Hours | Priority | Status |
|--------|-----------|----------|--------|
| VRTX-XXXX-1 (Branding Reset) | 1.5 | P0 | Planned |
| VRTX-XXXX-2 (merchantNotes) | 2.5 | P1 | Planned |
| VRTX-XXXX-3 (Cancel Routes) | 2.5 | P2 | Planned |
| **Total** | **~6.5 hours** | - | - |

---

## References

- **Branding Reset Code:** `src/app/api/admin/branding/reset/route.ts`
- **Booking API:** `src/app/api/admin/bookings/[id]/route.ts`
- **Cancel Routes:** `src/app/api/cancel/[token]/route.ts` and `src/app/site/[slug]/api/cancel/[token]/route.ts`
- **Admin Auth Guard:** `src/lib/auth/admin-guard.ts`
- **Merchant Schema:** `src/lib/db/merchant-schema.ts`
- **Booking Validation:** `src/lib/validations/booking.ts`

---

## Checklist

- [x] Root causes identified for all defects
- [x] Impact and severity assessed
- [x] Fix plans documented per defect
- [ ] DEFECT tickets created (VRTX-XXXX-1, VRTX-XXXX-2, VRTX-XXXX-3)
- [ ] Per-ticket PLAN.md files committed
- [ ] All fixes implemented and tested
- [ ] Build and tests passing
- [ ] Changes committed on ticket branch
- [ ] Branch pushed to remote
