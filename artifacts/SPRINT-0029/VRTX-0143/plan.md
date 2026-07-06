# Plan: Create /api/healthz-smoke-572185676 Endpoint

**Ticket:** VRTX-0143
**Sprint:** SPRINT-0029
**Type:** TASK
**Status:** In Progress

---

## Overview

Create a new smoke-test health check endpoint at `GET /api/healthz-smoke-572185676/` that returns a deterministic response for load balancers and monitoring systems.

This endpoint follows the same pattern as the existing `/api/healthz-smoke/` endpoint but with a variant identifier.

---

## Requirements

### Functional Requirements
- **Endpoint:** `GET /api/healthz-smoke-572185676`
- **Response Status:** 200 OK
- **Response Body:** `{ ok: true, variant: "572185676" }`
- **Content-Type:** application/json
- **Authentication:** None required (public endpoint)
- **Dependencies:** None (no DB, no external calls, self-contained)

### Non-Functional Requirements
- **Performance:** Response time < 100ms (typical < 10ms)
- **Type Safety:** Full TypeScript strict mode compliance
- **Linting:** Pass ESLint with 0 warnings
- **Testing:** 100% test coverage with all tests passing
- **Pattern Adherence:** Follow exact style/structure of `/api/healthz-smoke/route.ts`

---

## Implementation Steps

### Step 1: Specification Writing
- Write spec.md documenting:
  - Endpoint path, method, and purpose
  - Request/response contract
  - Authentication requirements (none)
  - Edge cases and constraints
  - Acceptance criteria

### Step 2: TDD Test Cases Design
- Define test matrix covering:
  - Response status code (200)
  - Response body structure and variant value
  - No authentication required
  - Response time constraints
  - Content-Type header
  - Consistency and performance under load

### Step 3: Test Implementation (Red Phase)
- Create `src/app/api/healthz-smoke-572185676/__tests__/route.test.ts`
- Write failing tests for all acceptance criteria
- Ensure tests fail before implementation

### Step 4: Implementation (Green Phase)
- Create `src/app/api/healthz-smoke-572185676/route.ts`
- Implement async GET handler:
  - Return NextResponse.json() with correct payload
  - Status 200
  - No dependencies
- Add JSDoc documentation matching existing pattern
- Ensure all tests pass

### Step 5: Code Quality Verification
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 warnings
- `npm run test` → all tests pass (including new tests)

### Step 6: Manual Integration Testing
- `npm run dev`
- `curl http://localhost:3000/api/healthz-smoke-572185676`
- Verify response matches spec: `{ ok: true, variant: "572185676" }`

### Step 7: Git Commit
- Commit all changes with clear message
- Include all artifact files (spec.md, tdd-test-*.md, summary.md)
- Push to ticket branch

---

## File Structure

```
src/app/api/healthz-smoke-572185676/
├── route.ts                 ← Handler implementation
└── __tests__/
    └── route.test.ts        ← Test suite

artifacts/SPRINT-0029/VRTX-0143/
├── plan.md                  ← This file
├── spec.md                  ← Specification
├── tdd-test-cases.md        ← Test design matrix
├── tdd-test-result.md       ← Test run results
└── summary.md               ← Implementation summary
```

---

## Reference Implementation

The pattern is based on the existing smoke test endpoint:
- `src/app/api/healthz-smoke/route.ts` (existing handler)
- `src/app/api/healthz-smoke/__tests__/route.test.ts` (existing tests)

Key differences:
- New endpoint URL includes variant ID in path
- Response includes `variant: "572185676"` field
- Otherwise identical structure and behavior

---

## Acceptance Criteria

✅ Route handler created at `src/app/api/healthz-smoke-572185676/route.ts`
✅ GET request returns `{ ok: true, variant: "572185676" }` with status 200
✅ Tests in `__tests__/route.test.ts` covering:
   - Response status code
   - Response body format
   - No auth required
✅ `npm run typecheck` passes with no errors
✅ `npm run lint` passes with 0 warnings
✅ `npm run test` passes with all tests green
✅ Manual verification: curl returns correct response
✅ All artifact files committed

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Deviation from existing pattern | Copy exact style from healthz-smoke endpoint |
| Type safety issues | Strict TypeScript, run typecheck before commit |
| Linting failures | Run lint and fix before committing |
| Test failures | Write tests first (TDD red phase), then implementation |

---

## Success Criteria

- All acceptance criteria met
- All tests pass
- All quality gates pass (typecheck, lint)
- Manual verification confirms endpoint works
- All artifacts created and committed
