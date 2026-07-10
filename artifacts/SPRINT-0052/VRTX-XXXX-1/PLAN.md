# PLAN: Fix Hardcoded Session in Branding Reset Endpoint

**Ticket:** VRTX-XXXX-1 (To be created as DEFECT ticket during execution phase)

**Sprint:** SPRINT-0052

**Severity:** HIGH (Critical — Authentication bypass)

**Date:** 2026-07-10

---

## Problem Statement

The `PUT /api/admin/branding/reset` endpoint contains a stub implementation with hardcoded user and merchant IDs. Any request to this endpoint ignores the actual authenticated user and uses `"user-123"` and `"merchant-123"` instead.

**File:** `src/app/api/admin/branding/reset/route.ts` (lines 47-57)

**Current Code:**
```typescript
function getSession() {
  // TODO: Implement proper session retrieval
  return {
    userId: "user-123",
    merchantId: "merchant-123"
  };
}
```

---

## Root Cause

The endpoint was partially implemented during development with a placeholder `getSession()` function. The TODO comment acknowledges this, but the implementation was never completed before the code was merged. This is an incomplete stub that bypasses authentication.

---

## Impact Assessment

**User Impact:**
- Admins cannot reset their own merchant's branding
- The feature appears to exist but is completely non-functional

**Security Impact:**
- Any authenticated user can trigger branding reset for merchant-123 (hardcoded)
- Actual user identity is ignored
- Authorization checks are bypassed

**Business Impact:**
- Branding reset feature is unavailable
- Affects merchant's ability to restore default branding

---

## Fix Strategy

### Step 1: Implement Proper Session Retrieval

Replace the hardcoded `getSession()` with actual JWT session parsing from the auth cookie.

**Option A: Use requireAdminAuth (Recommended)**
Follow the pattern used in other admin routes. Use the `requireAdminAuth` middleware from `src/lib/auth/admin-guard.ts`:

```typescript
import { requireAdminAuth } from "@/lib/auth/admin-guard";

export async function PUT(request: Request) {
  const session = await requireAdminAuth(request);
  
  // session now contains: { userId, merchantId, slug, role }
  // ...rest of handler
}
```

**Option B: Manual JWT Parsing**
If middleware isn't suitable, manually extract and validate the JWT:

```typescript
import * as jose from "jose";

async function getSession(request: Request) {
  const cookie = request.headers.get("cookie");
  const token = extractCookie(cookie, "admin_session");
  
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  const verified = await jose.jwtVerify(token, secret);
  
  return verified.payload as { userId: string; merchantId: string; slug: string; role: string };
}
```

### Step 2: Add Authorization Check

Ensure the requesting user owns the merchant before allowing the reset:

```typescript
export async function PUT(request: Request) {
  const session = await requireAdminAuth(request);
  
  // Verify user owns the merchant
  const merchant = await getMerchantDb(session.slug);
  const user = await merchant.query.admin_users.findFirst({
    where: eq(admin_users.id, session.userId)
  });
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  // ... proceed with branding reset
}
```

### Step 3: Update Tests

Add tests verifying:
- Authenticated request succeeds
- Missing auth cookie returns 401
- Invalid token returns 401
- User owning different merchant cannot reset
- User owning correct merchant can reset
- Branding is actually reset to defaults

---

## Implementation Checklist

- [ ] Replace hardcoded `getSession()` with `requireAdminAuth` or JWT parsing
- [ ] Add authorization check to verify user owns merchant
- [ ] Update request handler to use actual session data
- [ ] Remove TODO comment
- [ ] Add unit tests for authentication and authorization
- [ ] Add integration test for successful branding reset
- [ ] Verify existing tests still pass
- [ ] Run full test suite: `npm run test`
- [ ] Verify TypeScript: `npm run typecheck`
- [ ] Verify linting: `npm run lint`
- [ ] Build successful: `npm run build`

---

## Test Cases

### Test 1: Authentication Required
**Given:** Request without auth cookie
**When:** POST to `/api/admin/branding/reset`
**Then:** Returns 401 Unauthorized

### Test 2: Invalid Token Rejected
**Given:** Request with invalid/expired auth token
**When:** POST to `/api/admin/branding/reset`
**Then:** Returns 401 Unauthorized

### Test 3: Authorization Check
**Given:** Authenticated user but different merchant ID in request
**When:** POST to `/api/admin/branding/reset` with mismatched merchant
**Then:** Returns 403 Forbidden

### Test 4: Successful Reset
**Given:** Authenticated user with valid merchant ownership
**When:** POST to `/api/admin/branding/reset`
**Then:** Returns 200 and branding is reset to defaults

### Test 5: Branding Actually Reset
**Given:** Merchant with custom branding
**When:** POST to `/api/admin/branding/reset`
**Then:** Branding fields return to default values in subsequent GET

---

## Success Criteria

✅ Hardcoded session removed  
✅ Proper JWT session retrieval implemented  
✅ Authorization check validates user ownership  
✅ Endpoint works with actual authenticated user  
✅ All new tests pass  
✅ Existing tests still pass  
✅ No TypeScript errors  
✅ ESLint clean (0 warnings)  
✅ Build successful  

---

## Effort Estimate

- Implementation: 45 minutes
- Testing: 30 minutes
- Documentation/Review: 15 minutes
- **Total: ~1.5 hours**

---

## Related Code

**Similar patterns to reference:**
- `src/lib/auth/admin-guard.ts` — requireAdminAuth middleware
- `src/app/api/admin/branding/get/route.ts` — GET branding (may already use proper auth)
- `src/app/api/admin/bookings/[id]/route.ts` — PATCH booking (similar pattern)

**Files to modify:**
- `src/app/api/admin/branding/reset/route.ts` — main fix

**Files to test:**
- Existing tests for branding endpoint
- New auth/authz tests

---

## Notes

This is a straightforward fix following established patterns in the codebase. The hardcoded session should never have been merged; this is completing incomplete work rather than fixing a regression.
