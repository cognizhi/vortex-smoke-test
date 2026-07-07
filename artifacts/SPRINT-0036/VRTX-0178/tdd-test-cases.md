# TDD Test Cases: VRTX-0178 — GET /healthz-smoke-15114362

**Ticket:** VRTX-0178  
**Sprint:** SPRINT-0036  
**Test File:** `src/app/api/healthz-smoke-15114362/__tests__/route.test.ts`  
**Framework:** Vitest + React Testing Library

---

## Test Structure

Tests are organized into 5 logical groups (14 test cases total):

### Group 1: HTTP Status & Response Body (4 tests)
Tests that verify the endpoint responds with the correct HTTP status code and JSON structure.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-01 | Returns HTTP 200 status | `status === 200` and `ok === true` | AC-02: Endpoint responds 200 |
| RH-02 | Returns correct JSON structure | `{ ok: true, variant: "15114362" }` | AC-03: Response matches spec |
| RH-03 | Response has no extra fields | Exactly 2 root keys | AC-04: No extra fields |
| RH-04 | Exactly two root fields | Keys are `['ok', 'variant']` | AC-04: Exact field set |

### Group 2: Field Type Safety (2 tests)
Tests that verify field types are correct (not just truthy values).

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-05 | ok field is boolean true | `typeof ok === 'boolean'` AND `ok === true` | AC-05: Type safety |
| RH-06 | variant field is string | `typeof variant === 'string'` AND `variant === '15114362'` | AC-06: Type safety |

### Group 3: HTTP Headers & Meta (2 tests)
Tests that verify response headers and NextResponse compliance.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-07 | Content-Type is application/json | Header contains `application/json` | AC-07: Content-Type header |
| RH-08 | Response is NextResponse instance | `instanceof NextResponse` | AC-14: Correct response type |

### Group 4: Performance (3 tests)
Tests that verify the endpoint meets performance requirements.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-09 | Response time < 100ms | Single call duration < 100ms | AC-08: Performance threshold |
| RH-10 | Response time < 10ms (typical) | Single call duration < 10ms | AC-09: Typical performance |
| RH-11 | Load test: 50 concurrent calls | All respond 200, total time < 5s | AC-11: Load tolerance |

### Group 5: Public Access & Consistency (3 tests)
Tests that verify the endpoint is public, consistent, and self-contained.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-12 | No authentication required | Responds 200 without auth headers | AC-10: Public endpoint |
| RH-13 | Consistent responses on repeated calls | 3 sequential calls return identical responses | AC-13: Consistency |
| RH-14 | Self-contained (no env vars) | Works without environment variable setup | AC-12: Self-contained |

---

## Detailed Test Specifications

### RH-01: Returns HTTP 200 status
**Test:** Verify the endpoint returns an HTTP 200 success status.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET()
Then response.status === 200 AND response.ok === true
```

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
expect(res.ok).toBe(true);
```

**Why It Matters:** Ensures the endpoint is considered successful by HTTP clients and monitoring systems.

---

### RH-02: Returns correct JSON structure
**Test:** Verify the response body matches the spec: `{ ok: true, variant: "15114362" }`.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and parsing JSON
Then json.ok === true AND json.variant === "15114362"
```

**Assertion:**
```typescript
const res = await GET();
const json = await res.json() as { ok: unknown; variant: unknown };
expect(json.ok).toBe(true);
expect(json.variant).toBe('15114362');
```

**Why It Matters:** Ensures the response matches the documented API contract.

---

### RH-03: Response has no extra fields
**Test:** Verify the response object contains exactly the specified fields with no extras.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and parsing JSON
Then Object.keys(json).length === 2
```

**Assertion:**
```typescript
const res = await GET();
const json = await res.json() as Record<string, unknown>;
const keys = Object.keys(json);
expect(keys).toHaveLength(2);
expect(keys.sort()).toEqual(['ok', 'variant']);
```

**Why It Matters:** Ensures future changes don't accidentally add fields to the response.

---

### RH-04: Exactly two root fields (ok and variant)
**Test:** Verify the response has exactly two root-level fields with the expected names.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and parsing JSON
Then root keys are exactly ['ok', 'variant']
```

**Assertion:**
```typescript
const res = await GET();
const json = await res.json() as Record<string, unknown>;
const rootKeys = Object.keys(json);
expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']));
expect(rootKeys).toHaveLength(2);
```

**Why It Matters:** Protects against accidental response schema changes.

---

### RH-05: ok field is boolean true (not just truthy)
**Test:** Verify the `ok` field is specifically the boolean value `true`, not a truthy string/number.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and parsing JSON
Then typeof json.ok === 'boolean' AND json.ok === true
```

**Assertion:**
```typescript
const res = await GET();
const json = await res.json() as { ok: unknown };
expect(typeof json.ok).toBe('boolean');
expect(json.ok).toStrictEqual(true);
```

**Why It Matters:** Prevents type coercion bugs in monitoring systems parsing the response.

---

### RH-06: variant field is string "15114362" (not number)
**Test:** Verify the `variant` field is a string, not a number.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and parsing JSON
Then typeof json.variant === 'string' AND json.variant === "15114362"
```

**Assertion:**
```typescript
const res = await GET();
const json = await res.json() as { variant: unknown };
expect(typeof json.variant).toBe('string');
expect(json.variant).toStrictEqual('15114362');
expect(json.variant).toBe('15114362');
```

**Why It Matters:** Ensures monitoring systems can safely use the variant value as a string identifier.

---

### RH-07: Content-Type header is application/json
**Test:** Verify the response declares the correct content type.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET()
Then response header 'Content-Type' contains 'application/json'
```

**Assertion:**
```typescript
const res = await GET();
expect(res.headers.get('Content-Type')).toContain('application/json');
```

**Why It Matters:** Ensures HTTP clients correctly parse the response as JSON.

---

### RH-08: Response is a NextResponse instance
**Test:** Verify the function returns a proper Next.js NextResponse object.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET()
Then response instanceof NextResponse === true
```

**Assertion:**
```typescript
const res = await GET();
expect(res).toBeInstanceOf(NextResponse);
```

**Why It Matters:** Ensures the handler follows Next.js API conventions.

---

### RH-09: Response time < 100ms
**Test:** Verify the endpoint responds within the performance threshold.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and measuring elapsed time
Then elapsed time < 100ms
```

**Assertion:**
```typescript
const startTime = performance.now();
await GET();
const endTime = performance.now();
const elapsedMs = endTime - startTime;
expect(elapsedMs).toBeLessThan(100);
```

**Why It Matters:** Ensures the endpoint is fast enough for load balancer and monitoring integrations.

---

### RH-10: Response time < 10ms (typical)
**Test:** Verify the endpoint typically responds in < 10ms (soft assertion).

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() and measuring elapsed time
Then elapsed time < 10ms (soft: performance regression indicator)
```

**Assertion:**
```typescript
const startTime = performance.now();
await GET();
const endTime = performance.now();
const elapsedMs = endTime - startTime;
expect(elapsedMs).toBeLessThan(10); // Soft assertion
```

**Why It Matters:** Detects performance regressions; typical 1-2ms responses can indicate a problem if they slip above 10ms.

---

### RH-11: Load test: 50 concurrent calls
**Test:** Verify the endpoint can handle concurrent calls from monitoring systems without degradation.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() 50 times concurrently
Then all respond with 200 AND total time < 5s
```

**Assertion:**
```typescript
const calls = Array.from({ length: 50 }, () => GET());
const startTime = performance.now();
const results = await Promise.all(calls);
const endTime = performance.now();

results.forEach((res) => {
  expect(res.status).toBe(200);
});

const totalElapsedMs = endTime - startTime;
expect(totalElapsedMs).toBeLessThan(5000); // Allow 5s for 50 calls
```

**Why It Matters:** Ensures the endpoint scales under typical monitoring polling load.

---

### RH-12: No authentication required
**Test:** Verify the endpoint is publicly accessible without authentication.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() without authentication headers or cookies
Then response status === 200
```

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
expect(res.ok).toBe(true);
```

**Why It Matters:** Ensures monitoring systems can probe the endpoint without credentials.

---

### RH-13: Consistent responses on repeated calls
**Test:** Verify the endpoint returns identical responses on repeated calls.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() 3 times sequentially
Then all responses have status 200 AND all bodies equal { ok: true, variant: "15114362" }
```

**Assertion:**
```typescript
const responses = await Promise.all([GET(), GET(), GET()]);
const bodies = await Promise.all(responses.map((res) => res.json()));

responses.forEach((res) => {
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toContain('application/json');
});

const expected = { ok: true, variant: '15114362' };
bodies.forEach((body) => {
  expect(body).toEqual(expected);
});
```

**Why It Matters:** Confirms the endpoint's behavior is deterministic and stable.

---

### RH-14: Self-contained (no environment variables)
**Test:** Verify the endpoint requires no environment variable setup.

**Setup:**
```
Given the GET /api/healthz-smoke-15114362 endpoint
When calling GET() without special env vars
Then response status === 200 AND response is correct
```

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
const json = await res.json() as { ok: boolean; variant: string };
expect(json.ok).toBe(true);
expect(json.variant).toBe('15114362');
```

**Why It Matters:** Ensures the endpoint works in any deployment without configuration dependencies.

---

## Test Execution Plan

### Phase 1: RED (Failing Tests)
1. Write all 14 test cases in `src/app/api/healthz-smoke-15114362/__tests__/route.test.ts`
2. Run `npm run test -- src/app/api/healthz-smoke-15114362` — expect 14 failures
3. Record failures in tdd-test-result.md under "RED Phase"

### Phase 2: GREEN (Passing Tests)
1. Implement the route handler in `src/app/api/healthz-smoke-15114362/route.ts`
2. Run `npm run test -- src/app/api/healthz-smoke-15114362` — expect 14 passes
3. Run `npm run typecheck` — expect 0 errors
4. Run `npm run lint` — expect 0 warnings
5. Record results in tdd-test-result.md under "GREEN Phase"

### Phase 3: REFACTOR (Code Review & Polish)
1. Review implementation for clarity and adherence to patterns
2. Verify JSDoc header is complete and accurate
3. Ensure no TypeScript implicit any
4. Confirm consistent with other variant endpoints
5. Record review findings in tdd-test-result.md under "REFACTOR Phase"

---

## Mapping to Acceptance Criteria

| AC # | Description | Test IDs | Status |
|------|-------------|----------|--------|
| AC-02 | Endpoint responds with HTTP 200 | RH-01 | Defined |
| AC-03 | Response body matches spec | RH-02 | Defined |
| AC-04 | No extra fields in response | RH-03, RH-04 | Defined |
| AC-05 | ok is boolean true (not truthy) | RH-05 | Defined |
| AC-06 | variant is string (not number) | RH-06 | Defined |
| AC-07 | Content-Type is application/json | RH-07 | Defined |
| AC-08 | Response time < 100ms | RH-09 | Defined |
| AC-09 | Typical response time < 10ms | RH-10 | Defined |
| AC-10 | No authentication required | RH-12 | Defined |
| AC-11 | Load test: 50 concurrent calls | RH-11 | Defined |
| AC-12 | Self-contained (no env vars) | RH-14 | Defined |
| AC-13 | Consistent on repeated calls | RH-13 | Defined |
| AC-14 | Returns NextResponse instance | RH-08 | Defined |

---

## Notes

- Tests use Vitest's `describe` and `it` DSL
- No test database or fixtures required
- No mocking needed (endpoint has zero dependencies)
- All tests are deterministic and can run in any order
- Tests should complete in < 500ms total
- Soft assertions (RH-10) indicate performance regression but don't fail the build
