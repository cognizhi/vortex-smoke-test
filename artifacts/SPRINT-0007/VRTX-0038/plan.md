# QA Test Plan — SPRINT-0007: Variant smoke test endpoint (963602537)

**Ticket:** VRTX-0038  
**Sprint:** SPRINT-0007  
**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint `/api/healthz-smoke-963602537` for deployment verification.

---

## 1. Scope

This QA plan covers integration and acceptance testing for the new variant-specific health check endpoint as specified in `PRODUCT.md` and `ARCHITECTURE.md`.

**Feature:** GET `/api/healthz-smoke-963602537`

**Acceptance Criteria (from PRODUCT.md):**
- Endpoint exists and responds with HTTP 200
- Response body: `{ ok: true, variant: "963602537" }`
- Self-contained (no DB, auth, or external calls)
- Performance: response time < 100ms (typical < 10ms)
- Follows the same pattern as other variant endpoints
- No authentication required
- Comprehensive test coverage (unit tests with Vitest)

---

## 2. Test Strategy

### 2.1 Test Levels
1. **Unit Tests** — In-process endpoint testing via Vitest
   - Response status code validation
   - Response body structure and field correctness
   - Type safety verification
   - Performance metrics
   - Load simulation (50 concurrent calls)
   - Consistency under repeated calls

2. **Integration Tests** — Run the built application and verify the endpoint over HTTP
   - Endpoint responds to real HTTP requests
   - Headers are correct (Content-Type: application/json)
   - No external dependencies (DB, auth, external services)

3. **E2E Tests** — Verify the endpoint works in the running deployment
   - Smoke test passes via real HTTP calls
   - Response time meets SLA (< 100ms)

### 2.2 Test Coverage Matrix

| Dimension | Test Cases | Status |
|-----------|-----------|--------|
| **Response Status** | HTTP 200 | Unit + Integration |
| **Response Body** | `{ ok: true, variant: "963602537" }` | Unit + Integration |
| **Field Types** | `ok: boolean`, `variant: string` | Unit |
| **No Extra Fields** | Exactly 2 root keys | Unit |
| **HTTP Headers** | Content-Type: application/json | Unit + Integration |
| **Performance** | < 100ms (single call) | Unit + Integration |
| **Performance** | < 10ms (typical) | Unit |
| **Load** | 50 concurrent calls, all < 100ms | Unit |
| **Consistency** | Repeated calls return identical responses | Unit + Integration |
| **No Auth Required** | Endpoint accessible without credentials | Unit + Integration |
| **Self-Contained** | No env var lookups, no DB access | Code review + Integration |

---

## 3. Test Environment

- **Node Runtime:** Node.js ≥ 22
- **Framework:** Next.js 15 (App Router)
- **Test Framework:** Vitest (jsdom)
- **Build Process:** `npm run build`
- **Test Run:** `npm run test -- src/app/api/healthz-smoke-963602537/__tests__/route.test.ts --run`

---

## 4. Test Execution Plan

### Phase 1: Unit Tests (Vitest)
**Expected:** 14 passing tests (RH-01 through RH-14)
- HTTP status code
- Response body structure
- Field type safety
- HTTP headers
- Performance (single, typical, load)
- Public access (no auth required)
- Consistency
- Self-contained

### Phase 2: Integration Tests (HTTP)
**Expected:** Endpoint responds correctly over HTTP
- Deploy the built app
- Verify `GET /api/healthz-smoke-963602537` returns 200
- Verify response body is correct JSON
- Verify Content-Type header is `application/json`
- Verify no external dependencies

### Phase 3: Acceptance Criteria Verification
**Expected:** All acceptance criteria pass
1. ✅ Endpoint exists and responds with HTTP 200
2. ✅ Response body: `{ ok: true, variant: "963602537" }`
3. ✅ Self-contained (no DB, auth, external calls)
4. ✅ Performance: response time < 100ms (typical < 10ms)
5. ✅ Follows established pattern (matches SPRINT-0001 through SPRINT-0006)
6. ✅ Code quality (TypeScript strict, linting, type checking)
7. ✅ Comprehensive test coverage

---

## 5. Defect Criteria

**Blocker (DEFECT ticket):**
- Endpoint returns non-200 status code
- Response body does not match specification
- Response time exceeds 100ms
- Endpoint requires authentication
- Endpoint performs database queries or external calls
- Tests fail

**Non-Blocker (Rework):**
- Code style/formatting issues (will be fixed by linting)
- Minor documentation improvements

---

## 6. Success Criteria

✅ All unit tests pass (14/14)  
✅ Endpoint responds correctly over HTTP (integration)  
✅ Response time < 100ms (performance)  
✅ All acceptance criteria verified  
✅ Code quality checks pass (lint, typecheck)  
✅ No regressions in existing endpoints  

---

## 7. Artifacts to Be Produced

- `artifacts/SPRINT-0007/VRTX-0038/plan.md` (this document)
- `artifacts/SPRINT-0007/VRTX-0038/tdd-test-cases.md` (test case matrix)
- `artifacts/SPRINT-0007/VRTX-0038/tdd-test-result.md` (test execution results)
- `artifacts/SPRINT-0007/VRTX-0038/summary.md` (QA summary)
- `artifacts/SPRINT-0007/qa-test-report.md` (integration QA report for sprint)

---

## 8. Sign-off

**Prepared by:** QA / Test Agent  
**Date:** 2026-07-03  
**Status:** Ready for execution
