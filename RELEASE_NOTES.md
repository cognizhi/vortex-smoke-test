# Release Notes — Booking Flow Slug Parameter Fix (B-0004)

**Version**: 0.2.0  
**Release Date**: 2026-06-11  
**Status**: Ready for Production

---

## 🔧 What's Fixed

### Problem
Customers attempting to book appointments were unable to select time slots. After choosing a date, the system displayed the validation error **"String must contain at least 3 character(s)"** instead of showing available time options.

### Root Cause
The booking flow's date selection step (`BookingFlow.tsx`) was fetching available time slots from the backend API but **forgot to include the merchant slug as a required query parameter**. The backend API validates this slug using the schema rule `slug: z.string().min(3)`. When the slug was missing, it defaulted to an empty string, triggering the validation error.

### Solution
Added the merchant `slug` parameter to the query string when fetching available slots. This is a **1-line change** that passes the slug value (already available in the component props) along with the other required parameters (`staffId`, `serviceId`, `date`).

**File Changed**: `src/app/site/[slug]/BookingFlow.tsx` (line 474)

```diff
- const qs = new URLSearchParams({ staffId, serviceId, date });
+ const qs = new URLSearchParams({ staffId, serviceId, date, slug: _slug });
```

---

## ✅ Impact & Benefits

### Who This Affects
- **Customers**: Can now complete the full booking flow without errors
- **Booking Platform**: Restores critical user journey from date → time selection
- **Merchants**: Their booking calendars are now functional for customers

### Key Improvements
1. **User Experience**: Seamless date-to-time selection without validation errors
2. **Reliability**: Minimal change reduces risk of side effects
3. **Zero Breaking Changes**: No API contracts modified, no schema changes required

### Blast Radius
**Minimal** — Only the `/api/booking/slots` query parameter set is affected. No other features, flows, or API endpoints are impacted.

---

## 🧪 Testing & Verification

All acceptance criteria met with **0 critical defects**:

| Criterion | Status |
|-----------|--------|
| ✅ UI displays time slots after date selection (no error) | **PASS** |
| ✅ Slug parameter included in query | **PASS** |
| ✅ Booking flow completion (date → time) | **PASS** |
| ✅ No regression in other booking steps | **PASS** |

**Quality Gates**:
- TypeScript: ✅ 0 errors, 0 warnings
- ESLint: ✅ 0 warnings
- Build: ✅ Production build succeeds
- Unit Tests: ✅ All tests pass
- Regression: ✅ No regressions in other flows

---

## 📋 Deployment Checklist

- [x] Code reviewed and tested
- [x] All CI checks green (TypeScript, linting, build)
- [x] Unit tests passing
- [x] Regression testing complete
- [x] Release notes written
- [x] Artifact ready for release

---

## 🚀 Deployment Instructions

### Prerequisites
- PostgreSQL database running (local or RDS)
- `DATABASE_URL` environment variable set
- Node.js 18+ with npm installed

### Steps
1. **Pull the latest build**:
   ```bash
   git checkout vortex/idea/b-0004
   npm install
   npm run build
   ```

2. **Deploy to staging environment**:
   - On Vercel: Auto-deploy on git push (if branch is connected)
   - Docker: `docker build -t booking-app . && docker run -e DATABASE_URL=<url> -p 3000:3000 booking-app`

3. **Smoke Tests**:
   ```bash
   # Navigate to booking page and test:
   # 1. Select staff member
   # 2. Select service
   # 3. Select date → verify time slots appear (no error)
   # 4. Select time → advance to customer details
   # 5. Submit booking → confirm success
   ```

4. **Staging Verification**:
   - Booking page loads without errors
   - Date selection triggers slot fetch (check Network tab)
   - Time slots display correctly for selected date
   - Full booking flow completes end-to-end

---

## 📝 Rollback Plan

If issues arise in production:

```bash
# Revert to previous stable version
git revert <commit-hash>
git push
```

The change is isolated to the slots query. No data migration or schema rollback needed.

---

## 🔍 Technical Details

**Related Files**:
- Frontend: `src/app/site/[slug]/BookingFlow.tsx` (line 474)
- Backend: `/api/booking/slots/route.ts` (line 41 — validation schema)
- Test: `src/components/booking/__tests__/slug-parameter.test.ts`

**API Contracts** (unchanged):
- Request: GET `/api/booking/slots?staffId=<id>&serviceId=<id>&date=<date>&slug=<slug>`
- Response: `{ data: { slots: [{ startTime, endTime }, ...] } | null, error: { message } | null }`

---

## 📞 Support

For questions or issues:
1. Check the booking flow test at `src/components/booking/__tests__/slug-parameter.test.ts`
2. Review backend validation schema at `/api/booking/slots/route.ts`
3. Verify environment variables: `DATABASE_URL` must be set and valid

---

## 🎯 Related Links

- **Task**: B-0004 (spark → construct → proving → assembly)
- **Branch**: `vortex/idea/b-0004`
- **Commits**: 5 commits (fix + integration + test verification)
- **Blast Radius**: Minimal (query parameter only)

---

**Release Status**: ✅ **READY FOR PRODUCTION**

All gates passed. No known issues. Approved for immediate deployment to staging and production environments.
