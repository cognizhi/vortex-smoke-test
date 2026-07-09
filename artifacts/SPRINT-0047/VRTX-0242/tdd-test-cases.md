# TDD Test Cases: VRTX-0242 - variant-780851168 smoke test endpoint

## Test Matrix

### Group 1: HTTP Status & Response Body (4 tests)

#### Test RH-01: Returns HTTP 200 status
- **Description**: Verify endpoint returns HTTP 200 status code with ok: true
- **Test ID**: AC-02 (Acceptance Criterion 2)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes
- **Then**: Response status is 200 and response.ok is true
- **Assertion**: `expect(res.status).toBe(200)` and `expect(res.ok).toBe(true)`

#### Test RH-02: Returns correct JSON structure with ok and variant
- **Description**: Verify response body matches spec: `{ok: true, variant: "780851168"}`
- **Test ID**: AC-03 (Acceptance Criterion 3)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and response is parsed as JSON
- **Then**: JSON has `ok: true` and `variant: "780851168"`
- **Assertion**: `expect(json.ok).toBe(true)` and `expect(json.variant).toBe('780851168')`

#### Test RH-03: Response has no extra fields in root object
- **Description**: Verify response JSON has exactly 2 fields: ok and variant
- **Test ID**: AC-04 (Acceptance Criterion 4)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and response is parsed as JSON
- **Then**: Response object has exactly 2 keys
- **Assertion**: `expect(keys).toHaveLength(2)` and `expect(keys.sort()).toEqual(['ok', 'variant'])`

#### Test RH-04: Response has exactly two root fields (ok and variant)
- **Description**: Verify response structure integrity - no hidden fields
- **Test ID**: AC-04 (Acceptance Criterion 4)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and response is parsed as JSON
- **Then**: Root object contains exactly ok and variant fields
- **Assertion**: `expect(rootKeys).toEqual(expect.arrayContaining(['ok', 'variant']))` and `expect(rootKeys).toHaveLength(2)`

### Group 2: Field Type Safety (2 tests)

#### Test RH-05: ok field is boolean true (not just truthy)
- **Description**: Verify ok field is boolean true, not string/number/truthy value
- **Test ID**: AC-05 (Acceptance Criterion 5)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and response is parsed as JSON
- **Then**: ok field has type boolean and value true
- **Assertion**: `expect(typeof json.ok).toBe('boolean')` and `expect(json.ok).toStrictEqual(true)`

#### Test RH-06: variant field is string "780851168" (not number)
- **Description**: Verify variant field is string type, not number or other
- **Test ID**: AC-06 (Acceptance Criterion 6)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and response is parsed as JSON
- **Then**: variant field has type string and value "780851168"
- **Assertion**: `expect(typeof json.variant).toBe('string')` and `expect(json.variant).toStrictEqual('780851168')`

### Group 3: HTTP Headers & Meta (2 tests)

#### Test RH-07: Content-Type header is application/json
- **Description**: Verify Content-Type header is set correctly for JSON response
- **Test ID**: AC-07 (Acceptance Criterion 7)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes
- **Then**: Content-Type header is application/json
- **Assertion**: `expect(res.headers.get('Content-Type')).toBe('application/json')`

#### Test RH-08: Response is a NextResponse instance
- **Description**: Verify response object is a proper NextResponse instance
- **Test ID**: AC-14 (Acceptance Criterion 14)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes
- **Then**: Response is a NextResponse instance
- **Assertion**: `expect(res).toBeInstanceOf(NextResponse)`

### Group 4: Performance (3 tests)

#### Test RH-09: Response time is less than 100ms
- **Description**: Verify endpoint responds within SLA (< 100ms)
- **Test ID**: AC-08 (Acceptance Criterion 8)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and elapsed time is measured
- **Then**: Response time is less than 100ms
- **Assertion**: `expect(elapsedMs).toBeLessThan(100)`

#### Test RH-10: Response time is typically fast (< 10ms)
- **Description**: Verify endpoint typically responds in < 10ms (soft assertion)
- **Test ID**: AC-09 (Acceptance Criterion 9)
- **Given**: GET request to /api/healthz-smoke-780851168
- **When**: Handler executes and elapsed time is measured
- **Then**: Response time is typically less than 10ms
- **Assertion**: `expect(elapsedMs).toBeLessThan(10)` (soft - failure indicates regression)

#### Test RH-11: Under load (50 concurrent calls), all respond within 100ms
- **Description**: Verify endpoint can handle concurrent load
- **Test ID**: AC-11 (Acceptance Criterion 11)
- **Given**: 50 concurrent GET requests to /api/healthz-smoke-780851168
- **When**: All handlers execute in parallel
- **Then**: All return 200 status and total time is reasonable
- **Assertion**: All results have status 200 and total elapsed < 5000ms

### Group 5: Public Access & Consistency (3 tests)

#### Test RH-12: Endpoint requires no authentication
- **Description**: Verify endpoint is publicly accessible without auth headers/cookies
- **Test ID**: AC-10 (Acceptance Criterion 10)
- **Given**: GET request to /api/healthz-smoke-780851168 with no auth
- **When**: Handler executes
- **Then**: Returns 200 status with ok: true
- **Assertion**: `expect(res.status).toBe(200)` and `expect(res.ok).toBe(true)`

#### Test RH-13: Multiple sequential calls return consistent responses
- **Description**: Verify response consistency across multiple calls
- **Test ID**: AC-13 (Acceptance Criterion 13)
- **Given**: Three sequential GET requests to /api/healthz-smoke-780851168
- **When**: Handlers execute sequentially
- **Then**: All return identical status, headers, and body
- **Assertion**: All responses have status 200, Content-Type application/json, and body `{ok: true, variant: "780851168"}`

#### Test RH-14: Endpoint is self-contained and requires no env vars
- **Description**: Verify endpoint works regardless of environment variables
- **Test ID**: AC-12 (Acceptance Criterion 12)
- **Given**: GET request to /api/healthz-smoke-780851168 with no special env setup
- **When**: Handler executes
- **Then**: Returns 200 with correct response body
- **Assertion**: `expect(res.status).toBe(200)` and variant is "780851168"

## Test Coverage Summary
- **Total Tests**: 14
- **Groups**: 5 (Status & Body, Type Safety, Headers & Meta, Performance, Access & Consistency)
- **Coverage**: Response format, types, performance, consistency, public access
