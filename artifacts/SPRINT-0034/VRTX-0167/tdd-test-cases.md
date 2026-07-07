# TDD Test Cases: VRTX-0167
## Health Check Endpoint /api/healthz-smoke-688707801

### Test Matrix

#### GROUP 1: HTTP Status & Response Body (4 tests)
These tests verify the core response structure and HTTP status code.

| ID | Test Name | Scenario | Expected Outcome | AC |
|---|---|---|---|---|
| RH-01 | Returns HTTP 200 status | Call GET() | Response status === 200 and response.ok === true | AC-02 |
| RH-02 | Correct JSON structure | Call GET() and parse JSON | JSON contains `ok: true` and `variant: "688707801"` | AC-03 |
| RH-03 | No extra fields in root object | Call GET() and check Object.keys(json) | Exactly 2 fields: ok and variant | AC-04 |
| RH-04 | Exactly two root fields | Call GET() and verify keys | Keys array === ['ok', 'variant'] after sort | AC-04 |

#### GROUP 2: Field Type Safety (2 tests)
Verify that field types match spec (boolean, string) not truthy values.

| ID | Test Name | Scenario | Expected Outcome | AC |
|---|---|---|---|---|
| RH-05 | ok field is boolean true | Get json.ok | typeof json.ok === 'boolean' and json.ok === true | AC-05 |
| RH-06 | variant is string "688707801" | Get json.variant | typeof json.variant === 'string' and value === "688707801" | AC-06 |

#### GROUP 3: HTTP Headers & Meta (2 tests)
Verify HTTP headers and response type are correct.

| ID | Test Name | Scenario | Expected Outcome | AC |
|---|---|---|---|---|
| RH-07 | Content-Type is application/json | Call GET() and check header | response.headers.get('Content-Type') === 'application/json' | AC-07 |
| RH-08 | Response is NextResponse instance | Call GET() and check type | response instanceof NextResponse === true | AC-14 |

#### GROUP 4: Performance (3 tests)
Verify response time meets performance targets.

| ID | Test Name | Scenario | Expected Outcome | AC |
|---|---|---|---|---|
| RH-09 | Response < 100ms | Time single call | endTime - startTime < 100ms | AC-08 |
| RH-10 | Response typically < 10ms | Time single call | endTime - startTime < 10ms (soft assertion) | AC-09 |
| RH-11 | Under load (50 calls) all < 100ms | Concurrent GET() x50 | All 50 return status 200 within 5s total | AC-11 |

#### GROUP 5: Public Access & Consistency (3 tests)
Verify endpoint requires no auth and is consistent.

| ID | Test Name | Scenario | Expected Outcome | AC |
|---|---|---|---|---|
| RH-12 | No authentication required | Call GET() without headers | Returns 200, no auth error | AC-10 |
| RH-13 | Multiple calls consistent | Call GET() 3 times sequentially | All return 200 with identical JSON bodies | AC-13 |
| RH-14 | Self-contained, no env vars | Call GET() | Works and returns correct response | AC-12 |

### Test Scope Summary
- **Total Tests**: 14
- **Coverage**: 100% of GET handler
- **Acceptance Criteria Covered**: All 14 ACs (AC-02 through AC-14)
- **Test Framework**: Vitest + jsdom
- **Import Pattern**: Direct function import, no mocking needed

### Red-to-Green Transition Plan
1. **RED phase**: Run all 14 tests before implementation — all fail
2. **GREEN phase**: Implement route handler to make all 14 tests pass
3. **VERIFY**: `npm run test:coverage` shows 100% coverage of route.ts
4. **LINT**: `npm run lint` passes (0 warnings)
5. **TYPECHECK**: `npm run typecheck` passes (0 errors)

### Implementation Notes
- No beforeEach setup needed (endpoint has zero dependencies)
- No mocking required (endpoint has no external calls)
- No special test env needed (route is pure)
- Tests are deterministic and fast
