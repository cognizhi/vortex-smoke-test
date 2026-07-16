# VRTX-0431 Implementation Plan

**Task Title:** Test-Harness & CI Validation for smoke-test endpoints

**Sprint:** SPRINT-0073

**Epic:** VRTX-0423 — Add three independent smoke-test health check endpoints

---

## 1. Objective

Validate all three health check endpoints (`-a`, `-b`, `-c`) through comprehensive testing, type checking, linting, and build validation. This task runs after all three implementation tasks are complete and confirms the sprint is production-ready.

**Dependencies:** Requires VRTX-0423, VRTX-0424, VRTX-0425 to be done.

---

## 2. File Ownership & Module Map

**Files touched:**
```
(Read-only: No new files created by this task)

Validates:
├── src/app/api/healthz-smoke-121996100-a/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── src/app/api/healthz-smoke-121996100-b/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── src/app/api/healthz-smoke-121996100-c/
│   ├── route.ts
│   └── __tests__/route.test.ts
└── (All existing project files for regression checks)
```

**No changes made:** This is a verification task, not an implementation task. No files are created or modified.

---

## 3. Test-Harness Workflow

### 3a. Run Unit Tests

```bash
npm run test
```

**Success criteria:**
- All 45+ new tests pass (15 per endpoint)
- All existing tests continue to pass (no regressions)
- Test output shows green/passed for all test suites
- **Specific verification:**
  - `src/app/api/healthz-smoke-121996100-a/__tests__/route.test.ts` — 15 tests pass
  - `src/app/api/healthz-smoke-121996100-b/__tests__/route.test.ts` — 15 tests pass
  - `src/app/api/healthz-smoke-121996100-c/__tests__/route.test.ts` — 15 tests pass

**Coverage check:**
```bash
npm run test:coverage
```
- New endpoint code coverage > 85%
- No coverage regressions in existing code

### 3b. TypeScript Type Checking

```bash
npm run typecheck
```

**Success criteria:**
- No TypeScript errors
- No type warnings
- All new endpoint files pass strict mode checks

### 3c. ESLint Linting

```bash
npm run lint
```

**Success criteria:**
- 0 warnings (strict)
- 0 errors
- All new endpoint files pass linting
- No style or quality violations in:
  - `src/app/api/healthz-smoke-121996100-a/route.ts`
  - `src/app/api/healthz-smoke-121996100-a/__tests__/route.test.ts`
  - `src/app/api/healthz-smoke-121996100-b/route.ts`
  - `src/app/api/healthz-smoke-121996100-b/__tests__/route.test.ts`
  - `src/app/api/healthz-smoke-121996100-c/route.ts`
  - `src/app/api/healthz-smoke-121996100-c/__tests__/route.test.ts`

### 3d. Production Build

```bash
npm run build
```

**Success criteria:**
- Build completes without errors
- No build warnings related to new endpoints
- All three endpoints are bundled and reachable
- Next.js asset analysis shows no regressions

### 3e. Manual Endpoint Verification

Start the dev server and verify endpoints respond correctly:

```bash
npm run dev
```

**Test each endpoint:**
```bash
curl http://localhost:3000/api/healthz-smoke-121996100-a
curl http://localhost:3000/api/healthz-smoke-121996100-b
curl http://localhost:3000/api/healthz-smoke-121996100-c
```

**Expected response (all three endpoints):**
```json
{
  "data": {
    "ok": true,
    "variant": "121996100"
  },
  "error": null
}
```

**Verify:**
- HTTP 200 status code
- Content-Type: application/json
- Response time < 100ms
- Consistent responses across multiple calls

---

## 4. CI Pipeline (Automated)

Once all three implementation tasks are merged and this validation passes, the CI pipeline automatically runs:

1. **Tests** — Full test suite including the 45+ new endpoint tests
2. **Linting** — ESLint with 0 warnings
3. **Type Checking** — TypeScript strict mode
4. **Build** — Production build with no warnings
5. **Coverage Report** — Verify > 85% coverage for new code
6. **Deployment** — CD pipeline triggers if all checks pass

---

## 5. Definition of Done

✅ **All tests passing:**
- [ ] `npm run test` — all tests pass, 0 failures
- [ ] `npm run test:coverage` — coverage > 85% for new code
- [ ] No new test failures or regressions

✅ **Code quality:**
- [ ] `npm run typecheck` — TypeScript strict, 0 errors
- [ ] `npm run lint` — ESLint, 0 warnings, 0 errors
- [ ] All new endpoint files pass checks

✅ **Build validation:**
- [ ] `npm run build` — succeeds without errors or warnings
- [ ] Production bundle includes all three endpoints

✅ **Endpoint verification:**
- [ ] Dev server starts with `npm run dev`
- [ ] All three endpoints respond with HTTP 200
- [ ] All three endpoints return correct JSON structure
- [ ] Response times < 100ms for all endpoints
- [ ] Manual verification confirms consistency

✅ **Regression checks:**
- [ ] No existing tests fail
- [ ] No existing code broken by new endpoints
- [ ] All CI checks pass

✅ **Documentation:**
- [ ] Root docs updated with changelog entries (via VRTX-0422)
- [ ] Ticket comments record test results and any issues

---

## 6. Checklist for Test-Harness Execution

```markdown
## Pre-Test Checklist
- [ ] All three implementation tasks (VRTX-0423, -0424, -0425) are marked done
- [ ] All branches are pushed to remote
- [ ] Working directory is clean (`git status` shows no uncommitted changes)
- [ ] Branch is up-to-date with sprint branch

## Unit Test Phase
- [ ] Run `npm run test`
- [ ] All 45+ new tests pass
- [ ] No regressions in existing tests
- [ ] Test output recorded in ticket

## Coverage Phase
- [ ] Run `npm run test:coverage`
- [ ] New code coverage > 85%
- [ ] Coverage report attached to ticket comments

## Type Check Phase
- [ ] Run `npm run typecheck`
- [ ] Zero TypeScript errors
- [ ] Zero warnings
- [ ] Results recorded

## Lint Phase
- [ ] Run `npm run lint`
- [ ] Zero warnings
- [ ] Zero errors
- [ ] Results recorded

## Build Phase
- [ ] Run `npm run build`
- [ ] Build succeeds without errors
- [ ] No warnings in build output
- [ ] Build artifacts verified

## Manual Verification Phase
- [ ] Start dev server: `npm run dev`
- [ ] Endpoint A: curl /api/healthz-smoke-121996100-a
  - [ ] HTTP 200
  - [ ] Correct JSON structure
  - [ ] Variant: "121996100"
  - [ ] Response time < 100ms
- [ ] Endpoint B: curl /api/healthz-smoke-121996100-b
  - [ ] HTTP 200
  - [ ] Correct JSON structure
  - [ ] Variant: "121996100"
  - [ ] Response time < 100ms
- [ ] Endpoint C: curl /api/healthz-smoke-121996100-c
  - [ ] HTTP 200
  - [ ] Correct JSON structure
  - [ ] Variant: "121996100"
  - [ ] Response time < 100ms

## Sign-Off Phase
- [ ] All checks passed
- [ ] No blockers or issues
- [ ] Ready for merge
- [ ] Transition ticket to done
```

---

## 7. Notes

- **No code changes** — this task only validates existing work
- **Parallel execution possible** — tests can run independently
- **Idempotent** — can be run multiple times without side effects
- **Read-only** — no git commits from this task
- **Blocking** — sprint cannot proceed without this validation

This task is the **final gate** before the sprint is merged. It confirms all implementation is correct and production-ready.

