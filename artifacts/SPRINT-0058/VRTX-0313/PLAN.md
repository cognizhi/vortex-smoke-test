# VRTX-0313: Implement Endpoint A with Unit Tests

**Title:** Implement endpoint A: `/api/healthz-smoke-971125744-a`

**Sprint:** SPRINT-0058

**Phase:** Phase 1 (Endpoint A Implementation)

---

## Objective

Implement the first independent smoke test health check endpoint with complete unit test coverage.

## Deliverables

### 1. Endpoint Implementation
**File:** `src/app/api/healthz-smoke-971125744-a/route.ts`

```typescript
/**
 * GET /api/healthz-smoke-971125744-a
 *
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * This endpoint includes a variant identifier (971125744) to distinguish between
 * different deployment variants, enabling A/B testing and gradual rollouts of health check logic.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "971125744" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-971125744-a
 *
 * Returns a deterministic health check response with a variant identifier.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "971125744" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '971125744',
    },
    { status: 200 }
  );
}
```

**Key aspects:**
- Approximately 40 lines including documentation
- No imports beyond `NextResponse` from 'next/server'
- Async function returning `NextResponse`
- Always returns 200 status with fixed JSON response
- No logic, no conditionals, no dependencies

### 2. Unit Tests
**File:** `src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts`

**Test cases (7 total):**

| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | Returns HTTP 200 status | res.status === 200 |
| 2 | Returns correct JSON structure | json = { ok: true, variant: '971125744' } |
| 3 | Content-Type header is application/json | res.headers.get('Content-Type') === 'application/json' |
| 4 | Endpoint requires no authentication | Can call without auth, returns 200 |
| 5 | Multiple calls return consistent responses | res1, res2, res3 all equal |
| 6 | Response is NextResponse instance | res instanceof NextResponse |
| 7 | Response time < 100ms | elapsed < 100 |

**Test framework:** Vitest with React Testing Library

## Module Ownership

- **Main module:** `src/app/api/healthz-smoke-971125744-a/route.ts`
- **Test module:** `src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts`
- **No other files:** This endpoint is completely independent

## Acceptance Criteria

- ✅ File `src/app/api/healthz-smoke-971125744-a/route.ts` exists with GET export
- ✅ GET handler returns NextResponse with status 200
- ✅ GET handler returns JSON `{ ok: true, variant: "971125744" }`
- ✅ File `src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts` exists
- ✅ All 7 unit tests pass
- ✅ `npm run test` passes for this endpoint (can run subset with `npx vitest run src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts`)
- ✅ `npm run typecheck` passes (zero type errors)
- ✅ `npm run lint` passes (zero linting warnings)
- ✅ Endpoint requires no authentication
- ✅ Response time is < 100ms

## Testing Strategy

### Local Testing
```bash
# Run all tests
npm run test

# Run only this endpoint's tests
npx vitest run src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts

# Watch mode during development
npx vitest src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts
```

### Manual Testing
```bash
# Start dev server
npm run dev

# In another terminal
curl http://localhost:3000/api/healthz-smoke-971125744-a

# Expected response (status 200):
# {"ok":true,"variant":"971125744"}
```

## Implementation Notes

1. **Follow existing pattern** — Use `src/app/api/healthz-smoke-572185676/route.ts` as a template
2. **No shared code** — Do NOT create utility functions or helpers; keep implementation in route.ts
3. **Independent** — This endpoint must work completely standalone; no dependencies on other endpoints
4. **Pure function** — No side effects, no state, no external calls
5. **Fast** — Target < 10ms; ensure response time < 100ms
6. **Type safety** — Use TypeScript strict mode; all types must be explicit

## Success Indicators

- Endpoint is accessible at `/api/healthz-smoke-971125744-a`
- Endpoint responds in < 100ms with correct JSON
- All 7 tests pass
- No TypeScript errors
- No linting warnings
- Endpoint can be called without authentication
- Response is consistent across multiple calls

## Related Documents

- Sprint plan: `artifacts/SPRINT-0058/SPRINT-PLAN.md` (Phase 1)
- Reference endpoint: `src/app/api/healthz-smoke-572185676/route.ts`
- Test reference: `src/app/api/healthz-smoke-572185676/__tests__/route.test.ts`
