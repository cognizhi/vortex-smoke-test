# VRTX-0343: Implement /api/healthz-smoke-1026761837-b Endpoint

**Ticket:** VRTX-0343  
**Type:** TASK  
**Priority:** P2 (Medium)  
**Sprint:** SPRINT-0063  
**Parent:** VRTX-0342 (STORY)  
**Related:** `artifacts/SPRINT-0063/SPRINT-PLAN.md` (Section: Phase 1)  

---

## Problem Summary

Add a new, lightweight health check endpoint `/api/healthz-smoke-1026761837-b` to enable deployment verification and variant-specific monitoring. This endpoint is completely independent with no dependencies on database, authentication, or external services.

---

## Context

This is one of three parallel endpoint implementations in SPRINT-0063. Each endpoint is:
- **Isolated:** Uses separate route files, no shared code
- **Stateless:** No database, auth, or config lookups
- **Fast:** Responds in < 10ms typically (< 100ms guaranteed)
- **Verifiable:** Hardcoded variant identifier enables deployment verification

Variant ID: `1026761837`  
Endpoint suffix: `b` (three total: a, b, c)

---

## Implementation Plan

### Files to Create

**1. Route Handler:**
- **Path:** `src/app/api/healthz-smoke-1026761837-b/route.ts`
- **Handler:** `GET` function exporting NextResponse
- **Response:** HTTP 200 with JSON `{ ok: true, variant: "1026761837" }`
- **Dependencies:** None (import only NextResponse)

**2. Test File:**
- **Path:** `src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts`
- **Framework:** Vitest (jsdom environment)
- **Coverage:** 7 test cases validating response, performance, consistency

### Code Template

**route.ts:**
```typescript
/**
 * GET /api/healthz-smoke-1026761837-b
 *
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * This endpoint includes a variant identifier (1026761837) to distinguish between
 * different deployment variants, enabling A/B testing and gradual rollouts of health check logic.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "1026761837" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-1026761837-b
 *
 * Returns a deterministic health check response with a variant identifier.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "1026761837" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '1026761837',
    },
    { status: 200 }
  );
}
```

**route.test.ts:**
```typescript
/**
 * Unit tests for GET /api/healthz-smoke-1026761837-b
 *
 * Smoke test endpoint variant for load balancers and monitoring systems.
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { ok: true, variant: "1026761837" }
 *   - No authentication required
 *   - Response time < 100ms
 *   - Content-Type header is application/json
 *   - Consistency under repeated calls
 *   - Response is NextResponse instance
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

import { GET } from '../route';

describe('GET /api/healthz-smoke-1026761837-b', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // AC-01: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  // AC-02: Response body matches spec: { ok: true, variant: "1026761837" }
  it('RH-02: returns correct JSON structure with ok: true and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('1026761837');
  });

  // AC-03: Content-Type header is application/json
  it('RH-03: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  // AC-04: No authentication required — endpoint works without auth
  it('RH-04: endpoint requires no authentication', async () => {
    // This test verifies the endpoint doesn't guard access or check auth
    // Simply call GET without any auth headers/cookies
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-07: Response is consistent across calls
  it('RH-05: multiple sequential calls return consistent responses', async () => {
    const res1 = await GET();
    const res2 = await GET();
    const res3 = await GET();

    const json1 = (await res1.json()) as { ok: boolean; variant: string };
    const json2 = (await res2.json()) as { ok: boolean; variant: string };
    const json3 = (await res3.json()) as { ok: boolean; variant: string };

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    expect(json1).toEqual({ ok: true, variant: '1026761837' });
    expect(json2).toEqual({ ok: true, variant: '1026761837' });
    expect(json3).toEqual({ ok: true, variant: '1026761837' });
  });

  // Type safety: Response is NextResponse
  it('RH-06: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // AC-06: Response time is < 100ms
  it('RH-07: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });
});
```

---

## Files & Module Ownership

| File | Owner | Purpose | Status |
|------|-------|---------|--------|
| `src/app/api/healthz-smoke-1026761837-b/route.ts` | Engineer | Route handler | NEW |
| `src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts` | Engineer | Unit tests | NEW |

**No Dependencies:** This task touches only files in `src/app/api/healthz-smoke-1026761837-b/`. No shared modules, no database changes, no config changes.

**Parallel Execution:** Safe to run alongside VRTX-0341 and VRTX-0345 (disjoint file sets).

---

## Acceptance Criteria

### Implementation
- ✅ Route handler created at `src/app/api/healthz-smoke-1026761837-b/route.ts`
- ✅ GET function returns `NextResponse` with status 200
- ✅ Response body is JSON `{ ok: true, variant: "1026761837" }`
- ✅ Response includes `Content-Type: application/json` header
- ✅ No database, auth, or external service dependencies
- ✅ JSDoc comments on every function
- ✅ Full TypeScript type annotations (strict mode)

### Testing
- ✅ Test file created at `src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts`
- ✅ 7 test cases passing:
  - RH-01: HTTP 200 status
  - RH-02: JSON response shape
  - RH-03: Content-Type header
  - RH-04: No auth required
  - RH-05: Consistency across calls
  - RH-06: NextResponse instance
  - RH-07: Response time < 100ms
- ✅ All tests pass: `npm run test src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts`
- ✅ Coverage > 90% for new code

### Code Quality
- ✅ ESLint: `npm run lint` passes with 0 warnings
- ✅ TypeScript: `npm run typecheck` passes with 0 errors
- ✅ Formatting: Code follows Prettier style (runs with `npm run format`)
- ✅ No unused variables, no TODO comments, no console.log()

### Integration
- ✅ Build succeeds: `npm run build` (no errors)
- ✅ All tests pass: `npm run test` (not just this file)
- ✅ Lint passes: `npm run lint`
- ✅ Type check passes: `npm run typecheck`

---

## Definition of Done

A task is done when ALL of the following are true:

1. [ ] Code written: `src/app/api/healthz-smoke-1026761837-b/route.ts` with GET handler
2. [ ] Tests written: `src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts` with 7 test cases
3. [ ] Tests passing: `npm run test` shows all tests green
4. [ ] Lint passing: `npm run lint` shows 0 warnings
5. [ ] Type check passing: `npm run typecheck` shows 0 errors
6. [ ] Build passing: `npm run build` succeeds
7. [ ] Manual test: HTTP GET to localhost:3000/api/healthz-smoke-1026761837-b returns 200 with correct JSON
8. [ ] Commit created: Changes committed to ticket branch with clear message
9. [ ] Pushed: Branch pushed to remote for integration

---

## Testing Strategy

### Unit Tests (Vitest)

**Environment:** jsdom  
**File:** `src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts`

**Test Cases:**

| ID | Test Name | Verifies | Expected |
|----|-----------|----------|----------|
| RH-01 | HTTP 200 status | Status code | 200 |
| RH-02 | JSON shape | `{ ok: true, variant: "1026761837" }` | Exact match |
| RH-03 | Content-Type header | Header value | `application/json` |
| RH-04 | No auth required | No auth guard | 200 (no auth check) |
| RH-05 | Consistency | Multiple calls | Same response all calls |
| RH-06 | NextResponse type | Instance type | `NextResponse` |
| RH-07 | Performance | Response time | < 100ms |

**Running Tests:**
```bash
# Run this file only
npm run test src/app/api/healthz-smoke-1026761837-b/__tests__/route.test.ts

# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

### Manual Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test endpoint:**
   ```bash
   curl http://localhost:3000/api/healthz-smoke-1026761837-b
   ```

3. **Expected response:**
   ```json
   {"ok":true,"variant":"1026761837"}
   ```

4. **Verify status:**
   ```bash
   curl -i http://localhost:3000/api/healthz-smoke-1026761837-b
   # Should show: HTTP/1.1 200 OK
   ```

### Integration Testing

The endpoint is fully integrated once:
- All local tests pass
- Dev server responds correctly
- Production build succeeds
- CI pipeline passes

No additional integration tests needed (endpoints have no external dependencies).

---

## No Refactoring, No Scope Creep

**Keep it simple:**
- Do NOT refactor existing endpoints
- Do NOT consolidate with other endpoints
- Do NOT add configuration or dynamic behavior
- Do NOT add rate limiting or caching
- Focus only on creating this one endpoint following the existing pattern

---

## Rollback

If the task needs to be reverted:
1. Delete `src/app/api/healthz-smoke-1026761837-b/` directory
2. Revert the commit

No data loss, no side effects.

---

## Related Tasks

**Same Sprint (can run in parallel):**
- VRTX-0341: Endpoint A
- VRTX-0345: Endpoint C

**Related work:**
- VRTX-0347: Documentation (depends on all three endpoint tasks)

---

## Success Metrics

✅ Endpoint created and tested  
✅ HTTP 200 with correct JSON response  
✅ Tests passing, coverage > 90%  
✅ Lint and type checks passing  
✅ Build succeeding  
✅ Manual test successful  
✅ Ready for documentation and merge  

---

## Estimated Time

| Activity | Duration |
|----------|----------|
| Code implementation | 10 minutes |
| Test writing | 15 minutes |
| Local verification | 5 minutes |
| **Total** | **30 minutes** |

---

## Notes for Engineer

1. **Pattern Consistency:** Copy the pattern from existing endpoints like `/api/healthz-smoke-572185676/route.ts`. The code is nearly identical except for the variant ID and endpoint suffix.

2. **No Innovation:** Resist the urge to add features, consolidate code, or "improve" the pattern. Consistency is more valuable than cleverness.

3. **Test Template:** The test file follows the established pattern from existing smoke tests. Adapt it but keep the same structure.

4. **Performance:** The endpoint should respond in < 10ms. If your local test shows > 100ms, there's likely a bug (should be < 1ms for this simple handler).

5. **Variant ID:** Always use `"1026761837"` (string, not number).

6. **No Await Needed:** The `async function GET()` is async to match Next.js handler signature, but there's no actual async work. This is fine (and matches existing patterns).

---

## Questions?

See the sprint plan for architecture and design rationale:  
`artifacts/SPRINT-0063/SPRINT-PLAN.md`

Related previous endpoints follow the exact same pattern (check git history):  
`git log --oneline -- src/app/api/healthz-smoke-*`
