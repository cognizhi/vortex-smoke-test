# VRTX-XXXX4 Plan: Test Harness & Integration (E2E Tests & CI)

**TASK:** Create E2E tests for all three endpoints and integrate into CI pipeline

**Sprint:** SPRINT-0097  
**Epic:** VRTX-XXXX0 (Three Independent Smoke Test Variant Endpoints)  
**Story:** VRTX-XXXX0-S1 (Three Independent Endpoints)

**Dependencies:** TASK-1, TASK-2, TASK-3 must be complete before this task starts

---

## Overview

Create comprehensive Playwright E2E tests validating all three endpoints (A, B, C) respond correctly via HTTP. Ensure tests integrate cleanly with the CI pipeline (`npm run test` and E2E test suite).

---

## Scope & Constraints

**E2E Testing:**
- Create single Playwright test file: `e2e/healthz-smoke-endpoints-sprint-0097.spec.ts`
- Test all three endpoints independently: `/api/healthz-smoke-661868846-{a,b,c}`
- Verify HTTP 200 response and JSON body
- Validate response times are < 100ms per endpoint

**CI Integration:**
- Tests must run successfully in `npm run test:coverage`
- E2E tests run via `npx playwright test`
- Zero warnings in linting and type checking

**Constraints:**
- Tests must run after endpoints are implemented (depends on TASK-1, 2, 3)
- No modifications to existing test infrastructure
- No new test libraries or dependencies

---

## File Ownership

```
e2e/
└── healthz-smoke-endpoints-sprint-0097.spec.ts  ← E2E tests (this task)
```

---

## Test Strategy

### E2E Tests (Playwright)

Pattern from prior sprints (SPRINT-0092, SPRINT-0088):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke test endpoints - variant 661868846', () => {
  test('GET /api/healthz-smoke-661868846-a returns 200 with correct response', async ({ request }) => {
    const response = await request.get('/api/healthz-smoke-661868846-a');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '661868846' });
  });

  test('GET /api/healthz-smoke-661868846-b returns 200 with correct response', async ({ request }) => {
    const response = await request.get('/api/healthz-smoke-661868846-b');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '661868846' });
  });

  test('GET /api/healthz-smoke-661868846-c returns 200 with correct response', async ({ request }) => {
    const response = await request.get('/api/healthz-smoke-661868846-c');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '661868846' });
  });

  test('all three endpoints return the same variant', async ({ request }) => {
    const responseA = await request.get('/api/healthz-smoke-661868846-a');
    const responseB = await request.get('/api/healthz-smoke-661868846-b');
    const responseC = await request.get('/api/healthz-smoke-661868846-c');

    const bodyA = await responseA.json();
    const bodyB = await responseB.json();
    const bodyC = await responseC.json();

    expect(bodyA.variant).toBe('661868846');
    expect(bodyB.variant).toBe('661868846');
    expect(bodyC.variant).toBe('661868846');
  });
});
```

---

## Implementation Checklist

- [ ] Create `e2e/healthz-smoke-endpoints-sprint-0097.spec.ts`
- [ ] Add test suite for endpoint A
  - [ ] Test: GET returns 200 status
  - [ ] Test: Response body matches `{ ok: true, variant: "661868846" }`
- [ ] Add test suite for endpoint B
  - [ ] Test: GET returns 200 status
  - [ ] Test: Response body matches `{ ok: true, variant: "661868846" }`
- [ ] Add test suite for endpoint C
  - [ ] Test: GET returns 200 status
  - [ ] Test: Response body matches `{ ok: true, variant: "661868846" }`
- [ ] Add cross-endpoint test
  - [ ] Test: All endpoints return correct variant
- [ ] Run `npm run test` and verify tests pass
- [ ] Run `npx playwright test` and verify E2E tests pass
- [ ] Run `npm run test:coverage` and verify coverage metrics
- [ ] Verify response times are < 100ms per endpoint

---

## Quality Standards

- **Test coverage:** All three endpoints covered by E2E tests
- **Assertion clarity:** Each test validates specific behavior (status, body, variant)
- **Independence:** Tests can run in any order; no shared state
- **CI compatibility:** Tests pass in both local dev and CI environments

---

## Related Work

**Prior Sprints with E2E Tests:**
- SPRINT-0092 (509572604) — E2E test file: `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts`
- SPRINT-0088 (53261999) — Combined unit + E2E tests
- SPRINT-0073 (121996100) — 15 tests per endpoint

**References:**
- E2E test reference: `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts`
- Playwright documentation: https://playwright.dev/docs/api/class-test
- Test configuration: `playwright.config.ts`

---

## Acceptance Criteria (Definition of Done)

- [ ] E2E test file created at `e2e/healthz-smoke-endpoints-sprint-0097.spec.ts`
- [ ] All three endpoints have E2E test coverage
- [ ] Tests validate HTTP 200 response
- [ ] Tests validate JSON response body matches specification
- [ ] Tests validate all endpoints return correct variant
- [ ] All E2E tests pass locally (`npx playwright test`)
- [ ] All unit tests pass (`npm run test`)
- [ ] Tests integrate cleanly with CI pipeline
- [ ] Response time validation confirms < 100ms per endpoint
- [ ] No modifications to existing test infrastructure

---

## Notes

1. **Depends on Implementation:** This task requires TASK-1, TASK-2, TASK-3 to be complete before starting.
2. **CI Integration:** Tests run as part of the standard test suite; no additional configuration needed.
3. **Cross-Endpoint Validation:** E2E tests validate all three endpoints in one test file for efficiency.
4. **No Shared Test Utils:** Each endpoint is tested independently; no helper functions or shared fixtures.
