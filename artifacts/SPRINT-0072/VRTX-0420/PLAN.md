# TASK VRTX-0420: CI Checks & Linting

**Phase:** CI & Linting (SPRINT-0072)

**Objective:** Ensure all code passes CI checks and linting standards.

**Dependencies:** VRTX-0416, VRTX-0417, VRTX-0418 (endpoints), VRTX-0419 (tests)

---

## 1. Scope

Run all required CI checks to verify code quality, TypeScript compliance, test coverage, and build success.

**Checklist:**
- [ ] ESLint: `npm run lint` — 0 warnings allowed
- [ ] TypeScript: `npm run typecheck` — strict mode, no errors
- [ ] Tests: `npm run test` — all suites pass
- [ ] Build: `npm run build` — succeeds with no errors

---

## 2. CI Checks

### Check 1: Linting

```bash
npm run lint
```

**Expected result:**
- No warnings
- No errors
- Exit code 0
- All code follows ESLint rules

**Files checked:**
- `src/app/api/healthz-smoke-737151464-a/route.ts`
- `src/app/api/healthz-smoke-737151464-b/route.ts`
- `src/app/api/healthz-smoke-737151464-c/route.ts`
- All test files

**Common issues to fix:**
- Unused imports
- Missing semicolons
- Incorrect spacing
- Improper naming conventions

---

### Check 2: TypeScript Strict Mode

```bash
npm run typecheck
```

**Expected result:**
- No errors
- No warnings
- Exit code 0
- Full type safety

**Checks:**
- No `any` types without justification
- Complete type annotations
- No implicit `any`
- Proper function return types
- Parameter types specified

**For these endpoints:**
- Function signature: `export async function GET(): Promise<NextResponse>`
- All imports are properly typed
- Response object is properly typed as NextResponse

---

### Check 3: Test Suite

```bash
npm run test
```

**Expected result:**
- All 45 tests pass
- No test failures or errors
- Coverage > 85% for new code
- Exit code 0

**Tests to verify:**
- 15 tests for `/api/healthz-smoke-737151464-a`
- 15 tests for `/api/healthz-smoke-737151464-b`
- 15 tests for `/api/healthz-smoke-737151464-c`

---

### Check 4: Build

```bash
npm run build
```

**Expected result:**
- Build succeeds
- No errors or warnings
- Generated `.next` directory
- Exit code 0

**Build output should include:**
- Compilation of all three endpoint files
- Successful Next.js build
- No TypeScript errors
- No module resolution errors

---

## 3. Sequential Check Order

Run checks in this order to catch issues early:

1. **npm run lint** — syntax and style
2. **npm run typecheck** — type safety
3. **npm run test** — functionality
4. **npm run build** — integration

If any check fails, fix issues before proceeding to next check.

---

## 4. Common Fixes

### Linting failures
- Add missing semicolons
- Remove unused imports
- Fix spacing issues
- Correct naming conventions

### TypeScript failures
- Add explicit return types
- Specify parameter types
- Avoid `any` types
- Import types correctly

### Test failures
- Verify endpoint implementations match test expectations
- Check response format (JSON structure)
- Verify HTTP status codes
- Ensure no dependencies in endpoints

### Build failures
- Check for module resolution errors
- Verify all imports are correct
- Ensure no circular dependencies
- Check for syntax errors

---

## 5. Definition of Done

- [ ] Linting passes: `npm run lint` — 0 warnings
- [ ] TypeScript passes: `npm run typecheck` — no errors
- [ ] Tests pass: `npm run test` — all 45 tests pass
- [ ] Build succeeds: `npm run build` — no errors
- [ ] All endpoints implemented correctly
- [ ] No temporary code or debug statements
- [ ] Code committed with clear message

---

## 6. Acceptance Criteria (from sprint plan)

- [ ] `npm run lint` runs clean with 0 warnings
- [ ] `npm run typecheck` passes (strict mode, no errors)
- [ ] `npm run test` passes all test suites
- [ ] `npm run build` succeeds with no errors
- [ ] Code committed and pushed

---

## 7. Continuous Integration

These checks are run automatically by CI/CD pipeline:
- On each commit
- Before merge to sprint branch
- Before merge to main branch

Ensure all checks pass locally before pushing.

