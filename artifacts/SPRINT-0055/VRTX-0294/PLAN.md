# VRTX-0294: Consolidate Duplicated Cancel Route Logic

**Ticket:** VRTX-0294  
**Type:** DEFECT  
**Priority:** P2 (Medium)  
**Sprint:** SPRINT-0055  
**Related:** `artifacts/SPRINT-0055/SPRINT-PLAN.md` (Section: Defect 3)

---

## Problem Summary

Two nearly identical cancel booking endpoints exist with fully duplicated business logic:
1. Merchant-scoped: `GET/POST /site/[slug]/api/cancel/[token]`
2. Platform-level: `GET/POST /api/cancel/[token]`

This duplication creates a **code maintenance burden** where the same business logic must be kept in sync across two locations, risking logic divergence and making bug fixes require changes in multiple places.

---

## Root Cause

During the multi-tenancy refactor, a merchant-scoped cancel endpoint was added to handle cancellations from the public booking page (which is branded per-merchant). The existing platform-level endpoint also handles cancellations. Rather than consolidating at the time, both endpoints were implemented with nearly identical logic.

**Current State:**

The merchant-scoped endpoint file (`src/app/site/[slug]/api/cancel/[token]/route.ts`) has an explicit TODO comment (line 12-13):

```typescript
/**
 * TODO: Consolidate this route with /api/cancel/[token]/route.ts to avoid
 * the duplication. See: src/app/api/cancel/[token]/route.ts
 */
```

---

## Impact

### Maintenance Impact (MEDIUM)
- **Duplicate Code:** Same business logic in two files creates maintenance burden
- **Consistency Risk:** Bug fixes must be applied to both locations or behavior diverges
- **Testing Burden:** Same logic must be tested twice
- **Onboarding Tax:** New developers must understand both implementations

### Risk Scenarios

**Scenario 1: Email dispatch changes**
- Change made to email logic in merchant-scoped endpoint
- Platform-level endpoint not updated
- Customers cancelling from the platform endpoint get different email notifications than those from merchant page
- Result: Inconsistent user experience

**Scenario 2: Status update logic changes**
- Booking status update logic changes in one endpoint
- Other endpoint continues with old logic
- Cancellations behave differently depending on which endpoint is used
- Result: Data inconsistency

---

## Technical Analysis

### Comparison of Both Endpoints

**File 1:** `src/app/site/[slug]/api/cancel/[token]/route.ts`
- Resolves merchant via slug parameter
- Looks up booking by cancel token
- Updates booking status to 'cancelled'
- Sends email notifications via `sendCancellationToCustomer()` and `sendCancellationAlertToMerchant()`
- Returns JSON response with booking details

**File 2:** `src/app/api/cancel/[token]/route.ts`
- Resolves merchant via token lookup
- Looks up booking by cancel token
- Updates booking status to 'cancelled'
- Sends email notifications via `sendCancellationToCustomer()` and `sendCancellationAlertToMerchant()`
- Returns JSON response with booking details

### Identical Logic

Both endpoints:
1. Resolve the merchant (different methods, same outcome)
2. Get merchant schema and database connection
3. Query bookings table with cancel token filter
4. Check if booking exists
5. Update booking status to 'cancelled'
6. Send email notifications
7. Return success/error response

### Differences

- **Merchant resolution:**
  - Merchant-scoped: via `slug` path parameter + platform DB lookup
  - Platform-level: via cancel token context (merchant determined by booking lookup)
- **Response format:** Slightly different field mapping (minor)

---

## Solution

### Approach: Extract Shared Utility Function

Create a shared utility function that encapsulates the common cancellation logic, allowing both endpoints to use it.

#### Phase 1: Create Shared Utility

**New File:** `src/lib/booking/cancel-booking.ts`

```typescript
import { eq } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type { ReturnType as DrizzleReturnType } from 'drizzle-orm';
import type { Booking } from '@/lib/db/merchant-schema';
import { sendCancellationToCustomer, sendCancellationAlertToMerchant } from '@/lib/email/email-service';

interface CancellationResult {
  success: boolean;
  booking?: Booking;
  error?: string;
  errorCode?: string;
}

interface MerchantInfo {
  businessName: string;
  ownerEmail: string;
}

/**
 * Cancel a booking and send appropriate notifications.
 * 
 * This shared utility handles the core cancellation logic used by both
 * the merchant-scoped (/site/[slug]/api/cancel) and platform-level
 * (/api/cancel) cancel endpoints.
 * 
 * @param booking - The booking to cancel
 * @param schema - Merchant schema with table definitions
 * @param db - Drizzle database instance
 * @param merchantInfo - Business name and owner email for notifications
 * @param reason - Optional cancellation reason
 * @returns Result object with success status and booking details
 */
export async function cancelBooking(
  booking: Booking,
  schema: ReturnType<typeof createMerchantSchema>,
  db: PgDatabase,
  merchantInfo: MerchantInfo,
  reason?: string
): Promise<CancellationResult> {
  try {
    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return {
        success: false,
        error: 'Booking is already cancelled',
        errorCode: 'ALREADY_CANCELLED',
      };
    }

    // Check if booking is in the past
    const now = new Date();
    if (new Date(booking.startTime) < now) {
      return {
        success: false,
        error: 'Cannot cancel bookings in the past',
        errorCode: 'BOOKING_IN_PAST',
      };
    }

    // Update booking status
    const updated = await db
      .update(schema.bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.bookings.id, booking.id))
      .returning();

    if (!updated || updated.length === 0) {
      return {
        success: false,
        error: 'Failed to update booking status',
        errorCode: 'UPDATE_FAILED',
      };
    }

    const cancelledBooking = updated[0];

    // Fetch customer for email
    const customers = await db
      .select({ email: schema.customers.email, firstName: schema.customers.firstName })
      .from(schema.customers)
      .where(eq(schema.customers.id, booking.customerId));

    const customer = customers[0];

    // Send notifications (best-effort; don't fail if email fails)
    try {
      if (customer?.email) {
        await sendCancellationToCustomer(customer.email, booking.confirmationNumber || '');
      }
    } catch (emailError) {
      console.error('Failed to send customer cancellation email:', emailError);
      // Continue even if email fails
    }

    try {
      await sendCancellationAlertToMerchant(
        merchantInfo.ownerEmail,
        booking.confirmationNumber || '',
        merchantInfo.businessName
      );
    } catch (emailError) {
      console.error('Failed to send merchant cancellation alert:', emailError);
      // Continue even if email fails
    }

    return {
      success: true,
      booking: cancelledBooking,
    };
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return {
      success: false,
      error: 'Failed to cancel booking',
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}
```

#### Phase 2: Update Merchant-Scoped Endpoint

**File:** `src/app/site/[slug]/api/cancel/[token]/route.ts`

Simplify to use the shared utility:

```typescript
/**
 * GET  /site/[slug]/api/cancel/[token]
 * POST /site/[slug]/api/cancel/[token]
 *
 * Merchant-scoped cancel endpoints. The middleware rewrites requests from
 * {slug}.platform.com/api/cancel/{token} here.
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { cancelBooking } from '@/lib/booking/cancel-booking'; // Use shared utility
import { getPool } from '@/lib/db/pool'; // Assume pool is exported

interface RouteParams {
  params: Promise<{ slug: string; token: string }>;
}

async function resolveBooking(slug: string, token: string) {
  // ... existing merchant/booking resolution logic ...
  // Returns: { booking, schema, db, merchantInfo } or { error }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug, token } = await params;

  const result = await resolveBooking(slug, token);
  if ('error' in result) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  const { booking, schema, db, merchantInfo } = result;

  // Use shared cancellation logic
  const cancelResult = await cancelBooking(booking, schema, db, merchantInfo);

  if (!cancelResult.success) {
    return NextResponse.json(
      { success: false, error: cancelResult.error },
      { status: cancelResult.errorCode === 'ALREADY_CANCELLED' ? 409 : 400 }
    );
  }

  return NextResponse.json({ success: true, booking: cancelResult.booking });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // POST and GET have identical behavior for this endpoint
  return GET(request, { params });
}
```

#### Phase 3: Update Platform-Level Endpoint

**File:** `src/app/api/cancel/[token]/route.ts`

Simplify to use the shared utility:

```typescript
/**
 * GET  /api/cancel/[token]
 * POST /api/cancel/[token]
 *
 * Platform-level cancel endpoints.
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { platformDb } from '@/lib/db/platform-client';
import { merchants } from '@/lib/db/platform-schema';
import { createMerchantSchema } from '@/lib/db/merchant-schema';
import { cancelBooking } from '@/lib/booking/cancel-booking'; // Use shared utility
import { getPool } from '@/lib/db/pool';

interface RouteParams {
  params: Promise<{ token: string }>;
}

async function resolveBooking(token: string) {
  // ... existing booking resolution logic ...
  // Returns: { booking, schema, db, merchantInfo } or { error }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const result = await resolveBooking(token);
  if ('error' in result) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  const { booking, schema, db, merchantInfo } = result;

  // Use shared cancellation logic
  const cancelResult = await cancelBooking(booking, schema, db, merchantInfo);

  if (!cancelResult.success) {
    return NextResponse.json(
      { success: false, error: cancelResult.error },
      { status: cancelResult.errorCode === 'ALREADY_CANCELLED' ? 409 : 400 }
    );
  }

  return NextResponse.json({ success: true, booking: cancelResult.booking });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // POST and GET have identical behavior
  return GET(request, { params });
}
```

---

## Benefits of This Approach

- **Single source of truth:** Cancellation logic lives in one place
- **Reduced maintenance:** Bug fixes apply automatically to both endpoints
- **Easier testing:** Can test business logic in isolation from endpoints
- **Backward compatibility:** No changes to endpoint signatures or response formats
- **Extensibility:** Easy to add new cancellation behavior (e.g., notifications, refunds)

---

## Acceptance Criteria

- ✅ Shared `cancelBooking()` utility function created in `src/lib/booking/cancel-booking.ts`
- ✅ Function is well-documented with JSDoc comments
- ✅ Function handles both success and error cases
- ✅ Merchant-scoped endpoint (`/site/[slug]/api/cancel/[token]`) uses the shared function
- ✅ Platform-level endpoint (`/api/cancel/[token]`) uses the shared function
- ✅ Email notifications sent consistently from both endpoints
- ✅ Booking status updated consistently from both endpoints
- ✅ Response format and HTTP status codes unchanged
- ✅ All existing tests pass without regression
- ✅ New tests verify the shared utility function
- ✅ TODO comment in merchant-scoped endpoint is removed/resolved

---

## Testing Strategy

### Unit Tests

**New file:** `src/lib/booking/__tests__/cancel-booking.test.ts`

Test the shared utility function:

1. **Successful cancellation**
   - Setup: Valid booking, merchant info
   - Call: `cancelBooking(booking, schema, db, merchantInfo)`
   - Expected: Returns `{ success: true, booking: cancelledBooking }`

2. **Already cancelled booking**
   - Setup: Booking with status='cancelled'
   - Call: `cancelBooking(...)`
   - Expected: Returns `{ success: false, errorCode: 'ALREADY_CANCELLED' }`

3. **Past booking cannot be cancelled**
   - Setup: Booking with startTime in the past
   - Call: `cancelBooking(...)`
   - Expected: Returns `{ success: false, errorCode: 'BOOKING_IN_PAST' }`

4. **Email notifications sent**
   - Setup: Valid booking with customer email
   - Call: `cancelBooking(...)`
   - Expected: Both `sendCancellationToCustomer()` and `sendCancellationAlertToMerchant()` called

5. **Continues if email fails**
   - Setup: Valid booking, email service throws error
   - Call: `cancelBooking(...)`
   - Expected: Returns success=true (email failure doesn't block cancellation)

### Integration Tests

**Files:** `src/app/site/[slug]/api/cancel/[token]/__tests__/route.test.ts` and `src/app/api/cancel/[token]/__tests__/route.test.ts`

1. **Merchant-scoped endpoint uses shared logic**
   - Make request to merchant-scoped endpoint
   - Verify booking is cancelled
   - Verify emails were sent

2. **Platform-level endpoint uses shared logic**
   - Make request to platform-level endpoint
   - Verify booking is cancelled
   - Verify emails were sent

3. **Both endpoints behave identically**
   - Make same cancellation request to both endpoints
   - Verify same result (status, response, emails)

---

## Definition of Done

- [x] Root cause identified and documented
- [ ] Shared `cancelBooking()` utility created
- [ ] Merchant-scoped endpoint updated to use utility
- [ ] Platform-level endpoint updated to use utility
- [ ] Unit tests for `cancelBooking()` passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] All npm scripts pass (typecheck, lint, test)
- [ ] Code review approved
- [ ] Merged into SPRINT-0055 branch

---

## Files Modified

- `src/lib/booking/cancel-booking.ts` (NEW)
- `src/app/site/[slug]/api/cancel/[token]/route.ts` (refactor to use utility)
- `src/app/api/cancel/[token]/route.ts` (refactor to use utility)
- `src/lib/booking/__tests__/cancel-booking.test.ts` (NEW)
- `src/app/site/[slug]/api/cancel/[token]/__tests__/route.test.ts` (update tests)
- `src/app/api/cancel/[token]/__tests__/route.test.ts` (update tests)

---

## Rollback Plan

If issues arise:

1. Revert the endpoint changes to reuse their original implementations
2. The shared utility can remain in place or be removed
3. No data loss or breaking changes (endpoints behavior unchanged)

---

## Migration Path

This can be done incrementally if needed:

1. Create the shared utility
2. Update one endpoint to use it (e.g., platform-level)
3. Test thoroughly
4. Update the other endpoint (merchant-scoped)
5. Test and verify both endpoints work identically

---

## Documentation Updates

- **ARCHITECTURE.md:** Add note about shared cancellation utility
- **TODO comment:** Remove the TODO comment from merchant-scoped endpoint

---

## Estimated Effort

- **Utility creation:** 30 minutes
- **Endpoint refactoring:** 30 minutes (both endpoints)
- **Testing:** 45 minutes (unit + integration tests)
- **Manual verification:** 20 minutes
- **Review/refinement:** 15 minutes
- **Total:** ~2 hours

---

## Related Issues

- Identified in SPRINT-0052 as a defect
- Related to booking cancellation flow
- Part of customer-facing cancel endpoints

---

## Success Metrics

1. Shared utility function created and tested
2. Both endpoints use the shared utility
3. Email notifications sent consistently
4. Booking status updated consistently from both endpoints
5. All tests pass
6. Response formats unchanged
7. Developers can easily understand cancellation logic
