# VRTX-XXXX1 Plan: Implement Endpoint A (`/healthz-smoke-661868846-a`)

**TASK:** Implement the first independent health check variant endpoint

**Sprint:** SPRINT-0097  
**Epic:** VRTX-XXXX0 (Three Independent Smoke Test Variant Endpoints)  
**Story:** VRTX-XXXX0-S1 (Three Independent Endpoints)

---

## Overview

Implement the GET endpoint `/api/healthz-smoke-661868846-a` that returns `{ ok: true, variant: "661868846" }` with HTTP 200. This endpoint is **fully standalone** — no shared code with endpoints B or C, no dependencies, no database access.

---

## Scope & Constraints

**Implementation:**
- Single route file: `src/app/api/healthz-smoke-661868846-a/route.ts`
- Handler function: `GET(request: NextRequest): Promise<NextResponse>`
- Response: `{ ok: true, variant: "661868846" }` as JSON, status 200
- No imports beyond Next.js (NextRequest, NextResponse)

**Testing:**
- Unit test file: `src/app/api/healthz-smoke-661868846-a/__tests__/route.test.ts`
- Test framework: Vitest + NextRequest mocking
- Coverage: HTTP status, JSON body structure, field types, Content-Type header
- Target: 100% code coverage (no branching logic)

**Constraints:**
- No shared code between endpoints
- No auth, database, or external calls
- Response time < 10ms target
- Must integrate with existing test harness and CI pipeline
- Zero dependencies on TASK-2 or TASK-3

---

## File Ownership

```
src/app/api/healthz-smoke-661868846-a/
├── route.ts                    ← Implementation (this task)
└── __tests__/
    └── route.test.ts           ← Unit tests (this task)
```

---

## Interface Contract

### Endpoint Specification

**Route:** `/api/healthz-smoke-661868846-a`  
**Method:** GET  
**Authentication:** None (public endpoint)  
**Request Body:** None  

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "661868846"
}
```

**Headers:**
- `Content-Type: application/json; charset=utf-8`
- Status Code: `200`

### TypeScript Types

```typescript
// Request: NextRequest (standard Next.js)
export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '661868846' },
    { status: 200 }
  )
}
```

---

## Implementation Checklist

- [ ] Create directory `src/app/api/healthz-smoke-661868846-a/`
- [ ] Create `route.ts` with GET handler
  - [ ] Import NextRequest and NextResponse from 'next/server'
  - [ ] Export async GET function
  - [ ] Return NextResponse.json with hardcoded response
  - [ ] Set status to 200
- [ ] Create test directory `__tests__/`
- [ ] Create `route.test.ts` with comprehensive unit tests
  - [ ] Test: GET returns 200 status
  - [ ] Test: Response body matches `{ ok: true, variant: "661868846" }`
  - [ ] Test: Response has correct fields (ok, variant)
  - [ ] Test: Field types are correct (ok: boolean, variant: string)
  - [ ] Test: Content-Type header includes application/json
  - [ ] Test: No other response fields (only ok and variant)
- [ ] Run `npm run test` and verify all tests pass
- [ ] Run `npm run typecheck` and verify no errors
- [ ] Run `npm run lint` and verify no warnings
- [ ] Verify response time is < 10ms

---

## Testing Strategy

### Unit Tests (Vitest)

Pattern from previous sprints (509572604-a, 53261999-a, etc.):

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/healthz-smoke-661868846-a', () => {
  it('returns 200 with correct JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-661868846-a', {
      method: 'GET',
    });
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '661868846' });
  });

  it('has correct response structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-661868846-a', {
      method: 'GET',
    });
    const response = await GET(request);
    const body = await response.json();

    expect(body).toHaveProperty('ok');
    expect(body).toHaveProperty('variant');
    expect(Object.keys(body)).toEqual(['ok', 'variant']);
    expect(typeof body.ok).toBe('boolean');
    expect(typeof body.variant).toBe('string');
  });

  it('sets correct Content-Type header', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-661868846-a', {
      method: 'GET',
    });
    const response = await GET(request);

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
```

### E2E Tests (Playwright)

Covered by TASK-4 (test harness phase), which validates all three endpoints via HTTP.

---

## Quality Standards

- **TypeScript:** Strict mode compliance, no `any` types
- **Linting:** Zero ESLint warnings (`npm run lint`)
- **Code coverage:** 100% (trivial implementations have no branching)
- **Test passing:** All local tests pass before commit
- **Response time:** < 10ms (pure JSON response, no I/O)

---

## Related Work

**Prior Sprints with Same Pattern:**
- SPRINT-0093 (929192825-a) — Three independent endpoints
- SPRINT-0092 (509572604-a) — Three independent endpoints with E2E tests
- SPRINT-0088 (53261999-a) — Three independent endpoints
- SPRINT-0073 (121996100-a) — Pattern established
- SPRINT-0070 (1012136249-a), SPRINT-0069 (276127630-a), and earlier variants

**References:**
- Implementation reference: `/src/app/api/healthz-smoke-509572604-a/route.ts`
- Test reference: `/src/app/api/healthz-smoke-509572604-a/__tests__/route.test.ts`
- SPRINT-0092 changelog in ARCHITECTURE.md

---

## Acceptance Criteria (Definition of Done)

- [ ] Endpoint is registered at `/api/healthz-smoke-661868846-a`
- [ ] GET request returns HTTP 200
- [ ] Response body is `{ ok: true, variant: "661868846" }`
- [ ] Content-Type header is application/json
- [ ] Unit tests pass (Vitest)
- [ ] No shared code with endpoints B or C
- [ ] TypeScript strict mode check passes (tsc --noEmit)
- [ ] ESLint check passes (eslint . --max-warnings 0)
- [ ] Code coverage is 100% for this endpoint
- [ ] Response time is < 10ms in local testing

---

## Notes

1. **No Shared Code:** This endpoint must have zero code reuse with VRTX-XXXX2 or VRTX-XXXX3. Each is a completely independent module.
2. **Parallel Execution:** This task can be started immediately and completed independently of the other endpoint tasks.
3. **E2E Coverage:** While this task covers unit tests, TASK-4 will add E2E tests covering all three endpoints together via HTTP.
4. **Hardcoded Variant:** The variant string `"661868846"` is hardcoded; no environment variables or configuration files needed.
