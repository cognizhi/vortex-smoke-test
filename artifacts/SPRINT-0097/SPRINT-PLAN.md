# SPRINT-0097 Plan: Three Independent Smoke Test Endpoints (661868846)

**Sprint Goal:** Add three completely independent GET HTTP endpoints (`/healthz-smoke-661868846-a`, `/healthz-smoke-661868846-b`, `/healthz-smoke-661868846-c`) to extend the platform's deployment verification system. Each endpoint returns `{ ok: true, variant: "661868846" }` with zero dependencies (no database, auth, or external calls), enabling operations teams to verify the 661868846 variant is deployed and reachable in production.

**Idea:** [VST-0084](smoke-178460727938385) — 3 independent endpoints (661868846)

**Planning Date:** 2026-07-21  
**Sprint Duration:** 1 week (typical for variant endpoints)

---

## Product Value

- **Operations visibility:** Enables load balancers and monitoring systems to verify that the 661868846 variant is deployed and reachable in production
- **Distributed deployment support:** Three independent endpoints allow parallel smoke test verification across multiple deployment nodes
- **Canary deployment readiness:** Supports A/B testing and canary deployment strategies by exposing variant identity without requiring shared state
- **Continued capability expansion:** Extends the established pattern of deployment verification endpoints (variants 85511011, 28611693, 453353908, 992377535, 96685, 276127630, 1065487472, 637917955, 121996100, 1012136249, 53261999, 509572604, 929192825, and others)

---

## Scope & Constraints

**In Scope:**
- Three independent GET endpoints, each fully standalone
- HTTP 200 response with `{ ok: true, variant: "661868846" }` JSON body
- Vitest unit tests per endpoint
- Playwright E2E tests validating all three endpoints
- No shared code between endpoints
- Documentation updates (PRODUCT.md, ARCHITECTURE.md)

**Out of Scope:**
- Authentication, database access, or external service calls
- Shared helper functions or middleware
- Response envelope changes (maintains platform's standard response pattern)

**Constraints:**
- Target response time < 10ms per endpoint (stateless, no I/O)
- No breaking changes to existing endpoints
- All tests must pass before merge
- Must follow established file structure: `/api/healthz-smoke-661868846-{a,b,c}/route.ts`

---

## Decomposition

### EPIC-1: Three Independent Smoke Test Variant Endpoints (661868846)

One epic encapsulating all three parallel endpoints, emphasizing that they are independent units of work with no shared code or cross-dependencies.

#### STORY-1: Three Independent Endpoints

A single story capturing the parallel nature of the work:
- All three endpoints follow the same pattern
- No dependencies between them
- Can be built concurrently by separate team members
- Each endpoint is a leaf unit of work (TASK)

**Tasks Under This Story:**
1. **TASK-1 (VRTX-xxxx):** Implement endpoint A (`/healthz-smoke-661868846-a`) with unit and E2E tests
2. **TASK-2 (VRTX-xxxx):** Implement endpoint B (`/healthz-smoke-661868846-b`) with unit and E2E tests
3. **TASK-3 (VRTX-xxxx):** Implement endpoint C (`/healthz-smoke-661868846-c`) with unit and E2E tests

---

## Sprint Phases

The sprint is decomposed into a sequential planning and parallel execution model:

### Phase 1: Implementation (Parallel)

**Tickets:**
- TASK-1: Implement `/api/healthz-smoke-661868846-a` endpoint
- TASK-2: Implement `/api/healthz-smoke-661868846-b` endpoint
- TASK-3: Implement `/api/healthz-smoke-661868846-c` endpoint

**Acceptance Criteria (for each task):**
- ✓ Endpoint is registered at the correct route
- ✓ GET request returns HTTP 200
- ✓ Response body is valid JSON: `{ ok: true, variant: "661868846" }`
- ✓ Content-Type header is application/json
- ✓ No shared code with other endpoints (each is independent)
- ✓ Unit tests pass (Vitest)
- ✓ E2E test passes (Playwright)

### Phase 2: Test Harness (Sequential, Depends On: Phase 1)

**Ticket:**
- TASK-4: Integrate all three endpoints into test suite and CI pipeline

**Acceptance Criteria:**
- ✓ Vitest unit tests created for each endpoint (3 test files, one per endpoint)
- ✓ Playwright E2E test created validating all three endpoints respond correctly
- ✓ Tests run in CI/CD pipeline successfully
- ✓ 100% code coverage for all three endpoints

### Phase 3: Documentation (Sequential, Depends On: Phase 1)

**Ticket:**
- TASK-5: Update root documentation with new variant endpoints

**Acceptance Criteria:**
- ✓ PRODUCT.md updated with 661868846 variant in the health check endpoints inventory
- ✓ ARCHITECTURE.md updated with SPRINT-0097 changelog entry
- ✓ All documentation changes committed and reviewed
- ✓ Changelog entry summarizes product value and implementation approach

### Phase 4: CI & Verification (Sequential, Depends On: Phase 2, Phase 3)

**Ticket:**
- TASK-6: Final CI validation and deployment readiness

**Acceptance Criteria:**
- ✓ All linting rules pass (eslint --max-warnings 0)
- ✓ TypeScript strict checks pass (tsc --noEmit)
- ✓ All tests pass (npm run test:coverage)
- ✓ E2E tests run and pass (playwright test)
- ✓ Build completes successfully (npm run build)
- ✓ No runtime warnings or errors

---

## File Ownership Map

### Implementation Files (TASK-1, TASK-2, TASK-3)

```
src/app/api/healthz-smoke-661868846-a/
├── route.ts                    ← TASK-1 (endpoint implementation)
└── __tests__/
    └── route.test.ts           ← TASK-1 (unit tests)

src/app/api/healthz-smoke-661868846-b/
├── route.ts                    ← TASK-2 (endpoint implementation)
└── __tests__/
    └── route.test.ts           ← TASK-2 (unit tests)

src/app/api/healthz-smoke-661868846-c/
├── route.ts                    ← TASK-3 (endpoint implementation)
└── __tests__/
    └── route.test.ts           ← TASK-3 (unit tests)
```

### Test Harness Files (TASK-4)

```
e2e/
└── healthz-smoke-endpoints-sprint-0097.spec.ts  ← TASK-4 (E2E tests for all 3 endpoints)

src/__tests__/
└── regression/
    └── vrtx-0xxx-healthz-smoke-661868846.test.ts ← TASK-4 (regression coverage if needed)
```

### Documentation Files (TASK-5)

```
PRODUCT.md            ← TASK-5 (health check endpoints section + changelog)
ARCHITECTURE.md       ← TASK-5 (changelog entry only)
```

---

## Testing Strategy

### Unit Tests (Vitest)
- **Per endpoint:** one test file (`src/app/api/healthz-smoke-661868846-{a,b,c}/__tests__/route.test.ts`)
- **Coverage:** HTTP status (200), JSON structure, field types, Content-Type header
- **Pattern:** Mock NextRequest/NextResponse, call GET() handler, assert response

### E2E Tests (Playwright)
- **File:** `e2e/healthz-smoke-endpoints-sprint-0097.spec.ts`
- **Coverage:** Full HTTP requests to all three endpoints, verify response status and body
- **Pattern:** Test each endpoint independently; optionally test in parallel to verify response times

### Regression Testing
- All existing health check endpoints remain unmodified and functional
- No breaking changes to platform's API shape

---

## Interface Contracts

### Endpoint: GET /api/healthz-smoke-661868846-a

**Request:**
```
GET /api/healthz-smoke-661868846-a HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "661868846"
}
```

**Headers:**
- `Content-Type: application/json; charset=utf-8`
- `Status: 200`

### Endpoint: GET /api/healthz-smoke-661868846-b

Same as endpoint A (fully independent implementation).

### Endpoint: GET /api/healthz-smoke-661868846-c

Same as endpoint A (fully independent implementation).

---

## Implementation Notes

### Pattern Established by Prior Sprints

This sprint follows the proven pattern from SPRINT-0092 (509572604), SPRINT-0088 (53261999), SPRINT-0073 (121996100), SPRINT-0070 (1012136249), SPRINT-0069 (276127630), and others:

1. **Three separate route files** — `/api/healthz-smoke-{variant}-{a,b,c}/route.ts`
2. **Hardcoded variant identifier** — no runtime configuration or env vars needed
3. **Stateless implementation** — no database, no cache, no external I/O
4. **Standard NextResponse pattern** — `NextResponse.json({ ok: true, variant })` with status 200
5. **Comprehensive test coverage** — both unit and E2E tests
6. **No shared code** — each endpoint is a standalone module

### Code Quality Expectations

- **TypeScript:** Strict mode, no `any` without justification
- **Linting:** Zero warnings (eslint --max-warnings 0)
- **Testing:** Target 100% code coverage (trivial endpoints have no branching logic)
- **Commits:** Clear, descriptive messages; logical grouping of related changes

---

## Risk Assessment

**Low Risk:**
- Additive, isolated GET endpoints with no side effects
- No state mutation, no database writes
- No authentication or authorization required
- Existing functionality completely untouched
- Proven pattern from 20+ prior variant endpoint sprints

**Mitigation:**
- Unit tests verify request/response contract before merge
- E2E tests confirm endpoints are reachable via HTTP
- CI pipeline validates linting, typecheck, and build before deployment

---

## Success Criteria

### Sprint Success
- ✓ All three endpoints are deployed and reachable in production at `/api/healthz-smoke-661868846-{a,b,c}`
- ✓ Each endpoint responds with HTTP 200 and correct JSON body
- ✓ All tests pass locally and in CI
- ✓ No regressions to existing endpoints
- ✓ Documentation is current and accurate

### Quality Metrics
- ✓ 100% code coverage for new endpoints (trivial implementations)
- ✓ Zero ESLint warnings or errors
- ✓ Zero TypeScript errors (strict mode)
- ✓ E2E test response time < 100ms per endpoint (typical < 10ms)
- ✓ Build size impact negligible (three tiny route handlers)

---

## Related Sprints & References

**Similar Recent Sprints:**
- SPRINT-0093 (929192825) — Three endpoints, parallel implementation
- SPRINT-0092 (509572604) — Three endpoints with Playwright E2E tests
- SPRINT-0088 (53261999) — Three endpoints with full test coverage
- SPRINT-0073 (121996100) — Three endpoints established pattern

**Documentation:**
- PRODUCT.md (section 8: Operations & monitoring → Variant smoke test endpoints)
- ARCHITECTURE.md (Key Decisions, Changelog)

---

## Timeline Estimate

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|---|
| Implementation | TASK-1, TASK-2, TASK-3 | 1-2 days | None (parallel) |
| Test Harness | TASK-4 | 1 day | Implementation complete |
| Documentation | TASK-5 | 0.5 day | Implementation complete |
| CI & Verification | TASK-6 | 0.5 day | All prior phases |
| **Total** | 6 tasks | **3-4 days** | Sequential phases |

---

## Notes

1. **Parallel Execution:** TASK-1, TASK-2, TASK-3 can be executed concurrently by separate team members since they do not share any files or dependencies.
2. **No Over-Decomposition:** Each task is a minimal, self-contained unit; no artificial sub-tasks.
3. **Minimum Viable Backlog:** Only essential work is included (endpoints, tests, docs). No extra phases or tickets.
4. **Documentation as-built:** Root docs (PRODUCT.md, ARCHITECTURE.md) are updated holistically as part of TASK-5, not in separate spec or design documents.
