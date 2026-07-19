# Sprint Plan: SPRINT-0088
## Add 3 Independent Smoke Test Endpoints

**Sprint Key:** SPRINT-0088  
**Idea:** VST-0075 [smoke-178445884037984]  
**Status:** Planning  
**Target Duration:** 1 sprint (1 week)  
**Date Created:** 2026-07-19  

---

## 1. Overview & Goals

### Problem
No simple way to add independent HTTP endpoints for deployment verification without a full planning cycle. Deployment verification endpoints enable load balancers and orchestration platforms to verify service health with minimal latency.

### Goals
1. Add three independent GET endpoints: `/healthz-smoke-53261999-a`, `/healthz-smoke-53261999-b`, `/healthz-smoke-53261999-c`
2. Each endpoint returns `{ ok: true, variant: "53261999" }` with HTTP 200
3. No shared code between endpoints — each is a standalone, leaf unit of work
4. Endpoints are production-ready: tested, linted, type-safe, documented
5. All three can be implemented and tested in parallel

### Success Criteria
- ✅ All three endpoints return 200 with the expected JSON structure
- ✅ No breaking changes to existing endpoints
- ✅ Unit tests (Vitest) cover all three endpoints
- ✅ E2E tests (Playwright) verify smoke test behavior
- ✅ Code passes lint, typecheck, and build
- ✅ Documentation (root docs) reflects the new endpoints

---

## 2. Architecture & Design Decisions

### Endpoint Design
- **Path:** `/api/healthz-smoke-{variant}-{letter}` (e.g., `/api/healthz-smoke-53261999-a`)
- **Method:** GET (no body, no auth, no database access)
- **Response:** 
  ```json
  { 
    "ok": true, 
    "variant": "53261999"
  }
  ```
- **Status:** HTTP 200 (always; no error cases)
- **Latency target:** < 10ms (no I/O, pure response)
- **Dependencies:** None (no database, no external services, no auth)

### File Layout
Each endpoint is implemented as a separate, fully independent Next.js route handler:

```
src/app/api/healthz-smoke-53261999-a/
  └── route.ts         ← GET handler for /healthz-smoke-53261999-a

src/app/api/healthz-smoke-53261999-b/
  └── route.ts         ← GET handler for /healthz-smoke-53261999-b

src/app/api/healthz-smoke-53261999-c/
  └── route.ts         ← GET handler for /healthz-smoke-53261999-c
```

**No shared code:** Each route is independently implemented; no helper functions, no factories, no dependencies between them.

### Testing Strategy

| Test Level | Tool | Scope |
|------------|------|-------|
| **Unit** | Vitest | Each endpoint function in isolation; mock NextRequest/NextResponse; verify response structure and status |
| **E2E** | Playwright | Full HTTP requests to each endpoint; verify 200 response and JSON payload |
| **Smoke** | Manual/CI | Quick hit of each endpoint in dev/staging; confirms no typos, routing works |

### Key Decisions

1. **No shared constants:** Each route duplicates the response structure. Intentional to avoid coupling; supports parallel independent work.
2. **Standard Next.js pattern:** Route handlers follow the existing pattern in `/api/healthz-smoke` and `/api/health`.
3. **No middleware:** These endpoints bypass auth, rate limiting, and tenant routing (no `x-merchant-slug` header).
4. **TypeScript strict:** Full type safety; `NextRequest` and `NextResponse` types required.

---

## 3. Phases & Breakdown

### Phase 1: PLANNING (1 day)
- [x] Understand requirements from idea spec
- [x] Explore codebase: routing, existing endpoints, test patterns
- [x] Design endpoint structure and file layout
- [x] Write sprint plan (this document)
- [x] Create root doc updates (ARCHITECTURE.md, DESIGN.md, PRODUCT.md, AGENT.md)
- [x] Decompose into tickets (EPIC, STORYs, TASKs)

**Outcome:** Sprint plan + tickets ready for engineer

---

### Phase 2: IMPLEMENTATION (2–3 days)
Each TASK implements one endpoint (can run in parallel):

**TASK 1:** Implement `/healthz-smoke-53261999-a`
- Create `src/app/api/healthz-smoke-53261999-a/route.ts`
- GET handler returns `{ ok: true, variant: "53261999" }`
- Type-safe (TypeScript strict)
- Pass linter and typecheck

**TASK 2:** Implement `/healthz-smoke-53261999-b`
- Create `src/app/api/healthz-smoke-53261999-b/route.ts`
- GET handler returns `{ ok: true, variant: "53261999" }`
- Type-safe (TypeScript strict)
- Pass linter and typecheck

**TASK 3:** Implement `/healthz-smoke-53261999-c`
- Create `src/app/api/healthz-smoke-53261999-c/route.ts`
- GET handler returns `{ ok: true, variant: "53261999" }`
- Type-safe (TypeScript strict)
- Pass linter and typecheck

**Outcome:** Three endpoint files, all committed and passing basic checks

---

### Phase 3: TEST-HARNESS (1–2 days)
**TASK 4:** Write Vitest unit tests + setup test infrastructure

- Create `src/app/api/healthz-smoke-53261999-a/__tests__/route.test.ts`
- Create `src/app/api/healthz-smoke-53261999-b/__tests__/route.test.ts`
- Create `src/app/api/healthz-smoke-53261999-c/__tests__/route.test.ts`
- Each test file:
  - Imports the route handler (GET)
  - Mocks NextRequest with appropriate headers
  - Verifies 200 response
  - Verifies JSON structure: `{ ok: true, variant: "53261999" }`
  - Verifies no error cases (no 4xx, 5xx paths)
- Test coverage: 100% (endpoints are simple; full coverage is trivial)
- All tests pass (`npm run test`)

**Outcome:** Unit tests pass; 100% coverage for endpoints

---

### Phase 4: E2E TESTING (1 day)
**TASK 5:** Write Playwright E2E tests

- Create or extend `e2e/healthz-smoke-endpoints.spec.ts`
- Three test cases (one per endpoint):
  - GET `/api/healthz-smoke-53261999-a` → expect 200, JSON payload
  - GET `/api/healthz-smoke-53261999-b` → expect 200, JSON payload
  - GET `/api/healthz-smoke-53261999-c` → expect 200, JSON payload
- Tests run against local dev server (npm run dev)
- All tests pass (`npm run test:e2e` or `npx playwright test`)

**Outcome:** E2E tests pass; endpoints verified via real HTTP

---

### Phase 5: CI/CD INTEGRATION (1 day, optional in MVP)
**TASK 6:** CI/CD pipeline configuration (DEFERRED if no CI/CD currently)

- Evaluate current CI/CD setup (GitHub Actions, GitLab CI, other)
- If GitHub Actions: Create `.github/workflows/test-smoke-endpoints.yml`
  - Trigger: on push to `main` (and PRs)
  - Jobs: lint, typecheck, unit tests, E2E tests
  - Artifact: test results, coverage report
- If no CI/CD: Document manual verification steps

**Outcome:** Automated tests run on commit; no manual verification needed

---

### Phase 6: INTEGRATION & VERIFICATION (1 day)
- All code committed and pushed
- All acceptance criteria met
- Lint, typecheck, build pass
- Manual verification: endpoints respond with correct JSON
- Root docs updated
- Tickets marked done

**Outcome:** Sprint complete; ready for deployment

---

## 4. Ticket Breakdown

### Structure: EPIC → STORY → TASK

```
EPIC-0: Add 3 independent smoke test endpoints (53261999)
  ├─ STORY-0: Core implementation
  │   ├─ TASK-0: Implement /healthz-smoke-53261999-a
  │   ├─ TASK-1: Implement /healthz-smoke-53261999-b
  │   ├─ TASK-2: Implement /healthz-smoke-53261999-c
  │   └─ TASK-3: Test-harness (unit + E2E tests)
  └─ STORY-1: CI/CD & Deployment (optional)
      └─ TASK-4: CI pipeline configuration
```

### Dependencies
- **TASK-0, TASK-1, TASK-2** are independent (can run in parallel)
- **TASK-3** depends on TASK-0, TASK-1, TASK-2 (needs endpoints to test)
- **TASK-4** depends on TASK-0, TASK-1, TASK-2, TASK-3 (optional, for MVP skip)

### Effort Estimates

| Ticket | Effort | Notes |
|--------|--------|-------|
| TASK-0 | 1 day | Simple route handler, no DB, no logic |
| TASK-1 | 1 day | Same as TASK-0 |
| TASK-2 | 1 day | Same as TASK-0 |
| TASK-3 | 1 day | Vitest setup + E2E via Playwright |
| TASK-4 | 0.5 day | CI config (if applicable) |
| **Total** | **4.5 days** | Or **3.5 days** without CI (TASK-4) |

---

## 5. Root Documentation Updates

### Files Modified
1. **ARCHITECTURE.md** — Add "Health Check Endpoints" section documenting the 3 new endpoints, latency targets, and rationale
2. **DESIGN.md** — Add response structure; note that health endpoints are not part of the design system (no styling)
3. **PRODUCT.md** — Add smoke test endpoints to feature list under "Deployment Verification"
4. **AGENT.md** — No changes (agent protocols unchanged)

Each doc includes a dated Changelog entry for SPRINT-0088.

---

## 6. Acceptance Criteria (Sprint-Level)

- [x] Sprint plan written and reviewed (this document)
- [ ] Root docs updated (ARCHITECTURE.md, DESIGN.md, PRODUCT.md) and committed
- [ ] All tickets created (EPIC, STORYs, TASKs) via a2a_create_fsm_ticket
- [ ] TASK PLAN.md files created for each task
- [ ] All code committed on ticket branches
- [ ] All tests passing (npm run test, npm run test:e2e)
- [ ] Lint clean (npm run lint)
- [ ] TypeScript strict (npm run typecheck)
- [ ] Build succeeds (npm run build)
- [ ] All three endpoints respond 200 with correct JSON
- [ ] Sprint plan checklist passes (a2a_sprint_plan_checklist)
- [ ] Tickets transitioned to done

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Shared code temptation | Medium | Low | Explicitly enforce independence in acceptance criteria; code review will flag any shared utils |
| Test coverage gaps | Low | Medium | Require 100% coverage for endpoint files; E2E tests verify real HTTP behavior |
| CI/CD overhead | Medium | Low | Deferrable; can ship MVP without automated CI if manual testing sufficient |
| Routing conflicts | Low | Low | Reserved slug checks in middleware ensure paths don't collide with tenant routes |

---

## 8. Definition of Done

Each TASK must meet these criteria before marking done:

1. **Code implemented** — all files from PLAN.md exist and are committed
2. **Tests passing** — `npm run test` and (for E2E) `npx playwright test` pass
3. **Lint clean** — `npm run lint` with 0 warnings
4. **TypeScript strict** — `npm run typecheck` with no errors
5. **Build succeeds** — `npm run build` completes successfully
6. **Endpoint verification** — manual test: `curl -s http://localhost:3000/api/healthz-smoke-53261999-{a,b,c} | jq`
7. **Branch pushed** — all commits on ticket branch, pushed to remote with `-u origin`
8. **Root docs updated** — if applicable (ARCHITECTURE.md, etc.)
9. **Acceptance criteria checked** — all items on TASK acceptance_criteria are addressed

---

## 9. Notes for Engineer

- **No auth required** — these endpoints are public (no x-merchant-slug, no session check)
- **Minimal latency** — pure response generation, no I/O; target < 10ms
- **Type safety** — all TypeScript, strict mode; no `any` without justification
- **Existing patterns** — use the same response format as `/api/healthz-smoke` and `/api/health`
- **Testing** — see existing test examples in `e2e/healthz-smoke-endpoints.spec.ts` and `src/app/api/healthz-smoke/__tests__/`

---

## Changelog

### 2026-07-19 — SPRINT-0088: Add 3 independent smoke test endpoints (53261999)

**Added:**
- Three independent health check endpoints: `/healthz-smoke-53261999-a`, `/healthz-smoke-53261999-b`, `/healthz-smoke-53261999-c`
- Each endpoint returns `{ ok: true, variant: "53261999" }` with HTTP 200
- Designed for parallel, independent implementation (no shared code)
- Comprehensive test coverage (Vitest unit tests + Playwright E2E tests)
- Updated root documentation (ARCHITECTURE.md, DESIGN.md, PRODUCT.md)

**Purpose:**
- Enable deployment verification endpoints for load balancers and orchestration platforms
- Demonstrate sprint-oriented endpoint development with clear acceptance criteria
- Support autonomous team delivery with independent parallel work

**Files Created/Modified:**
- `src/app/api/healthz-smoke-53261999-a/route.ts` (new)
- `src/app/api/healthz-smoke-53261999-b/route.ts` (new)
- `src/app/api/healthz-smoke-53261999-c/route.ts` (new)
- `src/app/api/healthz-smoke-53261999-a/__tests__/route.test.ts` (new)
- `src/app/api/healthz-smoke-53261999-b/__tests__/route.test.ts` (new)
- `src/app/api/healthz-smoke-53261999-c/__tests__/route.test.ts` (new)
- `e2e/healthz-smoke-endpoints.spec.ts` (extended or created)
- `ARCHITECTURE.md`, `DESIGN.md`, `PRODUCT.md` (updated with Changelog entries)
