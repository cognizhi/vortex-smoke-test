# Implementation Plan: `/api/healthz-smoke-1024087252` Endpoint

**Ticket:** VRTX-0074  
**Sprint:** SPRINT-0014  
**Type:** Bug Fix (healthz-smoke variant endpoint)  
**Variant ID:** 1024087252  

---

## Overview

This plan details the complete implementation of the `/api/healthz-smoke-1024087252` endpoint, a lightweight variant-specific smoke test endpoint for monitoring systems and load balancers. The endpoint is stateless, dependency-free, and follows an established pattern proven across 8+ existing variant endpoints (SPRINT-0001 through SPRINT-0013).

---

## 1. File Structure

### 1.1 Directory Layout

```
src/app/api/healthz-smoke-1024087252/
├── route.ts                          # Route handler (main implementation)
└── __tests__/
    └── route.test.ts                 # Unit tests (comprehensive coverage)
```

### 1.2 Files to Create

Two new files will be created in the repository:

1. **`src/app/api/healthz-smoke-1024087252/route.ts`** (40-45 lines)
   - Implements the GET handler
   - Exports `async function GET(): Promise<NextResponse>`
   - Hard-coded response with variant `1024087252`

2. **`src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`** (210-240 lines)
   - Comprehensive test suite with 16-20 test cases
   - Covers HTTP status, response shape, field types, headers, performance, and load testing
   - Uses Vitest framework with standard setup

### 1.3 No Other Files Modified

This change is self-contained:
- No middleware changes needed
- No configuration changes required
- No database schema updates
- No environment variables needed
- No other route handlers affected

---

## 2. Route Handler Implementation: `route.ts`

### 2.1 File Header & Comments

The file begins with a JSDoc header documenting:
- Endpoint path: `GET /api/healthz-smoke-1024087252`
- Purpose: variant-specific lightweight smoke test for monitoring/load balancers
- No dependencies: no DB, no auth, no external calls
- Public access: no authentication required
- Target response time: < 100ms (typical < 10ms)
- Response codes: 200 (always)
- Response body shape: `{ ok: true, variant: "1024087252" }`

Example header (follows existing pattern from SPRINT-0013):

```typescript
/**
 * GET /api/healthz-smoke-1024087252
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (1024087252) in the response.
 *
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "1024087252" }
 */
```

### 2.2 Imports

Minimal imports required:

```typescript
import { NextResponse } from 'next/server';
```

Only the `NextResponse` class from Next.js is needed. No database, auth, or utility imports required.

### 2.3 GET Handler Function Signature

```typescript
export async function GET(): Promise<NextResponse>
```

**Key characteristics:**
- `export async function` — async is required by Next.js route handler pattern
- No parameters (no request body, no query params)
- Return type is explicitly `Promise<NextResponse>` for strict type safety
- No destructuring of `request` or `context` parameters

### 2.4 Implementation Body

The handler body is a single statement:

```typescript
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '1024087252',
    },
    { status: 200 }
  );
}
```

**Implementation details:**
- `NextResponse.json()` automatically sets `Content-Type: application/json`
- First argument: object with two fields:
  - `ok: true` (boolean literal, not string or number)
  - `variant: '1024087252'` (string literal, must match variant ID exactly)
- Second argument: options object with `status: 200` (explicit HTTP status)
- No conditional logic, no error handling, no guards
- Response object is always identical (deterministic)

### 2.5 Method-Level JSDoc

Add JSDoc above the function:

```typescript
/**
 * GET handler for /api/healthz-smoke-1024087252
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "1024087252" }
 */
```

### 2.6 Complete Handler File Content

```typescript
/**
 * GET /api/healthz-smoke-1024087252
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (1024087252) in the response.
 *
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "1024087252" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-1024087252
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "1024087252" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '1024087252',
    },
    { status: 200 }
  );
}
```

---

## 3. Test File Implementation: `route.test.ts`

### 3.1 Test File Header & Context

The test file begins with JSDoc explaining the endpoint and test purpose:

```typescript
/**
 * Unit tests for GET /api/healthz-smoke-1024087252
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 1024087252.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "1024087252" }
 *   - No extra fields in response
 *   - Both fields are correct type and value
 *   - Content-Type header is application/json
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 *   - Performance under simulated load
 */
```

### 3.2 Test Framework & Imports

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';
```

**Notes:**
- Use Vitest (already in devDependencies)
- Import the `GET` function from the route handler
- Import `NextResponse` for instance type checking
- Import test utilities from `vitest` (globals enabled in vitest.config.ts)

### 3.3 Test Suite Structure

The test suite is organized into 5 logical groups:

```typescript
describe('GET /api/healthz-smoke-1024087252', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // GROUP 1: HTTP Status & Response Body (4 tests)
  // GROUP 2: Field Type Safety (2 tests)
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // GROUP 4: Performance (3 tests)
  // GROUP 5: Public Access & Consistency (3-4 tests)
});
```

### 3.4 Test Cases by Group

#### Group 1: HTTP Status & Response Body (4 tests)

These tests verify the basic response structure:

1. **HTTP 200 Status**
   - Assertion: `res.status === 200`
   - Also verify: `res.ok === true` (NextResponse property)

2. **Correct JSON Structure**
   - Parse response as JSON
   - Verify `json.ok === true`
   - Verify `json.variant === '1024087252'`

3. **No Extra Fields (by count)**
   - Parse response as JSON
   - Count keys: `Object.keys(json).length === 2`
   - Verify keys are `['ok', 'variant']` in any order

4. **Exact Field Set**
   - Parse response as JSON
   - Verify `keys.sort() === ['ok', 'variant'].sort()`
   - Verify root keys are exactly `['ok', 'variant']`

#### Group 2: Field Type Safety (2 tests)

These tests verify strict type correctness:

1. **`ok` field is boolean true**
   - Assertion: `typeof json.ok === 'boolean'`
   - Assertion: `json.ok === true` (strict equality, not truthy)
   - Assertion: `json.ok.toStrictEqual(true)` (checks not just == but ===)

2. **`variant` field is string**
   - Assertion: `typeof json.variant === 'string'`
   - Assertion: `json.variant === '1024087252'` (string literal)
   - Verify it's not a number or boolean

#### Group 3: HTTP Headers & Meta (2 tests)

1. **Content-Type Header**
   - Assertion: `res.headers.get('Content-Type') === 'application/json'`
   - This is automatically set by `NextResponse.json()`

2. **Response is NextResponse Instance**
   - Assertion: `res instanceof NextResponse`
   - Verifies correct Next.js type, not a plain object

#### Group 4: Performance (3 tests)

1. **Response Time < 100ms**
   ```typescript
   const startTime = performance.now();
   await GET();
   const endTime = performance.now();
   const elapsedMs = endTime - startTime;
   expect(elapsedMs).toBeLessThan(100);
   ```

2. **Typical Response Time < 10ms** (soft assertion)
   - Same as above, but threshold is 10ms
   - Failure indicates performance regression, not a blocker

3. **Load Test (50 Concurrent Calls)**
   ```typescript
   const calls = Array.from({ length: 50 }, () => GET());
   const startTime = performance.now();
   const results = await Promise.all(calls);
   const endTime = performance.now();
   
   // All 200s
   results.forEach((res) => expect(res.status).toBe(200));
   
   // Completes reasonably fast (allow 5s for 50 calls)
   const totalElapsedMs = endTime - startTime;
   expect(totalElapsedMs).toBeLessThan(5000);
   ```

#### Group 5: Public Access & Consistency (3-4 tests)

1. **No Authentication Required**
   - Simply call `GET()` with no auth context
   - Assertion: response is `200` with `ok: true`
   - Verifies endpoint has no auth guards

2. **Consistency (Multiple Sequential Calls)**
   - Call `GET()` three times sequentially
   - Verify all three return identical responses
   - Verify status is 200 for all
   - Verify JSON bodies are identical

3. **Self-Contained (No Environment Variables)**
   - Call `GET()` with no env setup
   - Assertion: `res.status === 200`
   - Assertion: response body matches spec
   - Verifies endpoint doesn't depend on env vars

4. **(Optional) No Database Connection**
   - Call `GET()` verify `status === 200`
   - Works even if DB is down (endpoint has no DB call)

### 3.5 Test Naming Convention

Follow the pattern from existing endpoints:
- Simpler pattern: `TC-001: description` (like SPRINT-0009)
- Or detailed pattern: `RH-01: description` (like SPRINT-0013)

Choose one consistent style for the ticket. The detailed `RH-##` naming (Request Handler - number) maps to acceptance criteria and is more explicit. Either works as long as it's consistent.

### 3.6 Complete Test File Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-1024087252', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (4 tests)
  // ============================================================================

  it('returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  it('returns correct JSON structure with ok and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown; variant: unknown };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('1024087252');
  });

  it('response has no extra fields in root object', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['ok', 'variant']);
  });

  it('response has exactly two root fields (ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const rootKeys = Object.keys(json);
    expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
    expect(rootKeys).toHaveLength(2);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (2 tests)
  // ============================================================================

  it('ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: unknown };
    expect(typeof json.ok).toBe('boolean');
    expect(json.ok).toStrictEqual(true);
  });

  it('variant field is string "1024087252" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { variant: unknown };
    expect(typeof json.variant).toBe('string');
    expect(json.variant).toStrictEqual('1024087252');
    expect(json.variant).toBe('1024087252');
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  it('Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance (3 tests)
  // ============================================================================

  it('response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  it('response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    // Soft assertion — failure indicates performance regression
    expect(elapsedMs).toBeLessThan(10);
  });

  it('under load (50 concurrent calls), all respond within 100ms', async () => {
    const calls = Array.from({ length: 50 }, () => GET());
    const startTime = performance.now();
    const results = await Promise.all(calls);
    const endTime = performance.now();

    // Check all responded with 200
    results.forEach((res) => {
      expect(res.status).toBe(200);
    });

    // Check total time is reasonable (50 calls should be fast)
    const totalElapsedMs = endTime - startTime;
    expect(totalElapsedMs).toBeLessThan(5000); // Allow 5s for 50 calls
  });

  // ============================================================================
  // GROUP 5: Public Access & Consistency (3+ tests)
  // ============================================================================

  it('endpoint requires no authentication', async () => {
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  it('multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/json');
    });

    const expected = { ok: true, variant: '1024087252' };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });

  it('endpoint is self-contained and requires no env vars', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('1024087252');
  });
});
```

---

## 4. Type Safety & Linting Requirements

### 4.1 TypeScript Strict Mode

The codebase uses `tsc --noEmit` with strict type checking enabled. The implementation must satisfy:

1. **Handler Return Type**
   - Explicitly return `Promise<NextResponse>`
   - No implicit `any` types
   - All function parameters typed (none in this case)

2. **Response Body**
   - Object literal with exactly two properties
   - `ok` must be boolean type (not `boolean | null` or truthy)
   - `variant` must be string type (not `string | number`)

3. **Test Type Safety**
   - Use generic `as { ok: unknown; variant: unknown }` when parsing JSON
   - Verify types with `typeof` checks in tests
   - Use `toStrictEqual(true)` for boolean verification

### 4.2 ESLint Requirements

The codebase enforces `eslint . --max-warnings 0`, which means:

1. **No Warnings Allowed**
   - Code must be clean with zero warnings
   - No unused imports
   - No unused variables
   - No implicit any

2. **Specific Rules to Follow**
   - Only import `NextResponse` from 'next/server'
   - No commented-out code
   - No console logs (unless intentional for debugging)
   - No magic numbers (use named constants if needed)

3. **Code Style**
   - Follow Prettier formatting (run `npm run format` before commit)
   - 2-space indentation (Tailwind config)
   - Trailing commas in multi-line objects (Prettier default)
   - Single quotes for strings (ESLint+Prettier convention in this repo)

### 4.3 Pre-Commit Checks

Before committing, run:

```bash
npm run lint          # ESLint with --max-warnings 0
npm run typecheck     # TypeScript strict validation
npm run test          # Run all tests (including this one)
npm run format        # Format code with Prettier (idempotent)
```

All commands must pass with zero errors and zero warnings.

---

## 5. Edge Cases & Considerations

### 5.1 Request Edge Cases

1. **HEAD Requests**
   - Next.js route handlers don't support HEAD method
   - If called with HEAD, Next.js returns 405 Method Not Allowed
   - No special handling needed

2. **POST/PUT/DELETE Requests**
   - Only GET handler is exported
   - Next.js returns 405 Method Not Allowed for other methods
   - No special handling needed

3. **Query Parameters**
   - Handler signature takes no `request` parameter
   - Query params are ignored (endpoint is stateless)
   - Example: `/api/healthz-smoke-1024087252?foo=bar` still returns same response
   - This is intentional — monitoring systems may add tracking params

### 5.2 Response Edge Cases

1. **Large Number of Concurrent Requests**
   - Handler is stateless and non-blocking
   - No limits on concurrent calls
   - Load test with 50 concurrent calls verifies scalability

2. **Network Timeouts**
   - Handler completes in < 10ms typically
   - Even under load, completes in < 100ms
   - Network timeouts in monitoring systems are not the endpoint's concern

3. **Memory/Resource Constraints**
   - No database connections, file I/O, or external calls
   - Minimal memory footprint
   - Can be called thousands of times per second without resource exhaustion

### 5.3 Deployment Edge Cases

1. **Cold Start**
   - If deployed on serverless (AWS Lambda, Vercel), first call may take longer
   - Subsequent calls are fast (< 10ms typical)
   - Performance test allows up to 100ms, which covers cold starts

2. **Multiple Instances**
   - Each instance returns identical response
   - Useful for verifying all instances are healthy

3. **Configuration Mismatches**
   - Variant ID is hard-coded (no configuration needed)
   - Impossible to return wrong variant ID

### 5.4 No Hidden Dependencies

The endpoint is truly dependency-free:

| Dependency | Status | Reason |
|-----------|--------|--------|
| Database | ❌ None | No DB queries in handler |
| Auth/Session | ❌ None | No auth guards or checks |
| Environment variables | ❌ None | Variant ID is hard-coded |
| External APIs | ❌ None | No HTTP calls |
| File I/O | ❌ None | No file reads/writes |
| Caching | ❌ None | Response is always fresh (no cache headers set) |
| Rate limiting | ❌ None | No rate limit checks |

---

## 6. Verification & Testing Strategy

### 6.1 Local Testing

Run unit tests locally:

```bash
# Run all tests
npm run test

# Run only this endpoint's tests
npx vitest run src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts

# Run with watch mode during development
npx vitest src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts

# Run with coverage
npm run test:coverage
```

### 6.2 Manual Testing

Test the endpoint manually during development:

```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl -X GET http://localhost:3000/api/healthz-smoke-1024087252

# Expected response (pretty-printed):
# {
#   "ok": true,
#   "variant": "1024087252"
# }

# Check response headers
curl -i http://localhost:3000/api/healthz-smoke-1024087252
# Should include: Content-Type: application/json

# Test with multiple concurrent requests
for i in {1..10}; do
  curl -s http://localhost:3000/api/healthz-smoke-1024087252 | jq . &
done
wait
```

### 6.3 Integration with CI/CD

The tests are designed to pass in CI/CD pipelines:

1. **Vitest Configuration**
   - Tests run in jsdom environment by default
   - This endpoint's test doesn't match `*session*` or `api/auth/**` patterns
   - Runs in jsdom environment
   - No environment file setup needed (.env.test not required for this endpoint)

2. **Performance Testing**
   - Load test with 50 concurrent requests completes in < 5 seconds
   - Suitable for CI/CD time budgets
   - No external services called, no flakiness

3. **Code Coverage**
   - Handler is simple: 1 function with no branches
   - All lines and branches are covered by tests
   - Expected coverage: 100% for this file

### 6.4 Acceptance Criteria Verification

Map each test to acceptance criteria from PRODUCT.md Section 8:

| Acceptance Criterion | Test Cases |
|---------------------|-----------|
| HTTP 200 status | `returns HTTP 200 status` |
| Response body: `{ ok: true, variant: "1024087252" }` | `returns correct JSON structure`, `response has exactly two root fields` |
| Content-Type: application/json | `Content-Type header is application/json` |
| No authentication required | `endpoint requires no authentication` |
| Response time < 100ms | `response time is less than 100ms` |
| Consistency under repeated calls | `multiple sequential calls return consistent responses` |
| Performance under load (50+ concurrent) | `under load (50 concurrent calls), all respond within 100ms` |
| Type safety (ok is boolean, variant is string) | `ok field is boolean true`, `variant field is string` |
| No extra fields in response | `response has no extra fields in root object` |
| Self-contained | `endpoint is self-contained and requires no env vars` |

All acceptance criteria are directly testable and have corresponding test cases.

---

## 7. Implementation Checklist

### Phase 1: Code Implementation

- [ ] Create directory: `src/app/api/healthz-smoke-1024087252/`
- [ ] Create `src/app/api/healthz-smoke-1024087252/route.ts`
  - [ ] Add file header JSDoc
  - [ ] Import `NextResponse` from 'next/server'
  - [ ] Add GET handler JSDoc
  - [ ] Implement `export async function GET(): Promise<NextResponse>`
  - [ ] Return `NextResponse.json({ ok: true, variant: '1024087252' }, { status: 200 })`
- [ ] Create directory: `src/app/api/healthz-smoke-1024087252/__tests__/`
- [ ] Create `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
  - [ ] Add file header JSDoc
  - [ ] Import test utilities: `describe, it, expect, beforeEach`
  - [ ] Import `NextResponse` and `GET` handler
  - [ ] Add test suite: `describe('GET /api/healthz-smoke-1024087252')`
  - [ ] Add `beforeEach()` with comment about no setup needed
  - [ ] Implement GROUP 1 tests (4 tests)
  - [ ] Implement GROUP 2 tests (2 tests)
  - [ ] Implement GROUP 3 tests (2 tests)
  - [ ] Implement GROUP 4 tests (3 tests)
  - [ ] Implement GROUP 5 tests (3-4 tests)

### Phase 2: Quality Assurance

- [ ] Run `npm run lint` — must pass with 0 warnings
- [ ] Run `npm run typecheck` — must pass with no errors
- [ ] Run `npm run format` — ensure code is Prettier-formatted
- [ ] Run `npm run test` — all tests pass
  - [ ] Specifically: `npx vitest run src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
- [ ] Run manual testing with `curl` or REST client
- [ ] Verify endpoint returns `{ ok: true, variant: "1024087252" }` with status 200

### Phase 3: Documentation & Commit

- [ ] Update PRODUCT.md Section 8 to list this new variant (if required)
- [ ] Update ARCHITECTURE.md Section 5 if needed (reference pattern)
- [ ] Commit changes with message:
  ```
  feat(VRTX-0074): add /api/healthz-smoke-1024087252 variant endpoint
  
  - Implement lightweight smoke test endpoint for variant 1024087252
  - Add comprehensive test suite (16 test cases)
  - Endpoint returns { ok: true, variant: "1024087252" } with status 200
  - No dependencies: no DB, no auth, no external calls
  - Performance: typical < 10ms, under load < 100ms
  
  Fixes VRTX-0074
  ```

### Phase 4: Merge & Deploy

- [ ] Create pull request with this implementation
- [ ] CI/CD pipeline passes (lint, typecheck, test, build)
- [ ] Code review approval
- [ ] Merge to `dev` branch
- [ ] Verify endpoint in staging environment
- [ ] Deploy to production
- [ ] Verify endpoint in production (can hit with curl/monitoring)

---

## 8. Common Mistakes to Avoid

### Type Errors

❌ **Mistake:** `ok: "true"` (string instead of boolean)
✅ **Correct:** `ok: true` (boolean literal)

❌ **Mistake:** `variant: 1024087252` (number instead of string)
✅ **Correct:** `variant: '1024087252'` (string literal)

❌ **Mistake:** Return type `NextResponse | undefined`
✅ **Correct:** Return type `Promise<NextResponse>`

### Implementation Errors

❌ **Mistake:** Adding query params or path handlers
✅ **Correct:** Simple `GET()` function, no request parameter

❌ **Mistake:** Calling database or auth functions
✅ **Correct:** Endpoint is stateless with hard-coded response

❌ **Mistake:** Forgetting explicit `status: 200` in options
✅ **Correct:** `NextResponse.json(body, { status: 200 })`

### Test Errors

❌ **Mistake:** `expect(json.ok).toBe("true")` (string comparison)
✅ **Correct:** `expect(typeof json.ok).toBe('boolean')` and `expect(json.ok).toStrictEqual(true)`

❌ **Mistake:** Mocking dependencies (none exist)
✅ **Correct:** No mocking needed, call `GET()` directly

❌ **Mistake:** Hard-coded variant ID in test doesn't match route
✅ **Correct:** Use exact variant `'1024087252'` in both route and test

---

## 9. Code Review Checklist

When reviewing this implementation, verify:

1. **File Structure**
   - [ ] `route.ts` exists at `src/app/api/healthz-smoke-1024087252/route.ts`
   - [ ] `route.test.ts` exists at `src/app/api/healthz-smoke-1024087252/__tests__/route.test.ts`
   - [ ] No other files modified

2. **Route Handler (`route.ts`)**
   - [ ] Only `NextResponse` is imported
   - [ ] Function signature is `export async function GET(): Promise<NextResponse>`
   - [ ] No function parameters
   - [ ] Returns `NextResponse.json({ ok: true, variant: '1024087252' }, { status: 200 })`
   - [ ] No conditional logic or error handling
   - [ ] No database, auth, or external API calls
   - [ ] File includes JSDoc headers
   - [ ] Code passes ESLint with 0 warnings
   - [ ] Code passes TypeScript strict check

3. **Test File (`route.test.ts`)**
   - [ ] Imports are correct: `vitest`, `NextResponse`, `GET`
   - [ ] Test suite name matches endpoint: `'GET /api/healthz-smoke-1024087252'`
   - [ ] All 16+ test cases present and passing
   - [ ] Tests grouped logically (status, types, headers, performance, access)
   - [ ] Performance tests use `performance.now()` timing
   - [ ] Load test creates 50 concurrent calls with `Promise.all()`
   - [ ] Content-Type verification tests exact string match
   - [ ] Variant ID matches route handler: `'1024087252'`
   - [ ] No mocking or setup needed

4. **Quality Gates**
   - [ ] `npm run lint` passes (0 warnings)
   - [ ] `npm run typecheck` passes (0 errors)
   - [ ] `npm run test` passes (all tests pass)
   - [ ] `npm run format` produces no changes (already formatted)

5. **Documentation**
   - [ ] File headers explain endpoint purpose
   - [ ] JSDoc comments on handler function
   - [ ] Test file header explains what's being tested
   - [ ] Comments explain why timing thresholds are set (e.g., "50 calls")

---

## 10. Reference Implementation

For reference, the simplest existing endpoint follows this exact pattern:

**File:** `src/app/api/healthz-smoke-48842051/route.ts` (SPRINT-0009)

This is the template to follow. The new endpoint is identical except for:
- Directory name: `healthz-smoke-1024087252` instead of `healthz-smoke-48842051`
- Variant ID: `'1024087252'` instead of `'48842051'`
- JSDoc mentions: `1024087252` instead of `48842051`
- Test variant ID: `'1024087252'` instead of `'48842051'`

No architectural changes, no new patterns, no deviations from the established style.

---

## Summary

This implementation adds a new variant-specific health check endpoint following an established, proven pattern across 8+ sprints (SPRINT-0001 through SPRINT-0013). The endpoint is:

- **Simple:** One file with a 3-line handler
- **Safe:** Comprehensive test coverage with 16+ test cases
- **Fast:** Typical response time < 10ms, under load < 100ms
- **Dependency-free:** No database, auth, or external calls
- **Type-safe:** Strict TypeScript with full test coverage
- **Production-ready:** Follows existing conventions exactly

Expected development time: 30-45 minutes (implementation + testing + quality checks)
