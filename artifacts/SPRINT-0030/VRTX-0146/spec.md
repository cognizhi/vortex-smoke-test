# Bug Specification: Missing /api/healthz-smoke-bugfix-240218546 Endpoint

**Ticket:** VRTX-0146
**Type:** Bug Fix (Missing Endpoint)
**Severity:** High
**Date:** 2026-07-06

---

## 1. Bug Description

The variant-specific health check endpoint `/api/healthz-smoke-bugfix-240218546` is missing from the application. Attempts to access it return HTTP 404, but the endpoint should exist and respond with a lightweight health check response.

This endpoint is part of the established variant smoke test endpoint pattern documented in PRODUCT.md and ARCHITECTURE.md. Similar endpoints (e.g., `/api/healthz-smoke-bugfix-630670662`, `/api/healthz-smoke-bugfix2-555866324`, etc.) already exist and are in production use for deployment verification and monitoring.

## 2. Reproduction Steps

1. Start the development server: `npm run dev`
2. Make a GET request to `/api/healthz-smoke-bugfix-240218546`
3. **Expected**: HTTP 200 with JSON response: `{"ok":true,"variant":"240218546"}`
4. **Actual**: HTTP 404 Not Found

Reproduction command:
```bash
curl http://localhost:3000/api/healthz-smoke-bugfix-240218546
```

**Environment:** All environments (dev, staging, production)

## 3. Root Cause Analysis

The endpoint file does not exist:
- **Missing file**: `src/app/api/healthz-smoke-bugfix-240218546/route.ts`
- **Missing test file**: `src/app/api/healthz-smoke-bugfix-240218546/__tests__/route.test.ts`

The application uses Next.js App Router file-based routing. The absence of the route file means Next.js has no handler to match the request, resulting in a 404 response.

**Root cause**: The route handler for this variant was not created when the bug was introduced or when the variant was requested. Existing similar endpoints follow the same pattern and work correctly (examples: `/api/healthz-smoke-bugfix-630670662` at `src/app/api/healthz-smoke-bugfix-630670662/route.ts`).

## 4. Fix Approach

Create two files following the established pattern from existing variant endpoints:

### File 1: Route Handler
**Path**: `src/app/api/healthz-smoke-bugfix-240218546/route.ts`

- Export async `GET` function returning `NextResponse`
- Response body: `{ ok: true, variant: "240218546" }` with status 200
- No dependencies: no database queries, auth checks, or external calls
- Include JSDoc comments documenting the endpoint behavior
- Hardcoded variant identifier (not dynamic)

### File 2: Comprehensive Tests
**Path**: `src/app/api/healthz-smoke-bugfix-240218546/__tests__/route.test.ts`

- 21 test cases covering:
  - HTTP status and response shape (TC-001 through TC-007)
  - Field types and values (TC-008 through TC-011)
  - Performance requirements (TC-012 through TC-015)
  - No dependencies (TC-016 through TC-018)
  - Type safety and response structure (Additional tests)

This fix is minimal, safe, and reuses the exact pattern from existing, proven endpoints. No refactoring of existing code is required.

## 5. Regression Risk

| Area | Risk | Mitigation |
|------|------|------------|
| Other health endpoints | Low | New endpoint is independent; uses same pattern as 20+ existing variants |
| Route routing | Low | Adding new route file does not affect existing routes |
| Performance | Low | Endpoint is stateless and has no dependencies; typical response < 10ms |
| Monitoring systems | None | Fix enables monitoring; no risk of breaking existing monitors |

No regression testing needed beyond verifying the new tests pass and existing tests still pass.

## 6. Fix Acceptance Criteria

- **FIX-01**: GET `/api/healthz-smoke-bugfix-240218546` returns HTTP 200 status
- **FIX-02**: Response body is valid JSON: `{"ok":true,"variant":"240218546"}`
- **FIX-03**: Content-Type header is `application/json`
- **FIX-04**: Endpoint requires no authentication
- **FIX-05**: Response time < 100ms (typical < 10ms)
- **FIX-06**: All 21 test cases pass
- **FIX-07**: No existing tests broken
- **FIX-08**: Code passes linting (`npm run lint` — zero warnings)
- **FIX-09**: Code passes type checking (`npm run typecheck`)

## 7. Test Strategy

### Unit Tests (Route Handler)
- Test file: `src/app/api/healthz-smoke-bugfix-240218546/__tests__/route.test.ts`
- Uses Vitest + React Testing Library
- Framework: Vitest (already configured in `vitest.config.ts`)
- Environment: Node.js (API routes run in Node)

**Test coverage matrix:**
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-001 | HTTP status code | 200 |
| TC-002 | `ok` field type | `boolean` |
| TC-003 | `variant` field value | `"240218546"` |
| TC-004 | Response is valid JSON | No parse errors |
| TC-005 | Response field count | Exactly 2 fields |
| TC-006 | No extra fields | Keys match `[ok, variant]` |
| TC-007 | Content-Type header | `application/json` |
| TC-008 | Field type safety | `ok=boolean, variant=string` |
| TC-009 | No auth required | GET succeeds without credentials |
| TC-010 | No session required | GET succeeds without cookies |
| TC-011 | Empty headers work | GET succeeds without headers |
| TC-012 | Response time limit | < 100ms |
| TC-013 | Consistency | Multiple calls return identical responses |
| TC-014 | Load (50 concurrent) | All return 200 |
| TC-015 | Load response time | 50 concurrent calls complete < 5s |
| TC-016 | Self-contained | No env vars needed |
| TC-017 | No database | Works without DB connection |
| TC-018 | Test environment | Passes in jsdom and Node environments |
| Additional | NextResponse type | Response instanceof NextResponse |
| Additional | Exact shape match | `{ ok: true, variant: "240218546" }` |
| Additional | Typical performance | < 10ms (non-blocking assertion) |

**Running tests:**
```bash
npm run test -- src/app/api/healthz-smoke-bugfix-240218546/__tests__/route.test.ts
```

### Integration Check
- Verify endpoint is reachable via `curl`: `curl http://localhost:3000/api/healthz-smoke-bugfix-240218546`
- Verify response is valid JSON and contains expected fields

## 8. Success Criteria for Code Review

- [ ] Route file has JSDoc comments matching the established pattern
- [ ] GET handler returns `NextResponse.json()` with correct shape
- [ ] Test file has 21 comprehensive test cases
- [ ] Tests verify status, response shape, field types, no auth, performance, load
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (all tests green)
- [ ] No modifications to existing code (new files only)
- [ ] Follows the exact pattern from `src/app/api/healthz-smoke-bugfix-630670662/`

---

*This spec is the source of truth. The fix is a straightforward addition of a missing endpoint following an established, proven pattern. No architectural changes or scope expansion.*
