# VRTX-0292: Fix Hardcoded Session in Branding Reset Endpoint

**Ticket:** VRTX-0292  
**Type:** DEFECT  
**Priority:** P0 (Critical)  
**Sprint:** SPRINT-0055  
**Related:** `artifacts/SPRINT-0055/SPRINT-PLAN.md` (Section: Defect 1)

---

## Problem Summary

The PUT `/api/admin/branding/reset` endpoint has a **hardcoded session** that returns fixed user and merchant IDs (`"user-123"` and `"merchant-123"`) instead of retrieving the actual authenticated session from the request. This is a critical authentication bypass vulnerability.

---

## Root Cause

File: `src/app/api/admin/branding/reset/route.ts` (lines 47-57)

The `getSession()` function is a stub implementation:

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

**Why it happened:** The endpoint was partially implemented during development with an explicit TODO comment. The developer intended to implement proper session retrieval but the work was never completed before the code was merged.

---

## Impact

### Security Impact (HIGH)
- **Authentication Bypass:** Any client, authenticated or not, can make requests to the endpoint
- **Fixed Identity:** Every request uses `"user-123"` and `"merchant-123"`, ignoring the actual request identity
- **Scope:** All requests to `PUT /api/admin/branding/reset` are affected

### Functional Impact
- **Admin Cannot Use Endpoint:** Admin users cannot reset their own merchant's branding because the hardcoded `"merchant-123"` ID is always used instead of their actual merchant context
- **Branding Hijacking:** If merchant-123 exists in the database, any unauthenticated request can modify its branding

---

## Reproduction

**Steps:**

1. Start the application: `npm run dev`
2. Make an HTTP request WITHOUT authentication:
   ```bash
   curl -X PUT http://localhost:3000/api/admin/branding/reset \
     -H "Content-Type: application/json" \
     -d '{"fields": ["site_name", "avatar_url"]}'
   ```
3. **Expected (correct):** 401 Unauthorized
4. **Actual (buggy):** 200 OK with branding reset for merchant-123

**Proof:**
- The endpoint has no authentication check that would reject the request
- The hardcoded `getSession()` always returns a valid session
- The authorization check (role === 'admin') passes because the hardcoded session has role 'admin'
- Branding for merchant-123 is updated

---

## Technical Details

### Current Code Path

1. Client makes request: `PUT /api/admin/branding/reset`
2. Handler calls `getSession()` (line 62)
3. Stub function returns hardcoded user/merchant (line 47-57)
4. Auth check passes: `if (!session || !session.user)` — always false (line 63)
5. Role check passes: `if (session.user.role !== 'admin')` — always false (line 71)
6. Request body is parsed
7. Database is updated using hardcoded `session.user.merchantId` = `"merchant-123"`
8. Response is returned with updated branding

### What Should Happen

1. Client makes request with `admin_session` JWT cookie
2. Handler calls proper session retrieval (using `requireAdminAuth` middleware)
3. Middleware validates:
   - JWT exists in `admin_session` cookie
   - JWT signature is valid (using `AUTH_SECRET`)
   - JWT is not expired (7-day TTL)
   - JWT payload contains `userId`, `merchantId`, `slug`, `role`
4. Auth context is passed to handler with actual user/merchant IDs
5. Handler uses actual merchant ID (from the authenticated session) for the database update
6. Only the authenticated merchant's branding is updated

---

## Solution

### Implementation Approach

Replace the hardcoded `getSession()` stub with proper JWT-based session retrieval using the existing `requireAdminAuth` middleware pattern.

**Key Changes:**

1. **Import `requireAdminAuth` middleware:**
   ```typescript
   import { requireAdminAuth } from '@/lib/auth/admin-guard';
   ```

2. **Replace hardcoded getSession() stub:**
   - Remove the stub `getSession()` function entirely
   - Use `requireAdminAuth(request)` at the start of the PUT handler
   - Extract merchant context from the auth context

3. **Update the PUT handler to use requireAdminAuth:**
   ```typescript
   export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<BrandingResponse>>> {
     // Validate session using middleware
     const ctx = await requireAdminAuth(request);
     if (!ctx.ok) return ctx.response; // Returns 401 or 403 if auth fails
   
     const { db, schema, user } = ctx; // user contains { id, merchantId, role }
     
     // Parse request body
     const body = await request.json() as ResetRequest;
     const { fields } = body;
     
     // Validate fields...
     
     // Update database using authenticated user's merchantId
     const result = await db
       .update(merchantBranding)
       .set(updateData)
       .where(eq(merchantBranding.merchantId, user.merchantId)) // Use actual merchant ID
       .returning();
     
     // Return response...
   }
   ```

### Benefits of This Approach

- **Uses existing pattern:** The `requireAdminAuth` middleware is already used throughout the admin API (`src/app/api/admin/...`)
- **Consistent auth:** All admin routes use the same JWT validation and session extraction
- **No new dependencies:** No additional libraries or infrastructure needed
- **Backward compatible:** Endpoint signature and response format unchanged
- **Testable:** Auth logic is tested independently in the middleware; this route's tests can mock the context

---

## Acceptance Criteria

- ✅ Session is retrieved from JWT cookie using `requireAdminAuth` pattern, not hardcoded
- ✅ Endpoint returns 401 if no valid session is present
- ✅ Endpoint returns 403 if user is not an admin (role check)
- ✅ Endpoint returns 403 if user's merchantId doesn't exist in the branding table
- ✅ Authenticated admin can reset their own merchant's branding
- ✅ Endpoint rejects unauthenticated requests with 401 HTTP status
- ✅ Endpoint uses the actual authenticated merchant ID (not hardcoded)
- ✅ All existing tests pass without regression
- ✅ Hardcoded session stub function is removed entirely

---

## Testing Strategy

### Unit Tests (Updated)

Test file: `src/app/api/admin/branding/reset/__tests__/route.test.ts`

**Test cases:**

1. **Unauthenticated request returns 401**
   - Setup: No cookie or invalid cookie
   - Request: PUT /api/admin/branding/reset
   - Expected: 401 Unauthorized

2. **Authenticated non-admin returns 403**
   - Setup: Valid JWT with role = 'customer'
   - Request: PUT /api/admin/branding/reset
   - Expected: 403 Forbidden

3. **Valid admin updates own merchant's branding**
   - Setup: Valid JWT with role = 'admin', merchantId = 'merchant-abc'
   - Request: PUT /api/admin/branding/reset with fields: ["site_name"]
   - Expected: 200 OK, branding updated for merchant-abc

4. **Multiple admins can update independently**
   - Setup: Two separate JWT tokens for different merchants
   - Request: Each admin makes PUT request
   - Expected: Each updates only their own merchant's branding

### Integration Tests

1. **Middleware integration:** Verify `requireAdminAuth` is called and its response is handled correctly
2. **No regression:** Existing tests for branding reset still pass
3. **Error cases:** Test invalid request bodies, missing merchantId context

---

## Definition of Done

- [x] Root cause identified and documented
- [ ] Code changes implemented
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing completed
- [ ] No TypeScript errors or linting warnings
- [ ] Code review approved
- [ ] Merged into SPRINT-0055 branch

---

## Files Modified

- `src/app/api/admin/branding/reset/route.ts` (remove stub, use requireAdminAuth)
- `src/app/api/admin/branding/reset/__tests__/route.test.ts` (update/add tests)

---

## Rollback Plan

If the fix causes regressions:

1. Revert the changes to `route.ts`
2. The endpoint will return to the hardcoded session behavior (safe for rollback)
3. No database changes required
4. No configuration changes required

---

## Security Review

**Before fix:**
- ⚠️ Authentication bypass: Any client can use the endpoint
- ⚠️ Fixed identity: Merchant-123 is always targeted
- ⚠️ No per-user isolation: All requests use same user context

**After fix:**
- ✅ JWT validation: Only authenticated admins can use the endpoint
- ✅ Per-user isolation: Each admin only modifies their own merchant's branding
- ✅ Role-based access: Only admins with the 'admin' role can use this endpoint
- ✅ Session expiry: JWT is validated on every request (7-day TTL)

---

## Documentation Updates

None required for root docs (observable API behavior unchanged — endpoint now correctly requires authentication).

---

## Estimated Effort

- **Implementation:** 30 minutes (straightforward middleware integration)
- **Testing:** 45 minutes (add/update unit tests, manual verification)
- **Review/Refinement:** 30 minutes
- **Total:** ~2 hours

---

## Related Issues

- SPRINT-0052 identified this defect but it was not fixed in that sprint
- Similar auth patterns used in: `src/app/api/admin/*/route.ts` files

---

## Success Metrics

1. Endpoint requires valid authentication (401 for missing/invalid JWT)
2. Endpoint validates admin role (403 for non-admin)
3. Admin can modify their own merchant's branding
4. No requests can modify other merchants' branding
5. All tests pass
