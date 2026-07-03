# Implementation Plan: VRTX-0019

**Ticket:** VRTX-0019
**Title:** Implement /healthz-smoke-518124667 GET endpoint
**Sprint:** SPRINT-0004
**Date:** 2026-07-03

---

## Overview

Implement a lightweight variant health check endpoint at `src/app/api/healthz-smoke-518124667/route.ts` that returns `{ ok: true, variant: "518124667" }` with zero dependencies. The implementation follows the pattern from the existing `/api/healthz-smoke` endpoint but with a simpler response structure.

## Files to Create/Modify

| Path | Type | Purpose |
|------|------|---------|
| `src/app/api/healthz-smoke-518124667/route.ts` | Create | Main route handler |
| `src/app/api/healthz-smoke-518124667/__tests__/route.test.ts` | Create | Comprehensive unit tests |

## Implementation Steps

### Step 1: Specification (COMPLETE)
- ✅ Read PRODUCT.md, DESIGN.md, CLAUDE.md for context and conventions
- ✅ Write spec.md documenting requirements, acceptance criteria, and test strategy
- ✅ Identify pattern reference: `/src/app/api/healthz-smoke/route.ts`

### Step 2: Test Design (IN PROGRESS)
Use test-automation skill to:
- Design comprehensive test matrix covering all acceptance criteria
- Write failing tests (red phase) in `__tests__/route.test.ts`
- Document test cases in `tdd-test-cases.md`

**Test coverage:**
- Response status 200
- JSON structure: `{ ok: true, variant: "518124667" }`
- Field types and values
- Content-Type header
- Performance (< 100ms)
- Consistency across multiple calls
- No side effects / database calls
- NextResponse type validation

### Step 3: Implementation
Use backend-dev skill to:
- Create `src/app/api/healthz-smoke-518124667/route.ts`
- Export async GET handler
- Use NextResponse.json() for response
- Add comprehensive JSDoc comments
- Ensure pure function (no dependencies, no side effects)

**Handler structure:**
```typescript
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: "518124667" },
    { status: 200 }
  );
}
```

### Step 4: Code Review
Use code-review skill to:
- Review implementation against specification
- Check TypeScript type safety
- Verify JSDoc completeness
- Ensure pattern consistency with existing endpoints
- Check for any missed acceptance criteria

### Step 5: Test Verification (Green Phase)
Use test-automation skill to:
- Run all tests and verify they pass
- Record test results in `tdd-test-result.md`
- Ensure 100% code coverage for the handler
- Document any deviations from spec

### Step 6: Type Check & Lint
Run:
- `npm run typecheck` — must pass with zero errors
- `npm run lint` — must pass with zero warnings

### Step 7: Git Workflow
- Commit changes on feature branch
- Push to origin
- Create PR to sprint branch
- Wait for review/merge

## Critical Path

1. **Writing tests** (test-automation) — defines contract
2. **Implementation** (backend-dev) — fulfills contract
3. **Review** (code-review) — validates correctness
4. **Verification** (test-automation) — confirms green phase
5. **Quality checks** (lint, typecheck) — ensures standards
6. **Git workflow** (branch, PR, merge)

## Success Criteria

- ✅ All files created at correct paths
- ✅ GET handler returns 200 with `{ ok: true, variant: "518124667" }`
- ✅ All 14+ test cases pass
- ✅ `npm run typecheck` passes
- ✅ `npm run lint` passes
- ✅ 100% code coverage for route handler
- ✅ All artifacts committed on feature branch
- ✅ PR created and ready for review

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Response format mismatch | Tests fail; spec not met | Follow PRODUCT.md exactly; validate against AC-02 |
| Performance regression | Exceeds 100ms | Keep handler pure; avoid any async operations |
| Type safety issues | Lint/typecheck fails | Use explicit TypeScript types; no `any` |
| Missing test coverage | Gaps in validation | Use comprehensive test matrix with edge cases |

## Notes

- This is a **green-field implementation** (new endpoint, no existing code)
- Pattern is proven in `/api/healthz-smoke` — low risk of architectural issues
- **No dependencies** means no mocking or test setup needed
- Response structure is **intentionally simpler** than `/api/healthz-smoke` (variant-specific requirement)
