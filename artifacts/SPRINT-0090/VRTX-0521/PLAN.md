# VRTX-0521: Implement /healthz-smoke-733116439-c

**Epic:** VRTX-0517  
**Story:** VRTX-0518  
**Sprint:** SPRINT-0090  
**Variant:** c  

---

## Overview

Implement the third independent health-check endpoint `/api/healthz-smoke-733116439-c`. This endpoint requires:

- **Route file:** `src/app/api/healthz-smoke-733116439-c/route.ts`
- **Test suite:** `src/app/api/healthz-smoke-733116439-c/__tests__/route.test.ts`
- **Response:** `{ ok: true, variant: "733116439" }` with HTTP 200
- **No dependencies:** Completely standalone, no shared code, no auth, no database

This task is **independent** and can be executed in parallel with VRTX-0519 and VRTX-0520.

---

## File Ownership Map

```
src/app/api/healthz-smoke-733116439-c/
├── route.ts                  ← Route handler (8 lines)
└── __tests__/
    └── route.test.ts         ← Test suite (15+ test cases)
```

**Module Coupling:** None. This endpoint:
- Does NOT import from `src/lib/` (no auth, no db, no utils)
- Does NOT share code with other endpoints
- Does NOT import shared middleware
- Imports ONLY from Next.js (`next/server`)

---

## Acceptance Criteria (Definition of Done)

### Implementation
- [ ] File `src/app/api/healthz-smoke-733116439-c/route.ts` created
- [ ] Exports `async function GET(request: NextRequest): Promise<NextResponse>`
- [ ] Returns `{ ok: true, variant: "733116439" }` with HTTP 200
- [ ] No imports except `next/server` (NextRequest, NextResponse)
- [ ] No async operations (pure synchronous JSON return)
- [ ] No env vars, no database access, no auth

### Testing
- [ ] File `src/app/api/healthz-smoke-733116439-c/__tests__/route.test.ts` created
- [ ] Test suite uses Vitest (`describe`, `it`, `expect`, `beforeEach`)
- [ ] At least 15 test cases covering:
  - HTTP status 200
  - JSON payload structure
  - Content-Type header
  - Response determinism
  - Performance (< 100ms)
  - Concurrency (50 concurrent calls)
  - No DB/auth/env var dependencies
  - TypeScript type safety
- [ ] All tests pass locally: `npm run test -- healthz-smoke-733116439-c`

### Code Quality
- [ ] TypeScript strict mode compiles: `npm run typecheck`
- [ ] ESLint passes: `npm run lint` (zero warnings on new files)
- [ ] Route file < 10 lines of code
- [ ] No `any` types
- [ ] No unused imports or variables

### Integration
- [ ] Endpoint accessible at `GET http://localhost:3000/api/healthz-smoke-733116439-c`
- [ ] Response matches spec in local dev
- [ ] No errors in Next.js dev server logs

---

## Implementation Guide

### Step 1: Create Route File

Create `src/app/api/healthz-smoke-733116439-c/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '733116439' },
    { status: 200 }
  )
}
```

**Notes:**
- `_request` parameter is required by Next.js API route signature (prefix with `_` since unused)
- Return type annotation is required for strict TypeScript
- No `try/catch` needed (no async operations)
- No context needed (no merchant routing, no auth)

### Step 2: Create Test Suite

Create `src/app/api/healthz-smoke-733116439-c/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

describe('/api/healthz-smoke-733116439-c', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = new NextRequest(
      new URL('http://localhost:3000/api/healthz-smoke-733116439-c')
    )
  })

  // Core functionality tests
  it('exports GET function', () => {
    expect(typeof GET).toBe('function')
  })

  it('returns status 200', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
  })

  it('response body contains ok: true', async () => {
    const response = await GET(mockRequest)
    const body = await response.json()
    expect(body.ok).toBe(true)
  })

  it('response body contains variant: "733116439"', async () => {
    const response = await GET(mockRequest)
    const body = await response.json()
    expect(body.variant).toBe('733116439')
  })

  // JSON structure tests
  it('response is valid JSON', async () => {
    const response = await GET(mockRequest)
    const body = await response.json()
    expect(body).toBeDefined()
    expect(typeof body).toBe('object')
  })

  it('response has correct Content-Type header (application/json)', async () => {
    const response = await GET(mockRequest)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  // Edge case tests
  it('handles requests with no body', async () => {
    const requestNoBody = new NextRequest(
      new URL('http://localhost:3000/api/healthz-smoke-733116439-c')
    )
    const response = await GET(requestNoBody)
    expect(response.status).toBe(200)
  })

  // Exact spec test
  it('response structure matches exact spec { ok: true, variant: "733116439" }', async () => {
    const response = await GET(mockRequest)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '733116439' })
  })

  // Performance test
  it('responds in < 100ms', async () => {
    const start = performance.now()
    await GET(mockRequest)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })

  // Determinism test
  it('returns consistent response on multiple sequential calls', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => GET(mockRequest))
    )
    const bodies = await Promise.all(responses.map(r => r.json()))
    bodies.forEach(body => {
      expect(body).toEqual({ ok: true, variant: '733116439' })
    })
  })

  // Concurrency test
  it('handles 50 concurrent calls successfully (zero external calls)', async () => {
    const responses = await Promise.all(
      Array.from({ length: 50 }, () => GET(mockRequest))
    )
    expect(responses.length).toBe(50)
    responses.forEach(r => expect(r.status).toBe(200))
    const bodies = await Promise.all(responses.map(r => r.json()))
    bodies.forEach(body => {
      expect(body).toEqual({ ok: true, variant: '733116439' })
    })
  })

  // Dependency tests
  it('executes without any database calls', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '733116439' })
  })

  it('executes without any authentication checks', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
  })

  it('works without any environment variables', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true, variant: '733116439' })
  })

  // Type safety test
  it('type safety: TypeScript strict mode compiles without errors', async () => {
    const response = await GET(mockRequest)
    expect(response).toBeDefined()
  })
})
```

**Test Coverage:**
- **HTTP Status:** 200 response
- **JSON Payload:** Exact structure `{ ok: true, variant: "733116439" }`
- **Headers:** Content-Type is `application/json`
- **Performance:** Responds in < 100ms
- **Determinism:** Multiple calls return identical responses
- **Concurrency:** Handles 50 concurrent requests
- **Dependencies:** No DB, no auth, no env vars
- **Type Safety:** Strict TypeScript compiles

---

## Verification Checklist

Before marking complete, run:

```bash
# 1. Test the endpoint locally
npm run test -- healthz-smoke-733116439-c

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Verify in dev server
npm run dev
# Then: curl http://localhost:3000/api/healthz-smoke-733116439-c
# Expected: {"ok":true,"variant":"733116439"}
```

---

## Reference: Existing Endpoint Pattern

This task follows the pattern of existing endpoints like:
- `src/app/api/healthz-smoke-1012136249-a/route.ts`
- `src/app/api/healthz-smoke-1012136249-b/route.ts`

Review these as reference implementations.

---

## Context Notes

- **No shared code:** Do NOT create helper functions or shared utilities
- **No middleware:** Route does not use or configure middleware
- **Stateless:** No global state, no caching, no side effects
- **Isolation:** No coupling with VRTX-0519 or VRTX-0520
- **Parallelizable:** Can be worked on simultaneously with other endpoints

---

## Success Indicators

✅ Task complete when:
1. Route file created and exports GET handler
2. Handler returns correct JSON with HTTP 200
3. Test suite passes all 15+ tests
4. TypeScript strict mode passes
5. ESLint passes with zero warnings
6. Endpoint accessible in dev server

---

**Prepared by:** Product Team  
**Date:** 2026-07-19
