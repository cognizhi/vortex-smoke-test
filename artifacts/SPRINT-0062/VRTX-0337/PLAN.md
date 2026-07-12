# VRTX-0335: CI/Build verification for variant 43762983 endpoints

**Task type:** Implementation (Build/CI)  
**Sprint:** SPRINT-0062  
**Epic:** Health check endpoints (variant 43762983)  
**Effort:** 20 minutes  
**Phase:** CI/Build Verification  
**Depends on:** VRTX-0329, VRTX-0330, VRTX-0331, VRTX-0332, VRTX-0333, VRTX-0334 (all implementations + tests)

---

## Summary

Verify that all three variant 43762983 endpoints and their test suites pass the full CI/build pipeline: TypeScript strict mode, ESLint linting, Vitest test suite, and production build.

**No new files to create** — this task verifies existing code committed in prior tasks.

---

## Scope

**In scope:**
- Run `npm run typecheck` and verify zero errors
- Run `npm run lint` and verify zero warnings
- Run `npm run test` and verify all 42 tests pass (14 × 3 endpoints)
- Run `npm run build` and verify production build succeeds
- Verify all three endpoints are bundled in the build
- Verify no regressions in existing health check endpoints
- All commands pass on ticket branch before pushing

**Out of scope:**
- Modifying any source files or tests
- Changing configuration files
- Running external load tests or stress tests
- Docker/Vercel deployment verification

---

## Acceptance Criteria

### TypeScript Strict Mode
```bash
npm run typecheck
```
**Expected:** Zero errors, zero warnings

**Verification:**
- All three route files (`healthz-smoke-43762983-{a,b,c}/route.ts`) are type-safe
- All test files are type-safe
- No implicit `any` types
- No type errors in console

### ESLint Linting
```bash
npm run lint
```
**Expected:** Zero warnings, zero errors

**Verification:**
- All three route files follow ESLint config
- All three test files follow ESLint config
- No style violations
- No import or export errors

### Vitest Test Suite
```bash
npm run test
```
**Expected:** All 42 tests pass (14 per endpoint × 3)

**Verification:**
- VRTX-0329 route: ✅ GET handler callable
- VRTX-0330 route: ✅ GET handler callable
- VRTX-0331 route: ✅ GET handler callable
- VRTX-0332 tests (14): ✅ All pass
- VRTX-0333 tests (14): ✅ All pass
- VRTX-0334 tests (14): ✅ All pass
- Total: ✅ 42 tests passing

### Production Build
```bash
npm run build
```
**Expected:** Build succeeds, no errors

**Verification:**
- Next.js build completes successfully
- All three routes are included in the build output
- No TypeScript compilation errors during build
- No warning messages in build output
- Bundle size is unchanged (or slightly increased by 3 route files)

### Regression Testing

**Verify existing health check endpoints still work:**
- `/api/health` still responds
- `/api/healthz-smoke` still responds
- Other variant endpoints (85511011, 28611693, etc.) still accessible

**Commands:**
```bash
npm run test src/app/api/health/__tests__/route.test.ts
npm run test src/app/api/healthz-smoke/__tests__/route.test.ts
```

---

## Definition of Done

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run test` passes with all 42 tests green
- [ ] `npm run build` succeeds without errors
- [ ] All three endpoint routes exist in build output
- [ ] No regressions in existing health check endpoints
- [ ] All commands verified on ticket branch
- [ ] Code is committed and ready to push

---

## Execution Steps

1. **TypeScript check:**
   ```bash
   npm run typecheck
   ```
   Verify: "No errors" in output

2. **Lint check:**
   ```bash
   npm run lint
   ```
   Verify: "0 warnings" or no errors in output

3. **Test suite:**
   ```bash
   npm run test
   ```
   Verify: All 42 tests pass for the three endpoints

4. **Production build:**
   ```bash
   npm run build
   ```
   Verify: ".next" directory created, no errors

5. **Regression check:**
   ```bash
   npm run test src/app/api/health/__tests__
   npm run test src/app/api/healthz-smoke/__tests__
   ```
   Verify: Existing endpoints still pass

6. **Commit and push:**
   ```bash
   git status
   git push -u origin vortex/feat/VRTX-0335-ci-build-verification
   ```

---

## Related Tasks

**Depends on (all must be complete):**
- VRTX-0329 — Implement healthz-smoke-43762983-a
- VRTX-0330 — Implement healthz-smoke-43762983-b
- VRTX-0331 — Implement healthz-smoke-43762983-c
- VRTX-0332 — Test harness for endpoint A (14 tests)
- VRTX-0333 — Test harness for endpoint B (14 tests)
- VRTX-0334 — Test harness for endpoint C (14 tests)

**Blocks:**
- VRTX-0336 — Documentation update (can start in parallel once implementation is complete)

---

## Known Issues & Mitigation

**Potential issue:** Build cache from prior builds may mask errors.
- **Mitigation:** Run `npm run build` fresh; if issues arise, clear `.next` directory: `rm -rf .next && npm run build`

**Potential issue:** Test suite has false-positive performance tests.
- **Mitigation:** Run performance tests locally multiple times; performance is platform-dependent but endpoints should be < 100ms on any reasonable hardware.

---

## Success Criteria

✅ All npm scripts pass (typecheck, lint, test, build)
✅ All 42 tests pass locally
✅ No regressions in other health check endpoints
✅ Production build includes all three new endpoints
✅ Zero TypeScript or ESLint errors
✅ Ready for documentation update and sprint closure
