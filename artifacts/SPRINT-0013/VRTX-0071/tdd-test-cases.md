# TDD Test Cases: VRTX-0071

## Endpoint
`GET /api/healthz-smoke-110428092`

## Test Matrix (14 Tests)

### GROUP 1: HTTP Status & Response Body (4 Tests)

#### RH-01: Returns HTTP 200 Status
- **Category**: HTTP Status
- **Requirement**: Endpoint must return HTTP 200 status code
- **Test Steps**:
  1. Call GET() function
  2. Assert res.status === 200
  3. Assert res.ok === true
- **Expected Result**: Status is 200, res.ok is true
- **Test Type**: Unit
- **Precondition**: None (stateless)

#### RH-02: Returns Correct JSON Structure with ok and variant
- **Category**: Response Body
- **Requirement**: Response must match spec: { ok: true, variant: "110428092" }
- **Test Steps**:
  1. Call GET() function
  2. Parse response as JSON
  3. Assert json.ok === true
  4. Assert json.variant === "110428092"
- **Expected Result**: Both fields exist with correct values
- **Test Type**: Unit
- **Precondition**: None

#### RH-03: Response Has No Extra Fields in Root Object
- **Category**: Response Structure
- **Requirement**: Response must have exactly 2 fields: ok and variant (no extra fields)
- **Test Steps**:
  1. Call GET() function
  2. Parse response as JSON
  3. Get Object.keys()
  4. Assert keys.length === 2
  5. Assert keys includes 'ok' and 'variant'
- **Expected Result**: Exactly 2 keys present, no extra fields
- **Test Type**: Unit
- **Precondition**: None

#### RH-04: Response Has Exactly Two Root Fields (ok and variant)
- **Category**: Response Structure
- **Requirement**: Verify exact root field structure
- **Test Steps**:
  1. Call GET() function
  2. Parse response as JSON
  3. Get all root keys
  4. Assert keys.length === 2
  5. Assert keys contain both 'ok' and 'variant'
- **Expected Result**: Exactly 'ok' and 'variant' fields, no data/error nesting
- **Test Type**: Unit
- **Precondition**: None

### GROUP 2: Field Type Safety (2 Tests)

#### RH-05: ok Field is Boolean true (Not Just Truthy)
- **Category**: Type Safety
- **Requirement**: ok must be boolean true, not string "true", number 1, or other truthy value
- **Test Steps**:
  1. Call GET() function
  2. Parse response as JSON
  3. Assert typeof json.ok === 'boolean'
  4. Assert json.ok === true (loose equality)
  5. Assert json.ok === true (strict equality)
- **Expected Result**: ok is exactly boolean true
- **Test Type**: Unit
- **Precondition**: None

#### RH-06: variant Field is String "110428092" (Not Number)
- **Category**: Type Safety
- **Requirement**: variant must be string "110428092", not number 110428092
- **Test Steps**:
  1. Call GET() function
  2. Parse response as JSON
  3. Assert typeof json.variant === 'string'
  4. Assert json.variant === "110428092" (strict equality)
  5. Verify it's not a number
- **Expected Result**: variant is exactly string "110428092"
- **Test Type**: Unit
- **Precondition**: None

### GROUP 3: HTTP Headers & Meta (2 Tests)

#### RH-07: Content-Type Header is application/json
- **Category**: HTTP Headers
- **Requirement**: Response must include Content-Type: application/json header
- **Test Steps**:
  1. Call GET() function
  2. Get response headers
  3. Assert headers.get('Content-Type') === 'application/json'
- **Expected Result**: Correct Content-Type header set
- **Test Type**: Unit
- **Precondition**: None

#### RH-08: Response is a NextResponse Instance
- **Category**: Type Safety
- **Requirement**: Response must be a NextResponse instance (not generic Response)
- **Test Steps**:
  1. Call GET() function
  2. Assert res instanceof NextResponse
- **Expected Result**: Response is NextResponse type
- **Test Type**: Unit
- **Precondition**: None

### GROUP 4: Performance (3 Tests)

#### RH-09: Response Time is Less Than 100ms
- **Category**: Performance
- **Requirement**: Endpoint must respond in < 100ms (hard limit)
- **Test Steps**:
  1. Record startTime with performance.now()
  2. Call GET() function
  3. Record endTime with performance.now()
  4. Calculate elapsed = endTime - startTime
  5. Assert elapsed < 100
- **Expected Result**: Response completes in < 100ms
- **Test Type**: Performance
- **Precondition**: None

#### RH-10: Response Time is Typically Fast (< 10ms)
- **Category**: Performance
- **Requirement**: Endpoint should typically respond in < 10ms (soft target, indicates regression if violated)
- **Test Steps**:
  1. Record startTime with performance.now()
  2. Call GET() function
  3. Record endTime with performance.now()
  4. Calculate elapsed = endTime - startTime
  5. Assert elapsed < 10 (soft assertion)
- **Expected Result**: Response typically completes in < 10ms
- **Test Type**: Performance
- **Precondition**: None
- **Note**: This test indicates performance regression if it fails, but doesn't block the build

#### RH-11: Under Load (50 Concurrent Calls), All Respond Within 100ms
- **Category**: Performance under Load
- **Requirement**: Endpoint must maintain performance under concurrent load
- **Test Steps**:
  1. Create 50 concurrent GET() calls
  2. Record startTime with performance.now()
  3. Execute Promise.all() on all calls
  4. Record endTime with performance.now()
  5. Assert all responses have status 200
  6. Assert total elapsed time < 5000ms (reasonable for 50 calls)
- **Expected Result**: All concurrent calls succeed with status 200
- **Test Type**: Load Performance
- **Precondition**: None

### GROUP 5: Public Access & Consistency (3 Tests)

#### RH-12: Endpoint Requires No Authentication
- **Category**: Access Control
- **Requirement**: Endpoint must be publicly accessible without auth headers/cookies
- **Test Steps**:
  1. Call GET() function without any auth headers or cookies
  2. Assert response status is 200
  3. Assert response.ok is true
- **Expected Result**: Endpoint responds with 200 without authentication
- **Test Type**: Integration
- **Precondition**: None

#### RH-13: Multiple Sequential Calls Return Consistent Responses
- **Category**: Consistency
- **Requirement**: Multiple calls must return identical responses (deterministic)
- **Test Steps**:
  1. Call GET() three times sequentially (or concurrently)
  2. Parse all responses as JSON
  3. Assert all responses have status 200
  4. Assert all responses have Content-Type: application/json
  5. Assert all bodies match spec: { ok: true, variant: "110428092" }
- **Expected Result**: All calls return identical responses
- **Test Type**: Unit
- **Precondition**: None

#### RH-14: Endpoint is Self-Contained and Requires No Environment Variables
- **Category**: Dependencies
- **Requirement**: Endpoint must work without any environment variables
- **Test Steps**:
  1. Call GET() function
  2. Assert response status is 200
  3. Parse response as JSON
  4. Assert json.ok === true
  5. Assert json.variant === "110428092"
- **Expected Result**: Endpoint returns correct response without env vars
- **Test Type**: Unit
- **Precondition**: No specific env vars set
- **Note**: Tests verify the endpoint doesn't reference process.env in implementation

## Test Execution Order (Red → Green)

### Red Phase (All Tests Fail)
1. Create test file `src/app/api/healthz-smoke-110428092/__tests__/route.test.ts`
2. Write all 14 test cases
3. Run `npm run test -- healthz-smoke-110428092`
4. Verify all 14 tests FAIL (endpoint doesn't exist yet)

### Green Phase (All Tests Pass)
1. Create route handler `src/app/api/healthz-smoke-110428092/route.ts`
2. Implement GET function with correct response
3. Run `npm run test -- healthz-smoke-110428092`
4. Verify all 14 tests PASS
5. Run `npm run lint` — verify 0 warnings
6. Run `npm run typecheck` — verify no errors

## Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| HTTP Status & Response Body | 4 | 100% of response structure |
| Field Type Safety | 2 | 100% of field types |
| HTTP Headers & Meta | 2 | 100% of response metadata |
| Performance | 3 | Response time + load testing |
| Public Access & Consistency | 3 | No auth + consistency + independence |
| **TOTAL** | **14** | **Comprehensive** |

## Success Criteria

✅ All 14 tests pass  
✅ Linting: 0 warnings  
✅ Type checking: no errors  
✅ Response matches spec exactly  
✅ No external dependencies  
✅ Performance < 100ms  
✅ Code follows CLAUDE.md conventions
