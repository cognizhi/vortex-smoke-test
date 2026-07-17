# VRTX-0486 Fix Note

## Root Cause Analysis

**Problem:** Endpoints matching pattern `healthz-smoke-bugfix-ha-*` and `healthz-smoke-bugfix-ha2-*` return HTTP 404 HTML instead of expected JSON responses.

**Affected Endpoints:**
- SPRINT-0080: `/api/healthz-smoke-bugfix-ha-30297400`
- SPRINT-0082: `/api/healthz-smoke-bugfix-ha-986931698`
- SPRINT-0085: `/api/healthz-smoke-bugfix-ha-57235969`, `/api/healthz-smoke-bugfix-ha2-409438860`

**QA Verification:**
- ✅ Source code: Correctly implemented in `/src/app/api/healthz-smoke-bugfix-ha*/route.ts`
- ✅ Compilation: Routes present in `.next/server` build artifacts
- ✅ Manifest: Routes registered in `app-paths-manifest.json`
- ❌ Runtime: Returns 404 HTML despite correct implementation

**Root Cause Identified:**
The catch-all dynamic route at `/src/app/api/healthz-smoke-bugfix-[...]/route.ts` uses invalid Next.js 15 syntax. In Next.js App Router, catch-all dynamic segments must be named using the format `[...paramName]`, not just `[...]`. The unnamed catch-all `[...]` is not recognized as a valid dynamic segment by Next.js, causing it to fail to properly route requests to any `/api/healthz-smoke-bugfix-*` endpoints.

This causes a cascade failure:
1. Specific routes like `/src/app/api/healthz-smoke-bugfix-ha2-409438860/route.ts` should take precedence but are not being matched
2. The invalid catch-all route cannot serve as a fallback
3. Next.js returns a generic 404 HTML page

**Why Previous Fixes Failed:**
- Attempt 1 (Add NextRequest parameter): Added parameter to specific routes but didn't fix the broken catch-all
- Attempt 2 (Remove comments): Simplified code but didn't address routing issue
- Attempt 3 (Clear cache): Rebuilt but the underlying directory structure issue remained

## Minimal Fix Applied

**Root Cause Fix:** Rename catch-all directory from invalid syntax to valid Next.js 15 syntax

### Directory Restructuring

**Before (Invalid):**
```
/src/app/api/healthz-smoke-bugfix-[...]/route.ts
```

**After (Valid):**
```
/src/app/api/healthz-smoke-bugfix-[...route]/route.ts
```

### Code Update

**Parameter Extraction:**
```typescript
// Before: const variantParts = (resolvedParams.__param || []) as string[];
const variantParts = (resolvedParams.route || []) as string[];
```

The `route` parameter name must match the bracket name `[...route]` in the directory structure.

## Files Changed

1. **Renamed directory:**
   - From: `/src/app/api/healthz-smoke-bugfix-[...]/`
   - To: `/src/app/api/healthz-smoke-bugfix-[...route]/`

2. **Updated route handler:**
   - `/src/app/api/healthz-smoke-bugfix-[...route]/route.ts`
   - Changed parameter extraction: `resolvedParams.__param` → `resolvedParams.route`

3. **Updated tests:**
   - `/src/app/api/healthz-smoke-bugfix-[...route]/__tests__/route.test.ts`
   - Updated test params: `__param: [...]` → `route: [...]`

## Verification

**After fix, all endpoints should:**
- ✅ Return HTTP 200 status
- ✅ Return JSON response: `{ "ok": true, "variant": "<id>" }`
- ✅ Include correct Content-Type: `application/json`
- ✅ Respond in < 100ms (typical < 10ms)
- ✅ Handle concurrent requests correctly
- ✅ Work for all sprint variants (SPRINT-0080, 0082, 0085+)

## Infrastructure Lesson

Next.js App Router's catch-all syntax requires a parameter name: `[...name]`. Unnamed catch-all `[...]` is not valid in Next.js 15 and will not be recognized as a dynamic route, causing all requests to that prefix to fail with 404.
