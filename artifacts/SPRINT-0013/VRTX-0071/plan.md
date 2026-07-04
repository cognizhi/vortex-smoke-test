# Implementation Plan: VRTX-0071

## Objective
Create a lightweight smoke test endpoint GET /api/healthz-smoke-110428092 with comprehensive unit tests.

## Overview
This is a variant-specific health check endpoint that returns `{ "ok": true, "variant": "110428092" }` with no external dependencies (no database, auth, or environment variables).

## Files to Create/Modify

### 1. Route Handler: `src/app/api/healthz-smoke-110428092/route.ts`
- **Purpose**: Define the GET handler for the new endpoint
- **Key Features**:
  - Async GET function returning NextResponse
  - Status code: 200
  - Response body: `{ "ok": true, "variant": "110428092" }`
  - JSDoc comment block describing the endpoint
  - No dependencies (no database, auth, or env vars)
  - Follows pattern from existing `/api/healthz-smoke-963602537/route.ts`

### 2. Test File: `src/app/api/healthz-smoke-110428092/__tests__/route.test.ts`
- **Purpose**: Comprehensive unit tests for the endpoint
- **Test Matrix** (14 tests organized by category):
  1. **HTTP Status & Response Body** (4 tests):
     - Returns HTTP 200 status
     - Returns correct JSON structure with ok and variant fields
     - No extra fields in response
     - Exactly two root fields (ok and variant)
  2. **Field Type Safety** (2 tests):
     - ok field is boolean true (not truthy)
     - variant field is string "110428092" (not number)
  3. **HTTP Headers & Meta** (2 tests):
     - Content-Type header is application/json
     - Response is NextResponse instance
  4. **Performance** (3 tests):
     - Response time < 100ms
     - Response time typically < 10ms
     - Under load (50 concurrent calls), all respond within 100ms
  5. **Public Access & Consistency** (3 tests):
     - No authentication required
     - Consistency under repeated calls
     - Self-contained, no env vars needed

## Implementation Strategy

### Phase 1: Design (Complete)
- ✅ Pattern identified from existing variants
- ✅ Response structure confirmed: `{ "ok": true, "variant": "110428092" }`
- ✅ Test matrix designed (14 comprehensive tests)

### Phase 2: TDD Red Phase
- Write all 14 failing tests in `route.test.ts`
- Verify tests fail (red phase)
- Document test cases in `tdd-test-cases.md`

### Phase 3: Implementation
- Create route handler in `route.ts`
- Implement the GET function with correct response format
- Ensure no external dependencies
- Add JSDoc comments

### Phase 4: TDD Green Phase
- Run tests with `npm run test -- healthz-smoke-110428092`
- Verify all 14 tests pass
- Document results in `tdd-test-result.md`

### Phase 5: Quality Assurance
- Run `npm run lint` — ensure 0 warnings
- Run `npm run typecheck` — ensure no type errors
- Verify code follows project conventions from CLAUDE.md

### Phase 6: Documentation & Commit
- Create `summary.md` with results
- Commit all changes (handler, tests, artifacts)
- Push to ticket branch

## Key Patterns to Follow

1. **Response Format**: Simpler than the main /healthz-smoke endpoint
   - Main endpoint: `{ data: { ok: true }, error: null }`
   - Variant endpoint (this): `{ ok: true, variant: "110428092" }`

2. **JSDoc Comment Block**: Describe endpoint, response codes, and response body

3. **Test Organization**: Group tests by category with clear naming (RH-01, RH-02, etc.)

4. **No Dependencies**: Endpoint must work without:
   - Database access
   - Authentication checks
   - Environment variables
   - External service calls

5. **Performance Target**: Response time < 100ms (typically < 10ms)

## Acceptance Criteria Checklist

- [ ] Route handler created at `src/app/api/healthz-smoke-110428092/route.ts`
- [ ] GET handler returns status 200 with correct JSON body
- [ ] Handler has no dependencies (no db, auth, or env vars)
- [ ] Test file created at `src/app/api/healthz-smoke-110428092/__tests__/route.test.ts`
- [ ] All 14 tests pass: `npm run test -- healthz-smoke-110428092`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Code follows project conventions
- [ ] All artifacts committed (plan.md, tdd-test-cases.md, tdd-test-result.md, summary.md)

## Dependencies
- No external dependencies (uses NextResponse from Next.js)
- Vitest for testing
- Follows existing codebase patterns and conventions

## Estimated Effort
- Route handler: 5 minutes
- Test setup and writing: 15 minutes
- Implementation verification: 5 minutes
- Quality checks: 5 minutes
- **Total: ~30 minutes**
