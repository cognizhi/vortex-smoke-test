# Task Plan: VRTX-0092
## Test-Harness: Unit Tests & E2E Tests for Smoke Endpoints

**EPIC:** VRTX-0087 — Add 3 independent smoke test endpoints (53261999)  
**STORY:** VRTX-0088 — Core implementation  
**TASK:** VRTX-0092  
**Assigned to:** Engineer (or QA)  
**Effort:** 1 day  
**Status:** Ready for implementation  
**Depends on:** VRTX-0089, VRTX-0090, VRTX-0091 (all three endpoints must be implemented first)  

---

## 1. Scope

Write comprehensive unit and E2E tests for the three smoke test endpoints. This TASK depends on VRTX-0089, VRTX-0090, and VRTX-0091 being completed (all three endpoint implementations must exist before tests can be written).

### What's In Scope
- Create Vitest unit tests for each endpoint
- Create or extend Playwright E2E tests for all three endpoints
- Achieve 100% code coverage for the endpoint files
- Verify HTTP 200 response and JSON structure
- No error cases (endpoints always succeed)
- All tests pass (`npm run test`, `npx playwright test`)

### What's Out of Scope
- Implementation of endpoints (covered by VRTX-0089, 0090, 0091)
- CI/CD configuration (covered by VRTX-0093: CI integration, optional)
- Performance testing (out of scope for MVP)
- Load testing (out of scope for MVP)

---

## 2. Design & Test Strategy

### Unit Tests (Vitest)

**File structure:**
```
src/app/api/healthz-smoke-53261999-a/__tests__/route.test.ts
src/app/api/healthz-smoke-53261999-b/__tests__/route.test.ts
src/app/api/healthz-smoke-53261999-c/__tests__/route.test.ts
```

**Test cases per endpoint (3 tests each):**

1. **Happy path: returns 200 with correct JSON**
   - Setup: Create a mock `NextRequest` with GET method
   - Call: `GET(request)` handler
   - Assert: Status is 200, body is `{ ok: true, variant: "53261999" }`

2. **Response structure validation**
   - Assert: Response JSON has `ok` (type: boolean, value: true)
   - Assert: Response JSON has `variant` (type: string, value: "53261999")
   - Assert: No extra fields in response

3. **Content-Type header**
   - Assert: Response has `Content-Type: application/json` header

**Mocking strategy:**
- Mock `NextRequest` with appropriate method and headers
- Mock `NextResponse` to verify status and body (use real `NextResponse` implementation)
- No database mocks needed (endpoints don't access DB)
- No auth mocks needed (endpoints are public)

**Example test structure:**
```typescript
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/healthz-smoke-53261999-a', () => {
  it('returns 200 with correct JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-53261999-a', {
      method: 'GET',
    });
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '53261999' });
  });

  it('has correct response structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-53261999-a');
    const response = await GET(request);
    const body = await response.json();

    expect(body).toHaveProperty('ok');
    expect(body).toHaveProperty('variant');
    expect(Object.keys(body)).toEqual(['ok', 'variant']);
  });

  it('sets correct Content-Type header', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-53261999-a');
    const response = await GET(request);

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
```

---

### E2E Tests (Playwright)

**File structure:**
```
e2e/healthz-smoke-endpoints.spec.ts  ← Create or extend if exists
```

**Test cases:**

1. **GET /api/healthz-smoke-53261999-a returns 200**
   - Setup: Start the dev server or staging server
   - Action: `GET /api/healthz-smoke-53261999-a`
   - Assert: Status 200, JSON response with `{ ok: true, variant: "53261999" }`

2. **GET /api/healthz-smoke-53261999-b returns 200**
   - (Same as above, different endpoint)

3. **GET /api/healthz-smoke-53261999-c returns 200**
   - (Same as above, different endpoint)

**Example E2E test structure:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke test endpoints', () => {
  test('GET /api/healthz-smoke-53261999-a returns 200', async ({ request }) => {
    const response = await request.get('/api/healthz-smoke-53261999-a');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.variant).toBe('53261999');
  });

  test('GET /api/healthz-smoke-53261999-b returns 200', async ({ request }) => {
    const response = await request.get('/api/healthz-smoke-53261999-b');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.variant).toBe('53261999');
  });

  test('GET /api/healthz-smoke-53261999-c returns 200', async ({ request }) => {
    const response = await request.get('/api/healthz-smoke-53261999-c');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.variant).toBe('53261999');
  });
});
```

---

## 3. File Ownership Map

| File | Owner | Responsibility |
|------|-------|-----------------|
| `src/app/api/healthz-smoke-53261999-a/__tests__/route.test.ts` | This TASK | Unit tests for endpoint a |
| `src/app/api/healthz-smoke-53261999-b/__tests__/route.test.ts` | This TASK | Unit tests for endpoint b |
| `src/app/api/healthz-smoke-53261999-c/__tests__/route.test.ts` | This TASK | Unit tests for endpoint c |
| `e2e/healthz-smoke-endpoints.spec.ts` | This TASK | E2E tests for all three endpoints |

**Note:** Do NOT modify the endpoint implementation files (route.ts); only add test files.

---

## 4. Coverage Requirements

- **Target:** 100% code coverage for the three endpoint files
- **Scope:** Lines, branches, functions, statements
- **Verification:** `npm run test:coverage` (v8 provider)

Since the endpoints are trivial (pure response, no branches), 100% coverage is easy to achieve:

```
src/app/api/healthz-smoke-53261999-a/route.ts     100% (1 line, 1 function)
src/app/api/healthz-smoke-53261999-b/route.ts     100% (1 line, 1 function)
src/app/api/healthz-smoke-53261999-c/route.ts     100% (1 line, 1 function)
```

---

## 5. Test Execution

### Unit Tests
```bash
npm run test                    # Run Vitest in watch mode
npm run test run               # Run once (for CI)
npm run test:coverage          # With coverage report
```

### E2E Tests
```bash
npm run dev                     # Start dev server (required for E2E)
npx playwright test             # Run Playwright tests
npx playwright test --headed    # With browser UI
```

### Full Test Suite (for CI)
```bash
npm run test run               # Unit tests
npm run test:coverage          # Coverage verification
npx playwright test            # E2E tests
npm run lint                   # Linting
npm run typecheck              # Type checking
npm run build                  # Build verification
```

---

## 6. Acceptance Criteria

**Unit Tests:**
- [ ] `src/app/api/healthz-smoke-53261999-a/__tests__/route.test.ts` created
- [ ] `src/app/api/healthz-smoke-53261999-b/__tests__/route.test.ts` created
- [ ] `src/app/api/healthz-smoke-53261999-c/__tests__/route.test.ts` created
- [ ] Each test file has ≥ 3 test cases covering status, structure, and headers
- [ ] All unit tests pass (`npm run test run`)
- [ ] 100% code coverage for endpoint files

**E2E Tests:**
- [ ] `e2e/healthz-smoke-endpoints.spec.ts` created or extended
- [ ] Tests cover all three endpoints (GET /a, /b, /c)
- [ ] Each test verifies 200 status and JSON payload
- [ ] All E2E tests pass (`npx playwright test`)

**Overall:**
- [ ] No lint errors (`npm run lint` with 0 warnings)
- [ ] No type errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] All commits on ticket branch, pushed to remote with `-u origin`

---

## 7. Definition of Done

1. All acceptance criteria above are checked
2. All unit tests pass with 100% coverage
3. All E2E tests pass against running dev server
4. No breaking changes to existing tests
5. Code committed and pushed to ticket branch
6. Ready for integration review

---

## 8. Dependency Notes

This TASK **depends on:**
- VRTX-0089 (endpoint a implementation)
- VRTX-0090 (endpoint b implementation)
- VRTX-0091 (endpoint c implementation)

**Do NOT start this TASK** until all three endpoint implementations are merged and available on the branch.

---

## 9. Notes for Engineer / QA

- **Existing test patterns:** Review `src/app/api/healthz-smoke/__tests__/route.test.ts` and `e2e/healthz-smoke-endpoints.spec.ts` for reference patterns
- **Test environment:** Vitest runs in `jsdom` by default; no special env config needed for these simple endpoints
- **E2E setup:** Playwright expects a running dev server on `http://localhost:3000` (configurable in `playwright.config.ts`)
- **Mocking:** No need to mock database, auth, or external services (endpoints are self-contained)
- **Quick wins:** Since these endpoints are trivial, aim for 100% coverage and simple, readable tests

---

## 10. Related Tasks

- **TASK-0:** Implement endpoint a
- **TASK-1:** Implement endpoint b
- **TASK-2:** Implement endpoint c
- **TASK-3 (this):** Test-harness (depends on all three endpoints above)
- **TASK-4:** CI/CD integration (optional, can follow this task)

---

## Changelog

### 2026-07-19 — Initial plan

**Created:** TASK plan for test-harness covering unit and E2E tests  
**Scope:** 100% code coverage for three endpoints  
**Effort:** 1 day (trivial logic, simple tests)  
**Dependency:** Requires VRTX-0089, 0090, 0091 to be completed first
