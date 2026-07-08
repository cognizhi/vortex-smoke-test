# TDD Test Cases (Corrected): VRTX-0185 — GET /healthz-smoke-54367903

**Ticket:** VRTX-0185  
**Sprint:** SPRINT-0037  
**Test File:** `src/app/api/healthz-smoke-54367903/__tests__/route.test.ts`  
**Framework:** Vitest + React Testing Library

---

## Test Structure (Corrected)

Tests verify the **corrected simple format** (no wrapper): `{ ok: true, variant: "54367903" }`

Tests organized into 4 logical groups (13 test cases total):

### Group 1: HTTP Status & Response Body (3 tests)
Tests that verify the endpoint responds with correct HTTP status and structure.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-01 | Returns HTTP 200 status | `status === 200` | AC-01: Responds 200 |
| RH-02 | Returns correct JSON structure | `{ ok: true, variant: "54367903" }` | AC-01: Correct format |
| RH-03 | No extra fields in root object | Exactly 2 root keys: ok, variant | AC-01: Exact structure |

### Group 2: Field Type Safety (2 tests)
Tests that verify field types are correct.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-04 | ok field is boolean true | `typeof ok === 'boolean'` AND `ok === true` | AC-02: Type safety |
| RH-05 | variant field is string | `typeof variant === 'string'` AND `variant === '54367903'` | AC-02: Type safety |

### Group 3: HTTP Headers & Meta (2 tests)
Tests that verify response headers and NextResponse compliance.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-06 | Content-Type is application/json | Header equals `application/json` | AC-03: Content-Type |
| RH-07 | Response is NextResponse instance | `instanceof NextResponse` | AC-04: NextResponse type |

### Group 4: Performance & Consistency (6 tests)
Tests that verify performance, load handling, and consistency.

| Test ID | Test Name | Expected | Acceptance Criterion |
|---------|-----------|----------|----------------------|
| RH-08 | Response time < 100ms | Single call < 100ms | AC-05: Performance |
| RH-09 | Response time < 10ms (typical) | Single call < 10ms | AC-05: Typical |
| RH-10 | Load test: 50 concurrent calls | All respond 200, total < 5s | AC-05: Load |
| RH-11 | No authentication required | Responds 200 without auth | AC-06: Public |
| RH-12 | Consistent responses | 3 sequential calls identical | AC-07: Consistency |
| RH-13 | Self-contained (no env vars) | Works without env vars | AC-08: Self-contained |

---

## Changes from Previous (Incorrect) Test Suite

### Removed Tests
- ❌ RH-03 (OLD): "data object has no extra fields" — wrapper not in response
- ❌ RH-04 (OLD): "exactly two root fields (data and error)" — wrapper fields removed
- ❌ RH-07 (OLD): "error field is explicitly null" — error field removed

### Renamed/Updated Tests
- ✏️ RH-02 (NEW): "returns correct JSON structure" — now checks simple format
- ✏️ RH-03 (NEW): "No extra fields in root object" — checks root level only (2 keys)
- ✏️ RH-04 (NEW): "ok field is boolean true" — unchanged logic, different test ID
- ✏️ RH-05 (NEW): "variant field is string" — unchanged logic, different test ID

### Retained Tests
- ✅ RH-01: HTTP 200 status (unchanged)
- ✅ RH-06: Content-Type header (unchanged)
- ✅ RH-07: NextResponse instance (unchanged, new ID)
- ✅ RH-08-13: Performance, consistency, auth, load (unchanged)

---

## Detailed Test Specifications (Corrected Format)

### RH-01: Returns HTTP 200 status
**Test:** Verify the endpoint returns an HTTP 200 success status.

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
```

---

### RH-02: Returns correct JSON structure
**Test:** Verify the response body matches corrected spec: `{ ok: true, variant: "54367903" }`.

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as {
  ok: boolean;
  variant: string;
};
expect(json.ok).toBe(true);
expect(json.variant).toBe('54367903');
```

---

### RH-03: No extra fields in root object
**Test:** Verify the response contains exactly two root-level fields.

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as Record<string, unknown>;
const keys = Object.keys(json);
expect(keys).toHaveLength(2);
expect(keys.sort()).toEqual(['ok', 'variant']);
```

---

### RH-04: ok field is boolean true
**Test:** Verify the `ok` field is specifically the boolean value `true`.

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as { ok: unknown };
expect(typeof json.ok).toBe('boolean');
expect(json.ok).toStrictEqual(true);
```

---

### RH-05: variant field is string
**Test:** Verify the `variant` field is a string with correct value.

**Assertion:**
```typescript
const res = await GET();
const json = (await res.json()) as { variant: unknown };
expect(typeof json.variant).toBe('string');
expect(json.variant).toStrictEqual('54367903');
```

---

### RH-06: Content-Type is application/json
**Test:** Verify the response declares the correct content type.

**Assertion:**
```typescript
const res = await GET();
expect(res.headers.get('Content-Type')).toBe('application/json');
```

---

### RH-07: Response is NextResponse instance
**Test:** Verify the function returns a proper Next.js NextResponse object.

**Assertion:**
```typescript
const res = await GET();
expect(res).toBeInstanceOf(NextResponse);
```

---

### RH-08: Response time < 100ms
**Test:** Verify the endpoint responds within the performance threshold.

**Assertion:**
```typescript
const startTime = performance.now();
await GET();
const endTime = performance.now();
const elapsedMs = endTime - startTime;
expect(elapsedMs).toBeLessThan(100);
```

---

### RH-09: Response time < 10ms (typical)
**Test:** Verify the endpoint typically responds in < 10ms.

**Assertion:**
```typescript
const startTime = performance.now();
await GET();
const endTime = performance.now();
const elapsedMs = endTime - startTime;
expect(elapsedMs).toBeLessThan(10); // Soft assertion
```

---

### RH-10: Load test: 50 concurrent calls
**Test:** Verify the endpoint handles concurrent calls without degradation.

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

### RH-11: No authentication required
**Test:** Verify the endpoint is publicly accessible without authentication.

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
```

---

### RH-12: Consistent responses on repeated calls
**Test:** Verify the endpoint returns identical responses on repeated calls.

**Assertion:**
```typescript
const responses = await Promise.all([GET(), GET(), GET()]);
const bodies = await Promise.all(responses.map((res) => res.json()));

responses.forEach((res) => {
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toBe('application/json');
});

const expected = { ok: true, variant: '54367903' };
bodies.forEach((body) => {
  expect(body).toEqual(expected);
});
```

---

### RH-13: Self-contained (no environment variables)
**Test:** Verify the endpoint requires no environment variable setup.

**Assertion:**
```typescript
const res = await GET();
expect(res.status).toBe(200);
const json = (await res.json()) as { ok: boolean; variant: string };
expect(json.ok).toBe(true);
expect(json.variant).toBe('54367903');
```

---

## Acceptance Criteria Mapping

| AC # | Description | Test IDs | Status |
|------|-------------|----------|--------|
| AC-01 | Response format: `{ ok, variant }` | RH-01, RH-02, RH-03 | Defined |
| AC-02 | Field type safety | RH-04, RH-05 | Defined |
| AC-03 | Content-Type header | RH-06 | Defined |
| AC-04 | NextResponse instance | RH-07 | Defined |
| AC-05 | Performance < 100ms | RH-08, RH-09, RH-10 | Defined |
| AC-06 | No authentication | RH-11 | Defined |
| AC-07 | Consistency | RH-12 | Defined |
| AC-08 | Self-contained | RH-13 | Defined |

---

## Notes

- Tests use Vitest's `describe` and `it` DSL
- No test database or fixtures required
- No mocking needed (endpoint has zero dependencies)
- All tests are deterministic
- Tests should complete in < 500ms total
- Simple format (no wrapper) enables consistency with all variant endpoints
