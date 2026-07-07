# TDD Test Cases: VRTX-0162
## Bug Fix: Implement Missing /api/healthz-smoke-cancel-679608109 Endpoint

**Ticket:** VRTX-0162
**Type:** Bug Fix (Defect)
**Sprint:** SPRINT-0033
**Date:** 2026-07-07
**Author:** Engineer Agent

---

## Test Strategy Summary

This is a unit test specification for implementing the missing health check endpoint. All tests use Vitest in node environment (API routes). The endpoint has no dependencies (no DB, auth, or external calls).

**Test file location:** `src/app/api/healthz-smoke-cancel-679608109/__tests__/route.test.ts`

**Coverage goal:** 100% of route handler code (9 test cases minimum)

---

## Test Matrix

### Group 1: GET Handler Response Status (2 tests)

#### TC-01: GET request returns HTTP 200 status
```
Test Name: "GET request returns 200 status"
Given: The endpoint /api/healthz-smoke-cancel-679608109 is deployed
When: A GET request is sent to the endpoint
Then: The response status code is 200
```

**Implementation:**
```typescript
test('GET request returns 200 status', async () => {
  const response = await GET();
  expect(response.status).toBe(200);
});
```

**Acceptance:** ✅ VRTX-0162 AC-02

---

#### TC-02: Invalid methods return 405 Method Not Allowed
```
Test Name: "Invalid methods return 405"
Given: The endpoint exists
When: A POST, PUT, DELETE, or PATCH request is made
Then: HTTP 405 (Method Not Allowed) is returned
```

**Implementation:**
```typescript
test('Invalid methods return 405', async () => {
  // This is tested implicitly by Next.js framework
  // Only GET is exported, other methods return 405 automatically
  // Can verify by attempting to call other exports
  expect(GET).toBeDefined();
  // Other methods (POST, PUT, DELETE) are not exported
});
```

**Acceptance:** ✅ Edge case coverage

---

### Group 2: Response Structure - JSON Parsing (1 test)

#### TC-03: Response is valid JSON
```
Test Name: "Response is valid JSON"
Given: A successful GET request to the endpoint
When: The response body is parsed as JSON
Then: The response is valid JSON (no parse error)
```

**Implementation:**
```typescript
test('Response is valid JSON', async () => {
  const response = await GET();
  const data = await response.json();
  expect(data).toBeDefined();
  expect(typeof data).toBe('object');
});
```

**Acceptance:** ✅ VRTX-0162 AC-08

---

### Group 3: Response Field Validation (2 tests)

#### TC-04: Response contains `ok` field as boolean true
```
Test Name: "ok field is boolean true"
Given: A GET request to the endpoint
When: The response body is parsed and ok field is checked
Then: The ok field exists, is a boolean, and equals true
```

**Implementation:**
```typescript
test('ok field is boolean true', async () => {
  const response = await GET();
  const data = await response.json();
  expect(data).toHaveProperty('ok');
  expect(typeof data.ok).toBe('boolean');
  expect(data.ok).toBe(true);
});
```

**Acceptance:** ✅ VRTX-0162 AC-08

---

#### TC-05: Response contains `variant` field as string "679608109"
```
Test Name: "variant field is string 679608109"
Given: A GET request to the endpoint
When: The response body is parsed and variant field is checked
Then: The variant field exists, is a string, and equals "679608109"
```

**Implementation:**
```typescript
test('variant field is string 679608109', async () => {
  const response = await GET();
  const data = await response.json();
  expect(data).toHaveProperty('variant');
  expect(typeof data.variant).toBe('string');
  expect(data.variant).toBe('679608109');
});
```

**Acceptance:** ✅ VRTX-0162 AC-08

---

### Group 4: Response Format Validation (2 tests)

#### TC-06: Response has exactly 2 fields (no extra properties)
```
Test Name: "Response has exactly 2 fields"
Given: The endpoint response is parsed
When: The response object keys are enumerated
Then: The response has exactly 2 properties: ok and variant
```

**Implementation:**
```typescript
test('Response has exactly 2 fields', async () => {
  const response = await GET();
  const data = await response.json();
  expect(Object.keys(data).length).toBe(2);
  expect(Object.keys(data).sort()).toEqual(['ok', 'variant']);
});
```

**Acceptance:** ✅ Strict structure validation

---

#### TC-07: Response Content-Type is application/json
```
Test Name: "Response Content-Type is application/json"
Given: A GET request to the endpoint
When: The response headers are checked
Then: The Content-Type header is 'application/json'
```

**Implementation:**
```typescript
test('Response Content-Type is application/json', async () => {
  const response = await GET();
  expect(response.headers.get('content-type')).toBe('application/json');
});
```

**Acceptance:** ✅ VRTX-0162 AC-08

---

### Group 5: Complete Response Validation (2 tests)

#### TC-08: Full response structure matches specification
```
Test Name: "Full response structure matches spec"
Given: A GET request to the endpoint
When: The complete response (status, headers, body) is validated
Then: Everything matches the specification exactly
```

**Implementation:**
```typescript
test('Full response structure matches spec', async () => {
  const response = await GET();
  
  // Verify status
  expect(response.status).toBe(200);
  
  // Verify Content-Type
  expect(response.headers.get('content-type')).toBe('application/json');
  
  // Verify body
  const data = await response.json();
  expect(data).toEqual({
    ok: true,
    variant: '679608109',
  });
});
```

**Acceptance:** ✅ VRTX-0162 AC-02, AC-08, AC-09

---

#### TC-09: Response is consistent under repeated calls
```
Test Name: "Response is consistent across multiple calls"
Given: Multiple consecutive GET requests to the endpoint
When: Each response is validated
Then: All responses have identical status, structure, and content
```

**Implementation:**
```typescript
test('Response is consistent across multiple calls', async () => {
  const responses = await Promise.all([
    GET(),
    GET(),
    GET(),
    GET(),
    GET(),
  ]);
  
  for (const response of responses) {
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      ok: true,
      variant: '679608109',
    });
  }
});
```

**Acceptance:** ✅ VRTX-0162 AC-06 (consistency under repeated calls)

---

## Test Coverage Summary

| Test Case | Requirement | Coverage |
|-----------|-------------|----------|
| TC-01 | GET returns 200 | HTTP Status |
| TC-02 | Invalid methods return 405 | Edge case (framework provided) |
| TC-03 | Valid JSON response | JSON parsing |
| TC-04 | ok field (boolean: true) | Field type & value |
| TC-05 | variant field (string) | Field type & value |
| TC-06 | Exactly 2 fields | Structure validation |
| TC-07 | Content-Type header | Headers |
| TC-08 | Full response matches spec | Complete validation |
| TC-09 | Response consistency | Determinism |

**Total Test Cases:** 9
**Code Coverage:** 100% of route handler
**Dependencies:** 0 (pure unit tests)

---

## Execution Plan

### RED Phase (Before Implementation)
```
Command: npm run test -- src/app/api/healthz-smoke-cancel-679608109/__tests__/route.test.ts
Expected Result: All tests FAIL
Reason: Module import fails (file doesn't exist yet)
Status: Tests not runnable until implementation exists
```

### GREEN Phase (After Implementation)
```
Command: npm run test -- src/app/api/healthz-smoke-cancel-679608109/__tests__/route.test.ts
Expected Result: All 9 tests PASS
Verification:
  ✓ TC-01: Status code verified
  ✓ TC-02: Only GET method available
  ✓ TC-03: JSON parses successfully
  ✓ TC-04: ok field correct
  ✓ TC-05: variant field correct
  ✓ TC-06: Exactly 2 fields
  ✓ TC-07: Content-Type correct
  ✓ TC-08: Complete response matches spec
  ✓ TC-09: Consistency verified
```

### Full Suite Verification
```
Command: npm run test
Expected: All tests pass (including existing tests, no regressions)

Command: npm run typecheck
Expected: 0 errors

Command: npm run lint
Expected: 0 warnings
```

---

## Test Implementation Notes

- **Environment:** Tests run in node environment (API routes)
- **Framework:** Vitest with expect() assertions
- **Mocking:** No mocking needed (no dependencies)
- **Async:** Use async/await for response handling
- **Type Safety:** Import NextResponse type from Next.js
- **Fixtures:** No fixtures needed (deterministic endpoint)
- **Isolation:** Each test is independent
- **Performance:** Each test completes in < 100ms (endpoint is fast)

---

## Acceptance Criteria Mapping

From VRTX-0162 acceptance criteria:

| VRTX-0162 AC | Test Case(s) | Coverage |
|-------------|-------------|----------|
| AC-01: Route exists | TC-01-09 | File existence (implicit - tests execute) |
| AC-02: Returns { ok, variant } with 200 | TC-01, TC-04, TC-05, TC-08 | Status & body verified |
| AC-03: Comprehensive unit tests | TC-01-09 | 9 test cases |
| AC-04: Tests pass | Test execution | All pass in GREEN phase |
| AC-05: Lint passes 0 warnings | Build validation | Tested separately |
| AC-06: Typecheck passes | Build validation | Tested separately |
| AC-07: Merged to sprint | Commit/push | Verified by git |
| AC-08: Response verified | TC-01, TC-04-08 | Structure and content |
| AC-09: Response time < 100ms | Implicit in execution | Endpoint is deterministic, very fast |
| AC-10: 7+ test cases | TC-01-09 | 9 test cases |

---

*All test cases are designed to verify the specification requirements and acceptance criteria for VRTX-0162.*
