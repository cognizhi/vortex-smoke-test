# Implementation Plan: GET /healthz-smoke-908186049 Endpoint

**Ticket:** VRTX-0010  
**Sprint:** SPRINT-0002 (smoke-178305538782864)  
**Type:** TASK  
**Scope:** Implement a lightweight health check endpoint for variant testing and smoke test verification.

---

## Overview

Implement a simple, stateless HTTP endpoint at `GET /api/healthz-smoke-908186049` that returns a JSON response with no dependencies (no database, no auth, no external calls). The endpoint is designed for:

- **Variant testing** — load balancers and monitoring systems can identify this deployment variant by the response
- **Smoke tests** — quick verification that the platform is responding
- **Load balancer integration** — fast, dependency-free health checks

---

## Acceptance Criteria

✅ **Endpoint Implementation**
- File created at `src/app/api/healthz-smoke-908186049/route.ts`
- GET request returns HTTP 200 with correct JSON body
- Response: `{ "ok": true, "variant": "908186049" }`
- Content-Type: `application/json`

✅ **Self-Contained (No Dependencies)**
- No database queries
- No authentication checks
- No external service calls
- No environment variable lookups

✅ **Performance**
- Response time < 10ms (typical case)
- Suitable for frequent polling

✅ **Code Quality**
- TypeScript with strict type safety (zero implicit `any`)
- JSDoc header on handler
- Linting: `npm run lint` passes with 0 warnings
- Type checking: `npm run typecheck` passes
- Comprehensive test coverage with Vitest

---

## Implementation Steps

### Step 1: Create Handler File
Create `src/app/api/healthz-smoke-908186049/route.ts` with:
- JSDoc header documenting the endpoint
- GET handler that returns NextResponse.json()
- Status 200 with body `{ ok: true, variant: "908186049" }`
- Full TypeScript type safety

### Step 2: Write TDD Tests (Red Phase)
Create `src/app/api/healthz-smoke-908186049/__tests__/route.test.ts` with:
- Unit test: verify HTTP 200 response
- Unit test: verify JSON structure (ok and variant fields)
- Unit test: verify no authentication required
- Unit test: verify response time < 10ms
- Unit test: verify Content-Type header
- Integration test patterns for curl verification

### Step 3: Implement Handler (Green Phase)
Write the handler function matching the test specifications.

### Step 4: Verify Tests Pass
Run `npm run test` to verify all tests pass.

### Step 5: Code Quality
- Run `npm run lint` — must have 0 warnings
- Run `npm run typecheck` — must pass
- Manual curl test: verify endpoint responds correctly

### Step 6: Code Review
Review implementation against specification.

### Step 7: Commit and Create PR
- Commit on ticket branch
- Push to remote
- Create PR to sprint branch

---

## Files to Create/Modify

| File | Purpose | Status |
|------|---------|--------|
| `src/app/api/healthz-smoke-908186049/route.ts` | Handler implementation | TODO |
| `src/app/api/healthz-smoke-908186049/__tests__/route.test.ts` | Test suite (TDD) | TODO |

---

## Technical Approach

### Handler Pattern
Use the same pattern as the existing `/healthz-smoke` endpoint but with a simpler response format:
- No `data` wrapper
- No `error` field
- Direct response: `{ ok: true, variant: "908186049" }`

### Test Pattern
Comprehensive unit tests covering:
- Status code assertions
- JSON body structure validation
- Header validation (Content-Type)
- Authentication requirements (none)
- Performance assertions (< 10ms)
- Consistency under load
- Type safety

---

## Success Criteria

1. ✅ Handler file created and implements spec correctly
2. ✅ All tests pass (both unit and integration patterns)
3. ✅ `npm run lint` passes with 0 warnings
4. ✅ `npm run typecheck` passes
5. ✅ Manual curl test succeeds
6. ✅ All acceptance criteria from ticket are met
7. ✅ PR is created and ready for review

---

## Dependencies

- Next.js 15 (existing)
- TypeScript 5 (existing)
- Vitest (existing)
- No new dependencies needed

---

## Estimated Work

- Handler: ~15 minutes
- Tests: ~20 minutes
- Code review & verification: ~10 minutes
- **Total: ~45 minutes**

---

## Notes

- This is a simple, self-contained endpoint with no architectural complexity
- The pattern follows Next.js App Router conventions
- Response format is intentionally minimal to ensure fast response times
- No error handling needed (endpoint always returns 200 ok: true)
