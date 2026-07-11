# SPRINT-0054 Plan: Variant smoke test endpoint (85511011)

**Sprint goal:** Add variant-specific health check endpoint `/api/healthz-smoke-85511011` for deployment verification and monitoring.

**Scope:** One simple, self-contained endpoint with comprehensive test coverage, integrated into the CI/build pipeline.

---

## 1. Overview

This sprint continues the established pattern of variant-specific health check endpoints for deployment verification and A/B testing scenarios. The variant `85511011` is a new monitoring identifier for operations teams to verify specific application builds are deployed and reachable in production.

**Product value:**
- Operations teams can verify variant 85511011 is deployed and reachable in production
- Supports distributed deployment scenarios and smoke test verification
- Enables comprehensive monitoring of variant-specific application builds
- Extends the existing health check infrastructure with zero additional infrastructure cost

**Technical scope:**
- Implement GET `/api/healthz-smoke-85511011` returning `{ ok: true, variant: "85511011" }`
- Add comprehensive test coverage (14 tests)
- Zero dependencies (no database, auth, external calls)
- Target response time < 100ms (typical < 10ms)
- Public endpoint (no authentication required)

---

## 2. Phases

### Phase 1: Implementation (TASK-001)
**Duration estimate:** 30 minutes

**Deliverables:**
- New route file: `src/app/api/healthz-smoke-85511011/route.ts`
- Follows the established pattern from existing variant endpoints
- Minimal implementation (20–30 lines of code)
- Full JSDoc documentation with response contract
- No environment variables or dependencies

**Key decisions:**
- Copy established pattern from `/api/healthz-smoke-110428092/route.ts`
- Hardcoded variant identifier (`"85511011"`) for deployment verification
- Response format: `{ ok: true, variant: "85511011" }` (consistent with recent variants)
- HTTP 200 status code for all responses (no error cases)

**Definition of done:**
- Route handler is implemented and exports async `GET()` function
- Returns `NextResponse.json({ ok: true, variant: "85511011" }, { status: 200 })`
- JSDoc block documents the endpoint, response contract, and use case
- No TypeScript errors or linting warnings (npm run typecheck, npm run lint pass)
- Code is committed on the ticket branch

### Phase 2: Test Harness (TASK-002)
**Duration estimate:** 45 minutes

**Deliverables:**
- New test file: `src/app/api/healthz-smoke-85511011/__tests__/route.test.ts`
- 14 comprehensive test cases covering:
  - HTTP status and response body (4 tests)
  - Field type safety (2 tests)
  - HTTP headers and meta (2 tests)
  - Performance (3 tests)
  - Public access and consistency (3 tests)
- All tests pass with 100% coverage of the endpoint handler
- Performance assertions: typical < 10ms, max < 100ms

**Key testing dimensions:**
1. **Correctness** — HTTP 200, exact JSON shape `{ ok: true, variant: "85511011" }`
2. **Type safety** — `ok` is boolean, `variant` is string (not number)
3. **Performance** — single call < 100ms, under load (50 concurrent) all within 100ms
4. **Consistency** — identical response across sequential calls
5. **Public access** — no authentication required, self-contained

**Definition of done:**
- All 14 tests in `route.test.ts` pass locally (npm run test)
- Test file is discoverable by Vitest and runs in node environment (per vitest.config.ts)
- Test coverage for GET handler is 100%
- No test warnings or linting errors
- Code is committed on the ticket branch

### Phase 3: CI/Build Verification (TASK-003)
**Duration estimate:** 20 minutes

**Deliverables:**
- Verify new endpoint is included in the production build
- ESLint and TypeScript checks pass with zero warnings
- Tests execute successfully in CI environment
- No regressions in other health check endpoints

**CI pipeline verification:**
- `npm run typecheck` — zero errors, new route is type-safe
- `npm run lint` — zero warnings, code follows ESLint config
- `npm run test` — all tests pass including new 14-test suite
- `npm run build` — production build succeeds, endpoint is bundled
- Docker build (if applicable) — multi-stage build succeeds

**Definition of done:**
- All npm scripts pass locally (typecheck, lint, test, build)
- CI workflow confirms all checks pass on the ticket branch
- No regressions in existing health check endpoints
- Code is committed and pushed to the ticket branch

### Phase 4: Documentation Update
**Duration estimate:** 15 minutes

**Deliverables (root documents):**
- **PRODUCT.md** — Add variant 85511011 to the health check endpoints inventory in the "Operations & monitoring" section
- **ARCHITECTURE.md** — Add variant 85511011 to the health check endpoints section and update the inventory list; add dated changelog entry
- **DESIGN.md** — Add dated changelog entry (if applicable)
- **AGENT.md** — Review and update if needed (minimal change expected)

**Key changes:**
- Inventory of deployed variants now includes `85511011` (SPRINT-0054)
- Health check documentation remains consistent across all root docs
- Changelogs in each document are updated with a dated entry for SPRINT-0054

**Definition of done:**
- PRODUCT.md documents the new variant endpoint in operations section
- ARCHITECTURE.md includes variant 85511011 in the health check inventory
- All root docs have dated changelog entries for SPRINT-0054
- Docs are committed on the ticket branch

---

## 3. Acceptance Criteria (Sprint-level)

- ✅ Endpoint `/api/healthz-smoke-85511011` is implemented and returns `{ ok: true, variant: "85511011" }` with HTTP 200
- ✅ 14 comprehensive tests pass locally and in CI
- ✅ All npm scripts pass: typecheck, lint, test, build
- ✅ No regressions in existing health check endpoints
- ✅ Root docs (PRODUCT.md, ARCHITECTURE.md, DESIGN.md, AGENT.md) are updated with dated changelog entries
- ✅ All code is committed on ticket branch; sprint plan checklist passes

---

## 4. Architecture & Design Decisions

### Endpoint Response Format
The variant endpoints have evolved over time. This sprint follows the **latest established pattern** (SPRINT-0050+):
- Response format: `{ ok: true, variant: "85511011" }`
- No outer envelope (unlike the base `/api/healthz-smoke` which uses `{ data: { ok: true }, error: null }`)
- Hardcoded variant identifier for deployment verification

### No Configuration or Feature Flags
- Variant identifier is hardcoded, not configurable
- No environment variables or runtime config
- Simplifies deployment and ensures deterministic behavior

### Performance Targets
- Target response time: < 100ms
- Typical response time: < 10ms
- Design is zero-dependency to minimize latency

### Testing Strategy
- Comprehensive unit test suite with 14 tests
- Tests cover correctness, type safety, performance, public access, and consistency
- Performance tests use realistic loads (50 concurrent calls)
- All tests are deterministic and require no external dependencies

---

## 5. Related Documentation

- **PRODUCT.md** — Product-level description of health check endpoints and their value
- **ARCHITECTURE.md** — Technical details of health check endpoint implementation
- **DESIGN.md** — Visual design (not applicable to health endpoints)
- **CLAUDE.md** — Project conventions and architecture essentials
- **Previous variant sprints** — SPRINT-0053 (28611693), SPRINT-0052 (432732268, 407985318), SPRINT-0051 (453353908)

---

## 6. Known Constraints & Assumptions

1. **No database access** — health check must not query the database
2. **No authentication** — endpoint is public, no auth guards
3. **No external dependencies** — no third-party API calls, Redis, or infrastructure dependencies
4. **Single responsibility** — endpoint does one thing: return health status with variant ID
5. **Deployment verification** — variant ID is hardcoded and verified at build/deploy time via DNS or monitoring systems

---

## 7. Success Criteria

- Production build includes the new endpoint
- Operations teams can reach `/api/healthz-smoke-85511011` in production and receive the correct response
- Monitoring systems can verify variant 85511011 is deployed
- No performance degradation to other endpoints
- Zero security findings (public endpoint, no auth, no external calls)
