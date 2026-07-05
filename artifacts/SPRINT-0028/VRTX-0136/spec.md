# Bug Specification: Missing Variant Smoke Test Endpoint

**Ticket:** VRTX-0136
**Type:** Bug Fix
**Severity:** High
**Date:** 2026-07-05
**Author:** Engineer Agent

---

## 1. Bug Description

The variant-specific health check endpoint `/api/healthz-smoke-bugfix2-1047318619` does not exist, returning **HTTP 404** instead of the expected **HTTP 200** with a JSON response body.

This endpoint is required for smoke test / deployment verification purposes. It should be a lightweight, self-contained health check that identifies a specific application variant without any external dependencies (database, auth, or external services).

## 2. Reproduction Steps

1. Deploy or run the application
2. Issue a GET request: `curl http://localhost:3000/api/healthz-smoke-bugfix2-1047318619`
3. **Expected:** HTTP 200 with JSON body `{ "ok": true, "variant": "1047318619" }`
4. **Actual:** HTTP 404 (Not Found)

**Environment:** Development and production; browser-independent (API endpoint)

## 3. Root Cause Analysis

The endpoint does not exist in the codebase. No route handler exists at:
- `src/app/api/healthz-smoke-bugfix2-1047318619/route.ts`

This is a missing implementation, not a bug in existing code. The directory and route handler must be created following the established pattern used by other variant endpoints (e.g., `/api/healthz-smoke-901947994`, `/api/healthz-smoke-305070125`, etc.).

**Root cause:** Missing route handler file and directory structure for the variant endpoint.

## 4. Fix Approach

Create a new route handler at `src/app/api/healthz-smoke-bugfix2-1047318619/route.ts` that:

1. Exports an async `GET` function matching the Next.js App Router convention
2. Returns a `NextResponse.json()` with:
   - Status code: 200
   - Body: `{ "ok": true, "variant": "1047318619" }`
3. Includes comprehensive JSDoc comments explaining the endpoint's purpose
4. Has zero dependencies (no database access, no auth checks, no external calls)
5. Targets response time < 100ms (typical < 10ms)

**Implementation pattern:** Replicate the exact structure of existing variant endpoints (e.g., `/api/healthz-smoke-901947994/route.ts`), substituting the variant identifier.

**Why this fix is safe and correct:**
- Follows the established, battle-tested pattern from 10+ existing variant endpoints
- No modifications to existing code → zero risk of regressions
- Self-contained implementation → no side effects or dependencies
- Matches the documented health check endpoint specification in PRODUCT.md

## 5. Regression Risk

| Area | Risk | Mitigation |
|------|------|------------|
| Existing variant endpoints | Low | No changes to existing code; new endpoint is isolated |
| Routing | Low | Next.js App Router will route based on directory structure alone |
| Performance | Low | Handler is stateless; no blocking operations |
| Security | Low | Endpoint is intentionally public (no auth); no sensitive data exposed |

## 6. Fix Acceptance Criteria

- **FIX-01:** Given a GET request to `/api/healthz-smoke-bugfix2-1047318619`, the endpoint responds with HTTP 200
- **FIX-02:** The response body is valid JSON with exact structure: `{ "ok": true, "variant": "1047318619" }`
- **FIX-03:** The response has no extra fields (exactly "ok" and "variant")
- **FIX-04:** The `ok` field is boolean `true` (not string or number)
- **FIX-05:** The `variant` field is string `"1047318619"` (not number)
- **FIX-06:** Content-Type header is `application/json`
- **FIX-07:** Response time is < 100ms (typical < 10ms)
- **FIX-08:** Endpoint is public (no authentication required)
- **FIX-09:** No existing tests are broken by this change
- **FIX-10:** Comprehensive unit tests cover all response scenarios and edge cases

## 7. Test Strategy

Write comprehensive unit tests that verify:

**Response Structure (4 tests)**
- Returns HTTP 200 status code
- Response JSON has correct structure: `{ ok: true, variant: "1047318619" }`
- No extra fields in response (exactly 2 root keys)
- Response has exactly "ok" and "variant" fields

**Type Safety (2 tests)**
- `ok` field is boolean `true` (not truthy string/number)
- `variant` field is string `"1047318619"` (not number)

**HTTP Headers (2 tests)**
- Content-Type header is `application/json`
- Response is a Next.js `NextResponse` instance

**Performance (3 tests)**
- Response time < 100ms
- Typical response time < 10ms
- Under load (50 concurrent calls), all respond within 100ms

**Public Access & Consistency (3 tests)**
- No authentication required
- Multiple sequential calls return consistent responses
- Self-contained (no environment variables needed)

**Test file location:** `src/app/api/healthz-smoke-bugfix2-1047318619/__tests__/route.test.ts`

**Coverage:** 100% for the new route handler (single GET function).

## 8. Dependencies & Blockers

| Dependency | Type | Status |
|------------|------|--------|
| None | — | ✓ Clear |

This is a self-contained endpoint with no dependencies on other services, libraries, or systems.

## 9. Open Questions

- None. The specification and implementation pattern are clear from existing variant endpoints.

---

**Implementation approach:** 
1. Create directory: `src/app/api/healthz-smoke-bugfix2-1047318619/`
2. Create route handler: `src/app/api/healthz-smoke-bugfix2-1047318619/route.ts` (replicate pattern from existing endpoints)
3. Create test directory: `src/app/api/healthz-smoke-bugfix2-1047318619/__tests__/`
4. Create test file: `src/app/api/healthz-smoke-bugfix2-1047318619/__tests__/route.test.ts` (replicate pattern from existing endpoint tests)
5. Run tests to verify all pass
6. Verify type checking and linting pass
7. Commit all files

*This spec is the source of truth. Any deviation must be documented in summary.md.*
