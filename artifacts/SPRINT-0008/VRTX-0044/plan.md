# Plan: VRTX-0044 - Implement and test /healthz-smoke-1009679915 endpoint

## Objective
Implement a lightweight, dependency-free variant-specific health check endpoint for SPRINT-0008 that allows monitoring systems to verify specific application code paths are active.

## Requirements
- **Endpoint:** `GET /api/healthz-smoke-1009679915`
- **Response:** `{ data: { ok: true, variant: "1009679915" }, error: null }` with HTTP 200
- **Content-Type:** `application/json`
- **Dependencies:** None (no database, auth, or external calls)
- **Performance:** Response time < 100ms (typical < 10ms)
- **Code Quality:** TypeScript strict, zero lint warnings, full test coverage

## Implementation Strategy

### Step 1: Create Route Handler
- **File:** `src/app/api/healthz-smoke-1009679915/route.ts`
- **Handler:** Async GET function returning NextResponse
- **Response Body:** Hardcoded JSON with variant identifier
- **Status:** 200 (always, no conditional logic)

### Step 2: Write Test Suite
- **File:** `src/app/api/healthz-smoke-1009679915/__tests__/route.test.ts`
- **Test Coverage:**
  - HTTP status code validation (200)
  - Exact JSON structure (data, ok, variant, error fields)
  - Content-Type header validation (application/json)
  - No authentication requirement verification
  - Response time performance (< 100ms)
  - Consistency under repeated calls
  - Concurrent load testing (50+ requests)
  - Type safety verification
  - Edge case validation

### Step 3: Verify Code Quality
- Run `npm run lint` → must pass with 0 warnings
- Run `npm run typecheck` → must pass
- Run `npm run test` → all tests must pass
- Run `npm run test:coverage` → generate coverage report

### Step 4: Commit and Push
- Commit to feature branch with clear message
- Push to origin
- Create PR to sprint branch

## Acceptance Criteria Checklist
- ✓ Route handler exists at src/app/api/healthz-smoke-1009679915/route.ts
- ✓ GET /api/healthz-smoke-1009679915 returns HTTP 200 with correct JSON
- ✓ Response structure: { data: { ok: true, variant: "1009679915" }, error: null }
- ✓ Content-Type is application/json
- ✓ No database queries or external service calls
- ✓ No authentication/authorization checks
- ✓ Response time < 100ms
- ✓ Test file covers: status code, JSON shape, no auth, performance, concurrency, consistency
- ✓ npm run lint passes with 0 warnings
- ✓ npm run typecheck passes
- ✓ npm run test passes (all tests green)
- ✓ Manual verification works with curl

## Artifacts to Create
- `plan.md` — This implementation plan
- `spec.md` — Detailed TDD-based specification
- `tdd-test-cases.md` — Test matrix and coverage details
- `tdd-test-result.md` — Test execution results (red phase and green phase)
- `summary.md` — Completion summary

## Timeline
- Step 3: Write specification
- Step 7: Write failing tests (TDD red phase)
- Step 9: Implement backend
- Step 10: Code review
- Step 11: Verify tests pass (TDD green phase)
- Final: Commit all artifacts and transition ticket to done
