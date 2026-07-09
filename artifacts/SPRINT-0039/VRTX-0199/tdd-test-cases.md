# VRTX-0199 TDD Test Cases (Red Phase Matrix)

## Test Suite: GET /api/healthz-smoke-763023087

### Acceptance Criteria → Test Mapping

| AC # | Requirement | Test Name | Status |
|------|-------------|-----------|--------|
| AC-01 | Route file created | Manual check | Pre-impl |
| AC-02 | HTTP status 200 | RH-01: returns HTTP 200 status | Red |
| AC-03 | Response body: data.ok = true | RH-02: returns correct JSON structure with data and ok | Red |
| AC-04 | Response body: variant = "763023087" | RH-03: variant field is correct value | Red |
| AC-05 | Envelope: error field = null | RH-04: error field is null | Red |
| AC-06 | Envelope structure correct | RH-05: response has exactly three root fields (data, error) | Red |
| AC-07 | Type safety: data.ok is boolean | RH-06: data.ok field is boolean true | Red |
| AC-08 | Type safety: variant is string | RH-07: variant field is string "763023087" | Red |
| AC-09 | Content-Type header | RH-08: Content-Type header is application/json | Red |
| AC-10 | NextResponse type | RH-09: response is a NextResponse instance | Red |
| AC-11 | Performance: < 100ms | RH-10: response time is less than 100ms | Red |
| AC-12 | Performance: typically < 10ms | RH-11: response time is typically fast | Red |
| AC-13 | Load test: 50 concurrent | RH-12: under load (50 concurrent calls), all respond within 100ms | Red |
| AC-14 | Public access (no auth) | RH-13: endpoint requires no authentication | Red |
| AC-15 | Consistency | RH-14: multiple sequential calls return consistent responses | Red |
| AC-16 | Self-contained | RH-15: endpoint is self-contained and requires no env vars | Red |

## Test Groups

### GROUP 1: HTTP Status & Response Envelope (5 tests)
Tests verify the fundamental HTTP contract and response structure.

1. **RH-01: returns HTTP 200 status**
   - Call GET()
   - Assert: response.status === 200
   - Assert: response.ok === true

2. **RH-02: returns correct JSON structure with data and ok**
   - Call GET()
   - Parse JSON: { data: { ok: true, variant: "763023087" }, error: null }
   - Assert: data.ok === true
   - Assert: data.variant === "763023087"

3. **RH-03: variant field is correct value**
   - Call GET()
   - Parse JSON response
   - Assert: data.variant === "763023087" (exactly this string)

4. **RH-04: error field is null**
   - Call GET()
   - Parse JSON response
   - Assert: error === null

5. **RH-05: response has exactly three root fields (data, error)**
   - Call GET()
   - Parse JSON response
   - Assert: Object.keys(json).length === 2
   - Assert: keys contain 'data' and 'error'

### GROUP 2: Field Type Safety (3 tests)
Tests ensure strict TypeScript compliance with no type coercion surprises.

6. **RH-06: data.ok field is boolean true (not just truthy)**
   - Call GET()
   - Parse JSON response
   - Assert: typeof data.ok === 'boolean'
   - Assert: data.ok === true (strict equality)

7. **RH-07: variant field is string "763023087" (not number)**
   - Call GET()
   - Parse JSON response
   - Assert: typeof data.variant === 'string'
   - Assert: data.variant === "763023087"

8. **RH-08: data object has no extra fields**
   - Call GET()
   - Parse JSON response
   - Assert: Object.keys(data).length === 2
   - Assert: keys are 'ok' and 'variant'

### GROUP 3: HTTP Headers & Meta (2 tests)
Tests verify HTTP response metadata.

9. **RH-09: Content-Type header is application/json**
   - Call GET()
   - Assert: response.headers.get('Content-Type') contains 'application/json'

10. **RH-10: response is a NextResponse instance**
    - Call GET()
    - Assert: response instanceof NextResponse

### GROUP 4: Performance (3 tests)
Tests verify response time meets SLOs.

11. **RH-11: response time is less than 100ms**
    - Measure: startTime = performance.now()
    - Call GET()
    - Measure: endTime = performance.now()
    - Assert: (endTime - startTime) < 100

12. **RH-12: response time is typically fast (< 10ms)**
    - Measure: startTime = performance.now()
    - Call GET()
    - Measure: endTime = performance.now()
    - Assert: (endTime - startTime) < 10

13. **RH-13: under load (50 concurrent calls), all respond within 100ms**
    - Create 50 concurrent GET() calls
    - Measure total wall-clock time
    - Assert: all respond with status 200
    - Assert: total time < 5000ms (generous for 50 calls)

### GROUP 5: Public Access & Consistency (2 tests)
Tests verify security posture and reliability.

14. **RH-14: endpoint requires no authentication**
    - Call GET() with no auth headers
    - Assert: response.status === 200
    - Verify: no auth-related errors

15. **RH-15: multiple sequential calls return consistent responses**
    - Call GET() three times sequentially
    - Assert: all responses are identical (same status, same body)
    - Assert: all have Content-Type: application/json

## Execution Strategy (Red → Green → Refactor)

**Red Phase (Pre-implementation)**
- Write all test cases above
- Tests will fail because endpoint doesn't exist
- Confirm test file compiles but tests fail

**Green Phase (Post-implementation)**
- Implement route handler
- Run tests
- Expect all tests to pass
- No refactoring needed (endpoint is minimal)

**Verification**
- Run: `npm run test -- src/app/api/healthz-smoke-763023087`
- Run: `npm run typecheck`
- Run: `npm run lint`
- Run: `curl http://localhost:3000/api/healthz-smoke-763023087`

---

## Notes for Implementation
- Follow exact pattern from `/api/healthz-smoke/route.ts` for envelope
- Follow exact pattern from variant endpoints for the variant field
- Keep implementation minimal (no logic, no dependencies)
- Use TypeScript strict mode throughout
- Use NextResponse.json() for response serialization
- Ensure proper type annotations on function signature
