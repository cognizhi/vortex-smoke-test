# PLAN: Consolidate Duplicated Cancel Route Logic

**Ticket:** VRTX-XXXX-3 (To be created as DEFECT ticket during execution phase)

**Sprint:** SPRINT-0052

**Severity:** LOW-MEDIUM (Technical debt / Code maintenance)

**Date:** 2026-07-10

---

## Problem Statement

Two separate implementations of the booking cancellation endpoint exist, each with ~250+ lines of duplicated logic. Any bug fix or enhancement must be applied in two places, creating maintenance burden and risk of divergence.

**Affected Files:**
- `src/app/api/cancel/[token]/route.ts` (284 lines)
- `src/app/site/[slug]/api/cancel/[token]/route.ts` (217 lines)

**Root Cause Comment:**
The merchant-scoped route contains: "Consolidate this route with `/api/cancel/[token]/route.ts` to avoid duplication."

---

## Current Architecture

### Endpoint 1: Global Cancel Route
**URL:** `POST /api/cancel/[token]`
**Location:** `src/app/api/cancel/[token]/route.ts`

Logic flow:
1. Extract and parse cancel token from URL param
2. Verify token signature using CANCEL_TOKEN_SECRET
3. Lookup booking by booking ID from token payload
4. Verify booking exists and token not expired
5. Update booking status to "cancelled"
6. Send cancellation email to customer
7. Log cancellation event
8. Return cancellation confirmation

### Endpoint 2: Tenant-Scoped Cancel Route
**URL:** `POST /site/[slug]/api/cancel/[token]`
**Location:** `src/app/site/[slug]/api/cancel/[token]/route.ts`

Logic flow (nearly identical):
1. Extract slug and cancel token from URL params
2. Verify token signature using CANCEL_TOKEN_SECRET
3. Lookup booking by booking ID from token payload
4. Verify booking exists and token not expired
5. Update booking status to "cancelled"
6. Send cancellation email to customer
7. Log cancellation event
8. Return cancellation confirmation

### Key Difference

The only substantive difference:
- Global route: Uses global booking lookup (across all merchants)
- Tenant-scoped route: Uses tenant-specific database context (filtered by slug)

Both routes serve different purposes:
- Global: Used in transactional emails, SMS, and public links where merchant context may not be known
- Tenant-scoped: Used in merchant's public booking page where tenant slug is in URL

---

## Root Cause

During development, both endpoints evolved independently with different tenant resolution strategies:
1. Global endpoint was built first for transactional emails
2. Tenant-scoped endpoint added later for merchant's booking page
3. Instead of consolidating, both were kept to avoid breaking changes
4. Code duplication was accepted as technical debt

---

## Impact Assessment

**Current Problems:**
- **Maintenance burden:** Any cancellation logic change requires updating two files
- **Divergence risk:** Changes to one endpoint may not propagate to the other
- **Test duplication:** Same cancellation logic tested twice
- **Bug propagation:** A bug fix in one endpoint must be manually applied to the other
- **Cognitive load:** Developers must understand two implementations

**Example Scenario:**
If we discovered a bug in email sending during cancellation, we'd need to:
1. Fix it in `/api/cancel/[token]/route.ts`
2. Fix it again in `/site/[slug]/api/cancel/[token]/route.ts`
3. Update tests in both places

---

## Fix Strategy

### Step 1: Extract Common Logic into Shared Module

Create a new file: `src/lib/booking/cancel-booking.ts`

This module exports a single function that encapsulates all cancellation logic:

```typescript
// src/lib/booking/cancel-booking.ts

export interface CancellationResult {
  success: boolean;
  booking?: any; // Cancelled booking
  error?: string;
}

export async function cancelBooking(
  bookingId: string,
  tenantDb?: any // Optional tenant DB context
): Promise<CancellationResult> {
  try {
    // 1. Verify booking exists
    // 2. Verify booking can be cancelled (status check)
    // 3. Verify booking hasn't already been cancelled
    
    // 4. Get tenant context if not provided
    const db = tenantDb || (await getMerchantDb(booking.slug));
    
    // 5. Update booking status
    const cancelled = await db.update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();
    
    // 6. Send cancellation email
    await sendCancellationEmail(booking.customer, booking);
    
    // 7. Log event
    logCancellation(bookingId, booking.merchantId);
    
    return {
      success: true,
      booking: cancelled[0],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### Step 2: Update Global Cancel Route

Refactor `src/app/api/cancel/[token]/route.ts` to use the shared module:

**Before:** 284 lines of implementation
**After:** ~50 lines delegating to shared module

```typescript
import { cancelBooking } from "@/lib/booking/cancel-booking";
import * as jose from "jose";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // 1. Verify and parse token
    const secret = new TextEncoder().encode(env.CANCEL_TOKEN_SECRET);
    const verified = await jose.jwtVerify(params.token, secret);
    const { bookingId } = verified.payload as { bookingId: string };
    
    // 2. Use shared cancellation logic
    const result = await cancelBooking(bookingId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // 3. Return confirmation
    return NextResponse.json({
      ok: true,
      message: "Booking cancelled successfully",
      booking: result.booking,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }
}
```

### Step 3: Update Tenant-Scoped Cancel Route

Similarly refactor `src/app/site/[slug]/api/cancel/[token]/route.ts`:

**Before:** 217 lines of implementation
**After:** ~50 lines delegating to shared module

```typescript
import { cancelBooking } from "@/lib/booking/cancel-booking";
import { getMerchantDb } from "@/lib/db/get-merchant-db";
import * as jose from "jose";

export async function POST(
  request: Request,
  { params }: { params: { slug: string; token: string } }
) {
  try {
    // 1. Get tenant DB context
    const db = await getMerchantDb(params.slug);
    
    // 2. Verify and parse token
    const secret = new TextEncoder().encode(env.CANCEL_TOKEN_SECRET);
    const verified = await jose.jwtVerify(params.token, secret);
    const { bookingId } = verified.payload as { bookingId: string };
    
    // 3. Use shared cancellation logic with tenant context
    const result = await cancelBooking(bookingId, db);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // 4. Return confirmation
    return NextResponse.json({
      ok: true,
      message: "Booking cancelled successfully",
      booking: result.booking,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }
}
```

### Step 4: Update Tests

**Create:** `src/lib/booking/__tests__/cancel-booking.test.ts`

Test the shared cancellation logic:
- Booking successfully cancelled
- Email sent on cancellation
- Already-cancelled booking can't be cancelled again
- Non-existent booking handled gracefully

**Update:** Tests for both route handlers now focus on route-specific behavior (token parsing) rather than cancellation logic:
- Global route: Token validation
- Tenant route: Slug validation + token validation

---

## Implementation Checklist

- [ ] Create `src/lib/booking/cancel-booking.ts` with shared logic
- [ ] Add unit tests for `cancel-booking.ts`
- [ ] Refactor `/api/cancel/[token]/route.ts` to use shared module
- [ ] Refactor `/site/[slug]/api/cancel/[token]/route.ts` to use shared module
- [ ] Update tests for both routes to reflect new structure
- [ ] Verify both routes still work end-to-end
- [ ] Compare test coverage (should not decrease)
- [ ] Run full test suite: `npm run test`
- [ ] Verify TypeScript: `npm run typecheck`
- [ ] Verify linting: `npm run lint`
- [ ] Build successful: `npm run build`

---

## Test Cases

### Shared Module Tests (`cancel-booking.test.ts`)

#### Test 1: Successful Cancellation
**Given:** Valid booking in "confirmed" status
**When:** `cancelBooking(bookingId)` called
**Then:** Returns success, booking status changed to "cancelled", email sent

#### Test 2: Already Cancelled Booking
**Given:** Booking already in "cancelled" status
**When:** `cancelBooking(bookingId)` called
**Then:** Returns error (cannot cancel twice)

#### Test 3: Non-existent Booking
**Given:** Invalid booking ID
**When:** `cancelBooking(invalidId)` called
**Then:** Returns error "Booking not found"

#### Test 4: Email Sent on Cancellation
**Given:** Valid booking with customer email
**When:** `cancelBooking(bookingId)` called
**Then:** Email sent to customer, email includes cancellation details

#### Test 5: Event Logged
**Given:** Valid booking
**When:** `cancelBooking(bookingId)` called
**Then:** Cancellation event logged with booking ID and merchant ID

#### Test 6: Tenant Context Optional
**Given:** No tenant DB provided, booking from any merchant
**When:** `cancelBooking(bookingId)` called without db parameter
**Then:** Shared module resolves tenant and proceeds

### Route Handler Tests (Existing Patterns)

#### Global Route Tests
- Valid token results in cancellation
- Expired token returns 400
- Invalid signature returns 400
- Malformed token returns 400

#### Tenant Route Tests
- Valid token + valid slug results in cancellation
- Valid token + invalid slug returns 404
- Expired token returns 400
- Invalid signature returns 400

---

## Success Criteria

✅ Shared `cancel-booking.ts` module created  
✅ Both routes use shared module (code duplication eliminated)  
✅ All existing route tests still pass  
✅ New shared module tests pass  
✅ No regression in cancellation functionality  
✅ Global route still works for email-driven cancellations  
✅ Tenant route still works for page-driven cancellations  
✅ No TypeScript errors  
✅ ESLint clean (0 warnings)  
✅ Build successful  

---

## Backward Compatibility

✅ **Complete backward compatibility maintained**
- Both routes continue to work at same URLs
- Response format unchanged
- Token format unchanged
- Email behavior unchanged
- No API breaking changes

---

## Effort Estimate

- Extract shared logic: 30 minutes
- Refactor global route: 15 minutes
- Refactor tenant route: 15 minutes
- Update/consolidate tests: 30 minutes
- Testing/validation: 15 minutes
- **Total: ~2.5 hours**

---

## Dependencies

- None — can be implemented independently

---

## Code Quality Improvements

**Benefits of this refactoring:**
- ✅ Eliminates ~200+ lines of duplication
- ✅ Single source of truth for cancellation logic
- ✅ Easier to add new cancellation behavior (once per module, not twice per route)
- ✅ Reduced test maintenance
- ✅ Clearer separation of concerns (token parsing vs. business logic)
- ✅ Easier to reuse cancellation logic in other contexts (webhooks, admin cancel, etc.)

---

## Related Code

**Files to modify:**
- `src/app/api/cancel/[token]/route.ts`
- `src/app/site/[slug]/api/cancel/[token]/route.ts`

**File to create:**
- `src/lib/booking/cancel-booking.ts` (new)
- `src/lib/booking/__tests__/cancel-booking.test.ts` (new)

**Reference implementations:**
- `src/lib/booking/cancel-token.ts` (token generation)
- Other `src/lib/booking/` modules for pattern examples

---

## Notes

This is a pure refactoring with no functional changes. The consolidation improves code maintainability without affecting external behavior. Both endpoints will continue to work exactly as before, but with shared underlying logic.

The key insight is that the only difference between the endpoints is **how they resolve the tenant context**, not **what they do with the booking**. By extracting the "what they do" into a shared module, we eliminate duplication while maintaining flexibility.
