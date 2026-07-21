# SPRINT-0098 Plan: Three Independent Smoke Test Endpoints

**Sprint Goal:** Implement three independent, self-contained GET HTTP endpoints for lightweight health checks and smoke testing.

**Idea:** VST-0085 — [smoke-178467676329523] 3 independent endpoints (107173471)

**Status:** Planning Complete

---

## Executive Summary

This sprint adds three new lightweight health check endpoints to the platform for smoke testing and load balancer verification. Each endpoint is completely independent with no shared code, no database dependencies, no authentication, and no external calls. These endpoints follow the established pattern of existing health check endpoints already in the codebase.

### Endpoints to Implement
- `/api/healthz-smoke-107173471-a` → returns `{"ok": true, "variant": "107173471"}`
- `/api/healthz-smoke-107173471-b` → returns `{"ok": true, "variant": "107173471"}`
- `/api/healthz-smoke-107173471-c` → returns `{"ok": true, "variant": "107173471"}`

---

## Implementation Strategy

### Design Rationale

Each endpoint is implemented as a **completely independent unit of work**:
- No shared code or helpers between endpoints
- No dependencies on other endpoints in this sprint
- Can be developed and tested in parallel
- Follows the Next.js 15 App Router pattern used throughout the codebase

### Template Implementation

Each endpoint follows the established pattern:

```typescript
import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '107173471',
    },
    { status: 200 }
  )
}
```

### Directory Structure

```
src/app/api/healthz-smoke-107173471-a/
  └── route.ts
src/app/api/healthz-smoke-107173471-b/
  └── route.ts
src/app/api/healthz-smoke-107173471-c/
  └── route.ts
```

### Validation Method

Each endpoint validates:
- HTTP 200 status code
- JSON response format
- `ok` field present and `true`
- `variant` field present and equals `"107173471"`
- No extra fields in response
- Content-Type header is `application/json`

---

## Test Strategy

### Unit Tests

Each endpoint's unit test directly imports and calls the GET handler:

```typescript
import { GET } from '@/app/api/healthz-smoke-107173471-a/route'

test('returns 200 with correct JSON', async () => {
  const res = await GET()
  const json = await res.json()
  expect(res.status).toBe(200)
  expect(json).toEqual({ ok: true, variant: '107173471' })
})
```

**Test Files:**
- `src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts`

### E2E Tests

Playwright tests verify all three endpoints through HTTP:

```typescript
import { test, expect } from '@playwright/test'

test('GET /api/healthz-smoke-107173471-a returns 200', async ({ request }) => {
  const response = await request.get('/api/healthz-smoke-107173471-a')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toEqual({ ok: true, variant: '107173471' })
})
```

**Test File:**
- `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts`

### CI/CD Pipeline

The sprint includes two test phases:

1. **Test Harness Phase** (`npm run test`)
   - Vitest runs all unit tests including the three new endpoints
   - Tests verify status codes, JSON structure, headers
   - All tests must pass, 0 failures

2. **E2E Phase** (`npm run e2e`)
   - Playwright launches the built app (production build)
   - Verifies all three endpoints respond correctly via HTTP
   - Tests include content-type validation and performance baseline
   - All tests must pass, 0 failures

---

## Per-Ticket Decomposition

### Epic: VRTX-0569 — Three independent smoke test endpoints (107173471)
- **Scope:** Overall feature coordination
- **Depends On:** None
- **Blocks:** All STORYs in this sprint

### Story: VRTX-0570 — Implement three endpoint variants (107173471)
- **Scope:** The three production endpoint implementations
- **Depends On:** VRTX-0569
- **Contains:** VRTX-0571 (endpoint -a), VRTX-0572 (endpoint -b), VRTX-0573 (endpoint -c)

### Story: VRTX-0576 — Test infrastructure and verification (107173471)
- **Scope:** Unit test harness and E2E tests
- **Depends On:** VRTX-0571, VRTX-0572, VRTX-0573 (all endpoints must exist)
- **Contains:** VRTX-0577 (unit tests), VRTX-0578 (E2E tests)

### Task: VRTX-0571 — Implement /api/healthz-smoke-107173471-a
- **Implementation:** Single route handler at `src/app/api/healthz-smoke-107173471-a/route.ts`
- **Files owned:** `src/app/api/healthz-smoke-107173471-a/`
- **Size:** ~10 lines of code
- **No dependencies** on other tasks in this sprint
- **Parent:** VRTX-0570

### Task: VRTX-0572 — Implement /api/healthz-smoke-107173471-b
- **Implementation:** Single route handler at `src/app/api/healthz-smoke-107173471-b/route.ts`
- **Files owned:** `src/app/api/healthz-smoke-107173471-b/`
- **Size:** ~10 lines of code
- **No dependencies** on other tasks in this sprint
- **Parent:** VRTX-0570

### Task: VRTX-0573 — Implement /api/healthz-smoke-107173471-c
- **Implementation:** Single route handler at `src/app/api/healthz-smoke-107173471-c/route.ts`
- **Files owned:** `src/app/api/healthz-smoke-107173471-c/`
- **Size:** ~10 lines of code
- **No dependencies** on other tasks in this sprint
- **Parent:** VRTX-0570

### Task: VRTX-0577 — Unit tests for all three endpoints
- **Implementation:** Vitest regression test file
- **Files owned:** `src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts`
- **Size:** ~80 lines
- **Depends On:** VRTX-0571, VRTX-0572, VRTX-0573
- **Parent:** VRTX-0576

### Task: VRTX-0578 — E2E tests for all three endpoints
- **Implementation:** Playwright test file
- **Files owned:** `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts`
- **Size:** ~100 lines
- **Depends On:** VRTX-0571, VRTX-0572, VRTX-0573
- **Parent:** VRTX-0576

---

## Documentation Updates

### Root Documentation (Target State)

**No changes required** to the platform documentation. These endpoints are self-contained smoke tests with no impact on:
- Product features or capabilities (`PRODUCT.md`)
- Architecture or data model (`ARCHITECTURE.md`)
- Design system or UI (`DESIGN.md`)
- Agent/developer guidance (`AGENT.md`)

The health check endpoints are a platform operations concern, not a product or architecture concern. They are documented implicitly by their existence in the codebase.

---

## Acceptance Criteria

✅ **Planning Phase (This Document)**
- SPRINT-PLAN.md created with full implementation strategy
- Per-task PLAN.md files created for all TASKs
- FSM tickets created: 1 EPIC + 2 STORYs + 5 TASKs
- Sprint plan checklist passes with no blockers

✅ **Execution Phase (TASKs VRTX-0571, VRTX-0572, VRTX-0573)**
- Each endpoint implemented as independent route handler
- Each handler returns `{"ok": true, "variant": "107173471"}` with HTTP 200
- No shared code between endpoints
- Each can be worked on and tested independently

✅ **Test Harness Phase (TASKs VRTX-0577, VRTX-0578)**
- Unit test file created with ≥6 test cases
- E2E test file created with ≥6 test cases
- All tests pass: `npm run test` and `npm run e2e`
- Tests verify status, JSON structure, content-type, performance

✅ **Integration Phase**
- All TASKs committed to ticket branches
- No file conflicts between parallel TASKs
- CI pipeline passes all tests
- Sprint ready for integration

---

## Parallel Work Strategy

Since the three endpoints are completely independent, they can be worked on in parallel:

| Task | File | Status |
|------|------|--------|
| VRTX-0571 | `src/app/api/healthz-smoke-107173471-a/route.ts` | 🟢 No conflicts |
| VRTX-0572 | `src/app/api/healthz-smoke-107173471-b/route.ts` | 🟢 No conflicts |
| VRTX-0573 | `src/app/api/healthz-smoke-107173471-c/route.ts` | 🟢 No conflicts |
| VRTX-0577 | `src/__tests__/regression/vrtx-0575-*.test.ts` | 🟢 After endpoints |
| VRTX-0578 | `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts` | 🟢 After endpoints |

---

## Risk Analysis

### Low Risk
- Pattern is established and proven (many similar endpoints exist)
- No database, auth, or external dependencies
- Isolated to new files only (no modifications to existing code)
- Tests follow existing patterns and conventions
- Parallel work has no conflicts

### Mitigation
- Each task includes the full test file in its acceptance criteria
- CI/CD validates all tests pass before merging
- Sprint plan checklist catches any dependency issues

---

## Success Metrics

- ✅ All three endpoints return correct 200 + JSON response
- ✅ All unit tests pass: `npm run test` → 0 failures
- ✅ All E2E tests pass: `npm run e2e` → 0 failures
- ✅ No type errors: `npm run typecheck` → 0 errors
- ✅ No lint warnings: `npm run lint` → 0 warnings
- ✅ All TASKs complete within expected effort (30 min each for endpoints, 1 hour for tests)

---

## Key Decisions

No architectural decisions needed for this sprint. Implementation follows established patterns.

---

## Timeline

**Estimated effort:**
- Endpoint -a (VRTX-0571): 30 min
- Endpoint -b (VRTX-0572): 30 min
- Endpoint -c (VRTX-0573): 30 min
- Unit tests (VRTX-0577): 1 hour
- E2E tests (VRTX-0578): 1 hour
- **Total: ~3.5 hours**

---

## File Ownership Map

| File | Owner Task | Type |
|------|-----------|------|
| `src/app/api/healthz-smoke-107173471-a/route.ts` | VRTX-0571 | Implementation |
| `src/app/api/healthz-smoke-107173471-b/route.ts` | VRTX-0572 | Implementation |
| `src/app/api/healthz-smoke-107173471-c/route.ts` | VRTX-0573 | Implementation |
| `src/__tests__/regression/vrtx-0575-api-healthz-smoke-107173471-endpoints.test.ts` | VRTX-0577 | Unit tests |
| `e2e/healthz-smoke-endpoints-sprint-0098.spec.ts` | VRTX-0578 | E2E tests |

---

## References

- **Idea:** VST-0085
- **Previous Sprint (similar pattern):** SPRINT-0094 (endpoints 261077566, 856253589, 279760907)
- **Previous Sprint (E2E tests):** SPRINT-0092 (endpoints 509572604)
- **Existing Endpoints:** `/src/app/api/healthz-smoke-*/` (all follow same pattern)
- **Test Pattern:** `src/__tests__/regression/vrtx-0465-api-healthz-bugfix-variant-endpoints.test.ts`

---

**Plan Status:** ✅ Ready for Execution
**Date:** 2026-07-21
**Version:** 1.0
