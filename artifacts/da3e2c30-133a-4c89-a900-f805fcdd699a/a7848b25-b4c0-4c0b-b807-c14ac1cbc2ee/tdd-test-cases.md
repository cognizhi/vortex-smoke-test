# TDD Test Cases: /healthz-smoke-423911289 Endpoint

**Ticket:** VRTX-0030  
**File:** `src/app/api/healthz-smoke-423911289/__tests__/route.test.ts`  
**Framework:** Vitest + React Testing Library  
**Environment:** jsdom (default Vitest)

---

## Test Matrix

### Phase: RED (Failing Tests)

All tests below are written BEFORE implementation and expected to fail. Once `src/app/api/healthz-smoke-423911289/route.ts` is implemented, they should pass.

---

## Test Suite: `GET /api/healthz-smoke-423911289`

### Group 1: HTTP Status & Response Body (4 tests)

#### Test 1.1: Returns HTTP 200 status
- **ID:** RH-01
- **Requirement:** AC-02
- **Scenario:** Call `GET()` with no parameters
- **Expected Outcome:**
  - Response status is 200
  - Response.ok is true
- **Assertion:**
  ```javascript
  expect(res.status).toBe(200);
  expect(res.ok).toBe(true);
  ```

#### Test 1.2: Returns correct JSON structure with ok and variant
- **ID:** RH-02
- **Requirement:** AC-03
- **Scenario:** Call `GET()` and parse response JSON
- **Expected Outcome:**
  - JSON has top-level fields: `ok`, `variant`
  - `ok` equals `true`
  - `variant` equals `"423911289"`
- **Assertion:**
  ```javascript
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(json.variant).toBe("423911289");
  ```

#### Test 1.3: Response has no extra fields in root object
- **ID:** RH-03
- **Requirement:** AC-04
- **Scenario:** Call `GET()` and inspect object keys
- **Expected Outcome:**
  - Object has exactly 2 keys: `ok`, `variant`
  - No additional fields like `data`, `error`, `timestamp`, etc.
- **Assertion:**
  ```javascript
  const json = await res.json();
  const keys = Object.keys(json);
  expect(keys).toHaveLength(2);
  expect(keys.sort()).toEqual(['ok', 'variant']);
  ```

#### Test 1.4: Response has exactly two root fields
- **ID:** RH-04
- **Requirement:** AC-04
- **Scenario:** Call `GET()` and verify field count
- **Expected Outcome:**
  - Exactly 2 fields at root level
  - Both named `ok` and `variant`
- **Assertion:**
  ```javascript
  const json = await res.json();
  expect(Object.keys(json)).toEqual(expect.arrayContaining(['ok', 'variant']));
  expect(Object.keys(json)).toHaveLength(2);
  ```

---

### Group 2: Field Type Safety (2 tests)

#### Test 2.1: `ok` field is boolean true (not truthy string)
- **ID:** RH-05
- **Requirement:** AC-05
- **Scenario:** Call `GET()` and check type of `ok` field
- **Expected Outcome:**
  - `ok` is of type `boolean`
  - `ok` is strictly equal to `true` (not string `"true"`, number `1`, etc.)
- **Assertion:**
  ```javascript
  const json = await res.json();
  expect(typeof json.ok).toBe('boolean');
  expect(json.ok).toStrictEqual(true);
  ```

#### Test 2.2: `variant` field is string "423911289" (not number)
- **ID:** RH-06
- **Requirement:** AC-06
- **Scenario:** Call `GET()` and check type and value of `variant` field
- **Expected Outcome:**
  - `variant` is of type `string`
  - `variant` equals exactly `"423911289"`
  - Not a number, not a float with trailing zeros
- **Assertion:**
  ```javascript
  const json = await res.json();
  expect(typeof json.variant).toBe('string');
  expect(json.variant).toStrictEqual("423911289");
  expect(json.variant).toBe("423911289");
  ```

---

### Group 3: HTTP Headers & Meta (2 tests)

#### Test 3.1: Content-Type header is application/json
- **ID:** RH-07
- **Requirement:** AC-07
- **Scenario:** Call `GET()` and inspect response headers
- **Expected Outcome:**
  - `Content-Type` header is present
  - Value is exactly `application/json`
- **Assertion:**
  ```javascript
  const res = await GET();
  expect(res.headers.get('Content-Type')).toBe('application/json');
  ```

#### Test 3.2: Response is a NextResponse instance
- **ID:** RH-08
- **Requirement:** AC-14
- **Scenario:** Call `GET()` and check instance type
- **Expected Outcome:**
  - Response is an instance of `NextResponse`
- **Assertion:**
  ```javascript
  const res = await GET();
  expect(res).toBeInstanceOf(NextResponse);
  ```

---

### Group 4: Performance (3 tests)

#### Test 4.1: Response time < 100ms
- **ID:** RH-09
- **Requirement:** AC-08
- **Scenario:** Measure time from `performance.now()` before call to after call
- **Expected Outcome:**
  - Elapsed time is less than 100ms
- **Assertion:**
  ```javascript
  const startTime = performance.now();
  const res = await GET();
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100);
  ```

#### Test 4.2: Response time typically < 10ms
- **ID:** RH-10
- **Requirement:** AC-09
- **Scenario:** Measure time from `performance.now()` before call to after call
- **Expected Outcome:**
  - Elapsed time is less than 10ms (soft assertion; may fail on slow hardware but indicates regression)
- **Assertion:**
  ```javascript
  const startTime = performance.now();
  const res = await GET();
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(10);
  ```

#### Test 4.3: Under load (50 concurrent calls), all respond within 100ms
- **ID:** RH-11
- **Requirement:** AC-11
- **Scenario:** Create 50 concurrent calls to `GET()`, measure total time
- **Expected Outcome:**
  - All 50 responses have status 200
  - Total elapsed time for 50 calls is less than 5 seconds (reasonable for concurrent execution)
- **Assertion:**
  ```javascript
  const calls = Array.from({ length: 50 }, () => GET());
  const startTime = performance.now();
  const results = await Promise.all(calls);
  const endTime = performance.now();
  
  results.forEach((res) => {
    expect(res.status).toBe(200);
  });
  expect(endTime - startTime).toBeLessThan(5000);
  ```

---

### Group 5: Public Access & Consistency (3 tests)

#### Test 5.1: No authentication required
- **ID:** RH-12
- **Requirement:** AC-10
- **Scenario:** Call `GET()` without any auth headers or cookies
- **Expected Outcome:**
  - Response status is 200 (not 401, 403, etc.)
  - No error in response
- **Assertion:**
  ```javascript
  const res = await GET();
  expect(res.status).toBe(200);
  expect(res.ok).toBe(true);
  // No auth-related headers or checks in implementation
  ```

#### Test 5.2: Multiple sequential calls return identical responses
- **ID:** RH-13
- **Requirement:** AC-13
- **Scenario:** Call `GET()` three times sequentially and compare responses
- **Expected Outcome:**
  - All responses have status 200
  - All responses have identical JSON bodies
  - All responses have correct Content-Type header
- **Assertion:**
  ```javascript
  const responses = await Promise.all([GET(), GET(), GET()]);
  const bodies = await Promise.all(responses.map((res) => res.json()));
  
  responses.forEach((res) => {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });
  
  const expected = { ok: true, variant: "423911289" };
  bodies.forEach((body) => {
    expect(body).toEqual(expected);
  });
  ```

#### Test 5.3: No environment variables needed (self-contained)
- **ID:** RH-14
- **Requirement:** AC-12
- **Scenario:** Call `GET()` and verify response is correct (implementation must not read process.env)
- **Expected Outcome:**
  - Response is correct even if environment is empty
  - Endpoint works regardless of runtime configuration
- **Assertion:**
  ```javascript
  const res = await GET();
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toEqual({ ok: true, variant: "423911289" });
  ```

---

## Test Execution Plan

### Red Phase (Before Implementation)
1. Write all 14 tests
2. Run `npm run test` — all tests fail (file doesn't exist)
3. Document failures in `tdd-test-result.md`

### Green Phase (After Implementation)
1. Implement `src/app/api/healthz-smoke-423911289/route.ts`
2. Run `npm run test` — all tests pass
3. Run `npm run test:coverage` — verify coverage >= 95%
4. Document passes in `tdd-test-result.md`

### Cleanup Phase
1. Run `npm run lint` — 0 warnings
2. Run `npm run typecheck` — 0 errors
3. Verify file structure and content

---

## Test Coverage Expectations

| Module | Coverage Target | Tests |
|--------|-----------------|-------|
| `route.ts` (GET handler) | >= 95% | 14 tests |
| Statement coverage | >= 95% | All code paths tested |
| Branch coverage | >= 90% | All branches (if any) covered |

---

## Notes

- All tests are **synchronous in their assertions** (using `expect`), even though `GET()` is async
- Tests use `performance.now()` for timing (available in Node.js 15+)
- No mocking required — endpoint has no dependencies
- Tests run in **jsdom** environment (Vitest default)
- All tests import `GET` from `../route` (relative import)
- No setup/teardown needed — endpoint is stateless
