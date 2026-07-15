# TASK-0394 Plan — Implement /healthz-smoke-276127630-c endpoint

**Sprint**: SPRINT-0069  
**Task**: VRTX-0394 — Implement `/healthz-smoke-276127630-c` GET endpoint and unit tests  
**Variant**: 276127630 (identifier "c")

---

## Objective

Implement a single, completely self-contained GET endpoint that returns a tiny JSON response with hardcoded success and variant identifier. This endpoint is fully independent — no shared utilities, no external dependencies, no auth, no database calls.

---

## Scope

### What We're Building

A single HTTP endpoint:

**Path**: `/api/healthz-smoke-276127630-c`  
**Method**: GET  
**Response (200 OK)**:
```json
{
  "ok": true,
  "variant": "276127630"
}
```

**Constraints**:
- No database calls
- No authentication
- No external service calls
- No shared utilities with other endpoints
- No imports from `lib/` directory
- No middleware beyond Next.js defaults
- Hardcoded response (no dynamic computation)
- Response time < 100ms (target < 10ms)

### Files to Create

```
src/app/api/healthz-smoke-276127630-c/
├── route.ts                  # Handler (~20 lines)
└── __tests__/
    └── route.test.ts         # Unit tests (~120 lines)
```

### No Files Modified

No existing files should be modified. This is purely additive — new endpoint, new test file, zero impact on other code paths.

---

## Implementation Specification

### Handler (`src/app/api/healthz-smoke-276127630-c/route.ts`)

**Signature**:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Implementation here
}
```

**Logic**:
1. Accept `NextRequest` parameter (unused, no query/body inspection)
2. Return a JSON response with status 200
3. Body: `{ ok: true, variant: "276127630" }`
4. Content-Type header: `application/json` (set by `NextResponse.json()`)

**TypeScript Requirements**:
- Complete type annotations (no implicit `any`)
- Async function signature
- Return type explicitly `Promise<NextResponse>`

**Example Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '276127630' },
    { status: 200 }
  )
}
```

### Tests (`src/app/api/healthz-smoke-276127630-c/__tests__/route.test.ts`)

**Framework**: Vitest 2.1.9 (jsdom environment)

**Test Cases** (7 total):

1. **Status Code** — Verify HTTP 200
2. **Content-Type** — Verify `application/json`
3. **Response Structure** — Verify `ok` and `variant` fields with correct values
4. **Performance** — Verify response < 100ms
5. **Consistency** — Verify 10 sequential calls return identical response
6. **Concurrent Load** — Verify 50 concurrent calls all succeed
7. **Type Safety** — TypeScript strict mode compiles without errors

**Test File Template** (identical to VRTX-0390 and VRTX-0391 except path):
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

describe('/api/healthz-smoke-276127630-c', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = new NextRequest(
      new URL('http://localhost:3000/api/healthz-smoke-276127630-c')
    )
  })

  it('returns status 200', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
  })

  it('returns application/json', async () => {
    const response = await GET(mockRequest)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('returns { ok: true, variant: "276127630" }', async () => {
    const response = await GET(mockRequest)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '276127630' })
  })

  it('responds in < 100ms', async () => {
    const start = performance.now()
    await GET(mockRequest)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('returns consistent response on 10 sequential calls', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => GET(mockRequest))
    )
    const bodies = await Promise.all(responses.map(r => r.json()))
    bodies.forEach(body => {
      expect(body).toEqual({ ok: true, variant: '276127630' })
    })
  })

  it('handles 50 concurrent calls successfully', async () => {
    const responses = await Promise.all(
      Array.from({ length: 50 }, () => GET(mockRequest))
    )
    expect(responses.length).toBe(50)
    responses.forEach(r => expect(r.status).toBe(200))
    const bodies = await Promise.all(responses.map(r => r.json()))
    bodies.forEach(body => {
      expect(body).toEqual({ ok: true, variant: '276127630' })
    })
  })
})
```

---

## Module & File Ownership

This task **owns** only:
- `src/app/api/healthz-smoke-276127630-c/route.ts`
- `src/app/api/healthz-smoke-276127630-c/__tests__/route.test.ts`

This task **does not** interact with any other files, services, or endpoints.

---

## Definition of Done

✅ Route handler file created at `src/app/api/healthz-smoke-276127630-c/route.ts`  
✅ Test file created at `src/app/api/healthz-smoke-276127630-c/__tests__/route.test.ts`  
✅ All 7 unit tests passing (100% coverage for this endpoint)  
✅ `npm run typecheck` passes with no errors  
✅ `npm run lint` passes with 0 warnings (ESLint on these files)  
✅ `npm run test -- src/app/api/healthz-smoke-276127630-c` passes  
✅ Endpoint responds with correct JSON shape  
✅ Response time < 100ms verified by test  
✅ Concurrent load test (50 calls) passes  
✅ All files committed on ticket branch  

---

## Interface Contract

**Request**: GET `/api/healthz-smoke-276127630-c` (no body, no auth)

**Response (200)**:
```json
{
  "ok": true,
  "variant": "276127630"
}
```

**Error Response (500)**: Not expected for this endpoint (hardcoded response); if any error occurs, return status 500 with empty or error body.

---

## Dependencies & Sequencing

- **No dependencies**: This task is completely independent.
- **No blocking**: No other tasks depend on this endpoint.
- **Parallel**: Can be developed in parallel with VRTX-0392 and VRTX-0393.

---

## Success Metrics

- Endpoint reachable at `GET /api/healthz-smoke-276127630-c`
- Response status: 200
- Response body matches contract
- All tests pass
- TypeScript strict mode compliance
- ESLint clean
- Response latency < 100ms
- No shared code with other variant endpoints
- No side effects (stateless, no writes, no external calls)
