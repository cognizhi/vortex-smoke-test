# TDD Test Cases: VRTX-0183 — GET /healthz-smoke-54367903

**Ticket:** VRTX-0183  
**Sprint:** SPRINT-0037  
**Test File:** `src/app/api/healthz-smoke-54367903/__tests__/route.test.ts`  
**Framework:** Vitest + React Testing Library

---

## Test Structure

Tests are organized into 5 logical groups (15 test cases total):

### Group 1: HTTP Status & Response Body (4 tests)
Tests that verify the endpoint responds with correct HTTP status code and JSON structure.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-01 | Returns HTTP 200 status | `status === 200` | AC-01: Endpoint responds 200 |
| RH-02 | Returns correct JSON structure | `{ data: { ok: true, variant: "54367903" }, error: null }` | AC-01: Response matches spec |
| RH-03 | Data object has no extra fields | `keys(data) === ['ok', 'variant']` | AC-01: Exact field set |
| RH-04 | Exactly two root fields | `keys(root) === ['data', 'error']` | AC-01: Exact structure |

### Group 2: Field Type Safety (3 tests)
Tests that verify field types are correct (not just truthy values).

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-05 | ok field is boolean true | `typeof ok === 'boolean'` AND `ok === true` | AC-02: Type safety |
| RH-06 | variant field is string | `typeof variant === 'string'` AND `variant === '54367903'` | AC-02: Type safety |
| RH-07 | error field is null | `error === null` (not undefined) | AC-02: Type safety |

### Group 3: HTTP Headers & Meta (2 tests)
Tests that verify response headers and NextResponse compliance.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-08 | Content-Type is application/json | Header equals `application/json` | AC-03: Content-Type |
| RH-09 | Response is NextResponse instance | `instanceof NextResponse` | AC-04: NextResponse type |

### Group 4: Performance (3 tests)
Tests that verify the endpoint meets performance requirements.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-10 | Response time < 100ms | Single call duration < 100ms | AC-05: Performance |
| RH-11 | Response time < 10ms (typical) | Single call duration < 10ms | AC-05: Typical performance |
| RH-12 | Load test: 50 concurrent calls | All respond 200, total < 5s | AC-05: Load tolerance |

### Group 5: Public Access & Consistency (3 tests)
Tests that verify the endpoint is public, consistent, and self-contained.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-13 | No authentication required | Responds 200 without auth headers | AC-06: Public endpoint |
| RH-14 | Consistent responses | 3 sequential calls identical | AC-07: Consistency |
| RH-15 | Self-contained (no env vars) | Works without env vars | AC-08: Self-contained |

---

## Detailed Test Specifications

### RH-01: Returns HTTP 200 status
**Test:** Verify the endpoint returns an HTTP 200 success status.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET()
Then response.status === 200
```

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
```

---

### RH-02: Returns correct JSON structure
**Test:** Verify the response body matches spec with all required fields.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and parsing JSON
Then json.data.ok === true AND json.data.variant === "54367903" AND json.error === null
```

**Assertion:**
```typescript
const res = await GET();
const json = await res.json() as { 
  data: { ok: boolean; variant: string }; 
  error: null 
};
expect(json.data.ok).toBe(true);
expect(json.data.variant).toBe('54367903');
expect(json.error).toBeNull();
```

---

### RH-03: Data object has no extra fields
**Test:** Verify the data object contains exactly the specified fields.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and parsing JSON
Then data object has exactly keys: ['ok', 'variant']
```

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as Record<string, unknown>;
const dataKeys = Object.keys(json.data as Record<string, unknown>);
expect(dataKeys.sort()).toEqual(['ok', 'variant']);
expect(dataKeys).toHaveLength(2);
```

---

### RH-04: Exactly two root fields
**Test:** Verify the response has exactly two root-level fields.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and parsing JSON
Then root keys are exactly ['data', 'error']
```

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as Record<string, unknown>;
const rootKeys = Object.keys(json);
expect(rootKeys).toEqual(expect.arrayContaining(['data', 'error']));
expect(rootKeys).toHaveLength(2);
```

---

### RH-05: ok field is boolean true
**Test:** Verify the `ok` field is specifically the boolean value `true`.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and parsing JSON
Then typeof json.data.ok === 'boolean' AND json.data.ok === true
```

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as { data: { ok: unknown } };
expect(typeof json.data.ok).toBe('boolean');
expect(json.data.ok).toStrictEqual(true);
```

---

### RH-06: variant field is string "54367903"
**Test:** Verify the `variant` field is a string.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and parsing JSON
Then typeof json.data.variant === 'string' AND json.data.variant === "54367903"
```

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as { data: { variant: unknown } };
expect(typeof json.data.variant).toBe('string');
expect(json.data.variant).toStrictEqual('54367903');
```

---

### RH-07: error field is null
**Test:** Verify the `error` field is explicitly null (not undefined).

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and parsing JSON
Then json.error === null (not undefined, empty string, etc.)
```

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as Record<string, unknown>;
expect(json.error).toStrictEqual(null);
expect('error' in json).toBe(true);
```

---

### RH-08: Content-Type is application/json
**Test:** Verify the response declares the correct content type.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET()
Then response header 'Content-Type' === 'application/json'
```

**Assertion:**
```typescript
const res = await GET();
expect(res.headers.get('Content-Type')).toBe('application/json');
```

---

### RH-09: Response is NextResponse instance
**Test:** Verify the function returns a proper Next.js NextResponse object.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET()
Then response instanceof NextResponse === true
```

**Assertion:**
```typescript
const res = await GET();
expect(res).toBeInstanceOf(NextResponse);
```

---

### RH-10: Response time < 100ms
**Test:** Verify the endpoint responds within the performance threshold.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
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

---

### RH-11: Response time < 10ms (typical)
**Test:** Verify the endpoint typically responds in < 10ms.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() and measuring elapsed time
Then elapsed time < 10ms (soft assertion)
```

**Assertion:**
```typescript
const startTime = performance.now();
await GET();
const endTime = performance.now();
const elapsedMs = endTime - startTime;
expect(elapsedMs).toBeLessThan(10); // Soft assertion
```

---

### RH-12: Load test: 50 concurrent calls
**Test:** Verify the endpoint handles concurrent calls without degradation.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
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
expect(totalElapsedMs).toBeLessThan(5000);
```

---

### RH-13: No authentication required
**Test:** Verify the endpoint is publicly accessible without authentication.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() without authentication headers or cookies
Then response status === 200
```

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
```

---

### RH-14: Consistent responses on repeated calls
**Test:** Verify the endpoint returns identical responses on repeated calls.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() 3 times sequentially
Then all responses have status 200 AND all bodies equal expected structure
```

**Assertion:**
```typescript
const responses = await Promise.all([GET(), GET(), GET()]);
const bodies = await Promise.all(responses.map((res) => res.json()));

responses.forEach((res) => {
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toBe('application/json');
});

const expected = { data: { ok: true, variant: '54367903' }, error: null };
bodies.forEach((body) => {
  expect(body).toEqual(expected);
});
```

---

### RH-15: Self-contained (no environment variables)
**Test:** Verify the endpoint requires no environment variable setup.

**Setup:**
```
Given the GET /api/healthz-smoke-54367903 endpoint
When calling GET() without special env vars
Then response status === 200 AND response is correct
```

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
const json = (await res.json()) as { 
  data: { ok: boolean; variant: string }; 
  error: null 
};
expect(json.data.ok).toBe(true);
expect(json.data.variant).toBe('54367903');
expect(json.error).toBeNull();
```

---

## Test Execution Plan

### Phase 1: RED (Failing Tests)
1. Write all 15 test cases
2. Run `npm run test -- src/app/api/healthz-smoke-54367903` — expect 15 failures
3. Record failures in tdd-test-result.md

### Phase 2: GREEN (Passing Tests)
1. Implement route handler
2. Run `npm run test -- src/app/api/healthz-smoke-54367903` — expect 15 passes
3. Run `npm run typecheck` — expect 0 errors
4. Run `npm run lint` — expect 0 warnings
5. Record results in tdd-test-result.md

### Phase 3: REFACTOR (Code Review & Polish)
1. Review for clarity and pattern consistency
2. Verify JSDoc is complete
3. Ensure no TypeScript implicit any
4. Confirm consistency with reference implementation
5. Record review in tdd-test-result.md

---

## Mapping to Acceptance Criteria

| AC # | Description | Test IDs | Status |
|------|-------------|----------|--------|
| AC-01 | Endpoint responds 200 with correct structure | RH-01, RH-02, RH-03, RH-04 | Defined |
| AC-02 | Field type safety (bool, string, null) | RH-05, RH-06, RH-07 | Defined |
| AC-03 | Content-Type header is application/json | RH-08 | Defined |
| AC-04 | Returns NextResponse instance | RH-09 | Defined |
| AC-05 | Performance < 100ms (typical < 10ms) | RH-10, RH-11, RH-12 | Defined |
| AC-06 | No authentication required | RH-13 | Defined |
| AC-07 | Consistent responses | RH-14 | Defined |
| AC-08 | Self-contained (no env vars) | RH-15 | Defined |

---

## Notes

- Tests use Vitest's `describe` and `it` DSL
- No test database or fixtures required
- No mocking needed (endpoint has zero dependencies)
- All tests are deterministic and can run in any order
- Tests should complete in < 500ms total
- Soft assertions (RH-11) indicate performance regression but don't fail
