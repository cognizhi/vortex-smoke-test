# VRTX-0522: Integration & Full Suite Testing

**Epic:** VRTX-0517  
**Story:** VRTX-0518  
**Sprint:** SPRINT-0090  
**Type:** Integration & Verification Task  

---

## Overview

This task integrates the three independently developed endpoints (VRTX-0519, VRTX-0520, VRTX-0521) and performs comprehensive end-to-end testing including:

- Full unit test suite execution
- TypeScript strict mode compilation
- ESLint linting (zero warnings)
- Production build verification
- Integration tests for all three endpoints
- Regression testing (no existing endpoints broken)
- CI/CD pipeline smoke test

**Dependencies:** This task is blocked until VRTX-0519, VRTX-0520, and VRTX-0521 are complete.

---

## Acceptance Criteria (Definition of Done)

### Testing & Verification
- [ ] All three endpoints' unit tests pass: `npm run test`
- [ ] Specific endpoint tests pass:
  - `npm run test -- healthz-smoke-733116439-a`
  - `npm run test -- healthz-smoke-733116439-b`
  - `npm run test -- healthz-smoke-733116439-c`
- [ ] Full test suite passes with > 50 test cases total (15+ per endpoint)
- [ ] No test flakiness on repeated runs (run suite 3× to verify)

### Code Quality
- [ ] TypeScript strict mode passes: `npm run typecheck` (zero errors)
- [ ] ESLint passes: `npm run lint` (zero warnings on new files and entire suite)
- [ ] No new TypeScript `any` types introduced
- [ ] No unused imports or variables

### Build & Integration
- [ ] Production build succeeds: `npm run build` (< 30s)
- [ ] Build output includes all three endpoints
- [ ] No build warnings or errors related to new code
- [ ] Bundle size increase is negligible (< 2KB per endpoint)

### Runtime Verification
- [ ] All three endpoints respond correctly in dev server
- [ ] All three endpoints respond correctly in production build
- [ ] No console errors or warnings in browser DevTools
- [ ] No errors in Next.js server logs

### Regression Testing
- [ ] Existing `/api/health` endpoint still works
- [ ] Existing `/api/healthz-smoke` endpoint still works
- [ ] Existing `/api/healthz-smoke-1012136249-*` endpoints still work
- [ ] All existing admin endpoints still work
- [ ] All existing booking endpoints still work

### Integration Tests
- [ ] All three endpoints can be called concurrently without interference
- [ ] No shared state or side effects between endpoints
- [ ] Response format is identical across all three endpoints
- [ ] Performance is consistent across all three endpoints

### CI/CD Pipeline
- [ ] Lint job passes
- [ ] Type check job passes
- [ ] Test job passes
- [ ] Build job passes
- [ ] All jobs complete within SLA (< 60s total)

---

## Implementation Guide

### Phase 1: Full Test Suite Execution

```bash
# Run complete test suite
npm run test

# Expected output:
# - All VRTX-0519 tests pass (15+ tests)
# - All VRTX-0520 tests pass (15+ tests)
# - All VRTX-0521 tests pass (15+ tests)
# - Total: 50+ tests passing
# - No failing tests
# - < 5s execution time
```

**Verification:**
- Run 3× to confirm no flakiness
- Verify each endpoint's 15 tests pass in isolation:
  ```bash
  npm run test -- healthz-smoke-733116439-a
  npm run test -- healthz-smoke-733116439-b
  npm run test -- healthz-smoke-733116439-c
  ```

### Phase 2: Type Checking

```bash
# Verify TypeScript strict mode
npm run typecheck

# Expected output:
# - Zero errors
# - No type warnings
# - All new files compile cleanly
```

**What to verify:**
- No `any` types in new endpoint files
- Return types correctly annotated
- No type mismatches in route handlers
- No unused type definitions

### Phase 3: Linting

```bash
# Run ESLint on all files
npm run lint

# Expected output:
# - Zero warnings
# - Zero errors
# - New files pass all rules
```

**What to verify:**
- No unused imports or variables
- No console statements (except intentional)
- No commented-out code
- Consistent code style (quotes, spacing, semicolons)
- No max-line-length violations

### Phase 4: Production Build

```bash
# Build for production
npm run build

# Expected output:
# - Successful build (exit code 0)
# - No build errors
# - No build warnings
# - Output includes all three endpoints
# - Build completes in < 30s
```

**What to verify:**
- Build output size reasonable
- No tree-shaking surprises (endpoints included in bundle)
- Next.js pre-renders/compiles all routes correctly
- No missing dependencies

### Phase 5: Integration Testing

#### 5.1 Dev Server Runtime Test

```bash
# Start dev server
npm run dev

# Test each endpoint in another terminal:
curl http://localhost:3000/api/healthz-smoke-733116439-a
# Expected: {"ok":true,"variant":"733116439"}

curl http://localhost:3000/api/healthz-smoke-733116439-b
# Expected: {"ok":true,"variant":"733116439"}

curl http://localhost:3000/api/healthz-smoke-733116439-c
# Expected: {"ok":true,"variant":"733116439"}

# Test concurrent calls:
seq 1 10 | xargs -P 10 -I {} curl http://localhost:3000/api/healthz-smoke-733116439-a
# All should return 200 with correct JSON
```

**Verification:**
- All three endpoints respond immediately
- No errors in dev server logs
- No errors in browser console
- Concurrent calls don't interfere with each other

#### 5.2 Production Build Runtime Test

```bash
# Build and start production server
npm run build
npm run start

# Test each endpoint:
curl http://localhost:3000/api/healthz-smoke-733116439-a
curl http://localhost:3000/api/healthz-smoke-733116439-b
curl http://localhost:3000/api/healthz-smoke-733116439-c
# All should return 200 with correct JSON
```

**Verification:**
- Endpoints work in production build
- Response time acceptable (< 100ms)
- No errors in production logs

### Phase 6: Regression Testing

```bash
# Test existing endpoints still work:

# Health check endpoint
curl http://localhost:3000/api/health

# Generic healthz-smoke endpoint
curl http://localhost:3000/api/healthz-smoke

# Existing healthz-smoke variants
curl http://localhost:3000/api/healthz-smoke-1012136249-a
curl http://localhost:3000/api/healthz-smoke-1012136249-b
curl http://localhost:3000/api/healthz-smoke-1012136249-c

# Sample admin endpoint (if running locally)
# curl http://localhost:3000/api/admin/bookings -H "x-merchant-slug: test"
```

**Verification:**
- All existing endpoints still respond with 200
- No changes to existing response formats
- No new errors introduced

### Phase 7: CI/CD Simulation

```bash
# Simulate CI/CD pipeline locally:

# 1. Lint
npm run lint
# Expected: exit code 0, zero warnings

# 2. Type check
npm run typecheck
# Expected: exit code 0, zero errors

# 3. Test
npm run test
# Expected: exit code 0, all tests pass

# 4. Build
npm run build
# Expected: exit code 0, successful build
```

**Timing:**
- Total time should be < 60s
- Lint: < 10s
- TypeCheck: < 15s
- Test: < 5s
- Build: < 30s

---

## Test Coverage Checklist

| Test | Coverage | Status |
|------|----------|--------|
| HTTP Status 200 (endpoint A) | 1 test | ✓ |
| HTTP Status 200 (endpoint B) | 1 test | ✓ |
| HTTP Status 200 (endpoint C) | 1 test | ✓ |
| JSON payload structure (A, B, C) | 3 tests | ✓ |
| Content-Type header (A, B, C) | 3 tests | ✓ |
| Response determinism (A, B, C) | 3 tests | ✓ |
| Performance < 100ms (A, B, C) | 3 tests | ✓ |
| Concurrency 50× (A, B, C) | 3 tests | ✓ |
| No DB calls (A, B, C) | 3 tests | ✓ |
| No auth checks (A, B, C) | 3 tests | ✓ |
| No env vars (A, B, C) | 3 tests | ✓ |
| TypeScript strict (A, B, C) | 3 tests | ✓ |
| **Total per endpoint** | **15 tests** | ✓ |
| **Total for 3 endpoints** | **45 tests** | ✓ |
| Type check (all files) | 1 check | ✓ |
| Lint (all files) | 1 check | ✓ |
| Build (production) | 1 check | ✓ |
| Regression (existing endpoints) | N/A | ✓ |

---

## Sign-Off Checklist

Before marking this task complete, verify:

- [ ] `npm run test` passes with all 45+ tests
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run build` succeeds
- [ ] Dev server runs all three endpoints correctly
- [ ] Production build runs all three endpoints correctly
- [ ] No regressions in existing endpoints
- [ ] CI/CD pipeline passes (all jobs under SLA)
- [ ] Response payloads verified manually (via curl)
- [ ] No console errors or warnings

---

## Success Indicators

✅ Task complete when:

1. **Testing** ✓
   - 45+ tests pass across three endpoints
   - No test flakiness
   - All edge cases covered

2. **Code Quality** ✓
   - TypeScript strict: zero errors
   - ESLint: zero warnings
   - No `any` types

3. **Build & Deployment** ✓
   - Production build succeeds
   - Bundle size reasonable
   - No build warnings

4. **Runtime** ✓
   - All three endpoints respond correctly in dev and production
   - Response times acceptable
   - No console errors

5. **Regression** ✓
   - All existing endpoints still work
   - No side effects or breaking changes

6. **CI/CD** ✓
   - All pipeline jobs pass
   - Pipeline time < 60s
   - Ready for merge

---

## Troubleshooting

### If tests fail:
1. Run individual endpoint test: `npm run test -- healthz-smoke-733116439-a`
2. Check test output for specific failure
3. Verify route file exists and exports GET handler
4. Check for syntax errors in route or test file

### If TypeScript fails:
1. Run `npm run typecheck` to see specific error
2. Check return type annotation on GET handler
3. Verify all imports are correct
4. Check for unused variables

### If ESLint fails:
1. Run `npm run lint` to see specific warning
2. Most common: unused imports, trailing whitespace, line length
3. Fix issues manually or run `npm run format`

### If build fails:
1. Check build output for error messages
2. Verify route file is in correct directory
3. Check for missing Next.js imports
4. Verify no circular dependencies

### If endpoints don't respond:
1. Check dev server is running: `npm run dev`
2. Verify route file at correct path
3. Check URL: `http://localhost:3000/api/healthz-smoke-733116439-a`
4. Check Next.js logs for errors

---

## References

- **Sprint Plan:** `/artifacts/SPRINT-0090/SPRINT-PLAN.md`
- **Endpoint A Plan:** `/artifacts/SPRINT-0090/VRTX-0519/PLAN.md`
- **Endpoint B Plan:** `/artifacts/SPRINT-0090/VRTX-0520/PLAN.md`
- **Endpoint C Plan:** `/artifacts/SPRINT-0090/VRTX-0521/PLAN.md`
- **Existing endpoints:** `src/app/api/healthz-smoke-1012136249-{a,b,c}/`

---

**Prepared by:** Product Team  
**Date:** 2026-07-19
