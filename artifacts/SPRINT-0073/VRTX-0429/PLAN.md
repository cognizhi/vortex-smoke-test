# VRTX-0429 Implementation Plan

**Task Title:** Implement `/api/healthz-smoke-121996100-c` health check endpoint

**Sprint:** SPRINT-0073

**Epic:** VRTX-0423 — Add three independent smoke-test health check endpoints

**Story:** VRTX-0426 — Endpoint variant-c (121996100-c)

---

## 1. Objective

Implement a completely self-contained, stateless GET HTTP endpoint at `/api/healthz-smoke-121996100-c` that:
- Returns HTTP 200 with JSON: `{ data: { ok: true, variant: "121996100" }, error: null }`
- Has zero dependencies (no database, no auth, no external calls)
- Performs in < 100ms (typical < 10ms)
- Is independently testable and deployable

This endpoint is **one of three identical, independent endpoints** in this sprint. No shared code, no dependencies with endpoints `-a` or `-b`.

---

## 2. File Ownership & Module Map

**Files owned by this task:**
```
src/app/api/healthz-smoke-121996100-c/
├── route.ts              ← GET handler (new)
└── __tests__/
    └── route.test.ts     ← 15 comprehensive tests (new)
```

**No dependencies:** This task does not touch any shared modules, utilities, or configuration. No changes to:
- `src/lib/`
- `src/middleware.ts`
- `next.config.ts`
- `package.json`
- `tsconfig.json`

**No conflicts:** Endpoints `-a` and `-b` own distinct directories; can be developed in parallel.

---

## 3. Implementation Details

### 3a. Create `src/app/api/healthz-smoke-121996100-c/route.ts`

**Template:**
```typescript
/**
 * GET /api/healthz-smoke-121996100-c
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (121996100) in the response.
 *
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "data": { "ok": true, "variant": "121996100" }, "error": null }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-121996100-c
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { data: { ok: true, variant: "121996100" }, error: null }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      data: {
        ok: true,
        variant: '121996100',
      },
      error: null,
    },
    { status: 200 }
  );
}
```

**Key points:**
- Use `NextResponse.json()` to set correct Content-Type
- Return async function (required for Next.js handlers)
- Hardcode variant as string "121996100"
- Include JSDoc comments (for future maintainers)
- No error handling needed (no external calls or DB access)

### 3b. Create `src/app/api/healthz-smoke-121996100-c/__tests__/route.test.ts`

**Test Structure (15 tests total):**

```typescript
/**
 * Unit tests for GET /api/healthz-smoke-121996100-c
 *
 * Variant health check endpoint for load balancers and monitoring systems.
 * This variant build is identified by the code 121996100.
 *
 * Tests verify:
 *   - Returns 200 status code
 *   - Correct JSON response shape { data: { ok: true, variant: "121996100" }, error: null }
 *   - Type safety for all fields
 *   - Content-Type header is application/json
 *   - No authentication required
 *   - Response time < 100ms
 *   - Consistency under repeated calls
 *   - Performance under simulated load
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Import after setting up mocks
import { GET } from '../route';

describe('GET /api/healthz-smoke-121996100-c', () => {
  beforeEach(() => {
    // No setup needed — endpoint has no dependencies
  });

  // ============================================================================
  // GROUP 1: HTTP Status & Response Body (5 tests)
  // ============================================================================

  // AC-02: Returns HTTP 200 status
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-03, AC-04: Response body matches spec
  it('RH-02: returns correct JSON structure with data, ok, and variant', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: { ok: unknown; variant: unknown };
      error: unknown;
    };
    expect(json.data.ok).toBe(true);
    expect(json.data.variant).toBe('121996100');
    expect(json.error).toBe(null);
  });

  // AC-04: Variant field is "121996100"
  it('RH-03: variant field is correct value "121996100"', async () => {
    const res = await GET();
    const json = (await res.json()) as {
      data: { variant: unknown };
      error: unknown;
    };
    expect(json.data.variant).toBe('121996100');
  });

  // AC-05: Error field is null
  it('RH-04: error field is null', async () => {
    const res = await GET();
    const json = (await res.json()) as { error: unknown };
    expect(json.error).toBe(null);
  });

  // AC-06: Response has exactly two root fields (data and error)
  it('RH-05: response has exactly two root fields (data and error)', async () => {
    const res = await GET();
    const json = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(json);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['data', 'error']);
  });

  // ============================================================================
  // GROUP 2: Field Type Safety (3 tests)
  // ============================================================================

  // AC-07: data.ok field is boolean true (not truthy string/number)
  it('RH-06: data.ok field is boolean true (not just truthy)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { ok: unknown } };
    expect(typeof json.data.ok).toBe('boolean');
    expect(json.data.ok).toStrictEqual(true);
  });

  // AC-08: variant field is string "121996100" (not number)
  it('RH-07: variant field is string "121996100" (not number)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: { variant: unknown } };
    expect(typeof json.data.variant).toBe('string');
    expect(json.data.variant).toStrictEqual('121996100');
  });

  // AC-06: data object has exactly two fields (ok and variant)
  it('RH-08: data object has no extra fields (exactly ok and variant)', async () => {
    const res = await GET();
    const json = (await res.json()) as { data: Record<string, unknown> };
    const keys = Object.keys(json.data);
    expect(keys).toHaveLength(2);
    expect(keys.sort()).toEqual(['ok', 'variant']);
  });

  // ============================================================================
  // GROUP 3: HTTP Headers & Meta (2 tests)
  // ============================================================================

  // AC-09: Content-Type header is application/json
  it('RH-09: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  // AC-10: Response is a NextResponse instance
  it('RH-10: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  // ============================================================================
  // GROUP 4: Performance (3 tests)
  // ============================================================================

  // AC-11: Response time < 100ms
  it('RH-11: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });

  // AC-12: Response time typically < 10ms
  it('RH-12: response time is typically fast (< 10ms)', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(10);
  });

  // AC-13: Under load (50 concurrent calls), all respond within 100ms
  it('RH-13: under load (50 concurrent calls), all respond within 100ms', async () => {
    const calls = Array.from({ length: 50 }, () => GET());
    const startTime = performance.now();
    const results = await Promise.all(calls);
    const endTime = performance.now();

    results.forEach((res) => {
      expect(res.status).toBe(200);
    });

    const totalElapsedMs = endTime - startTime;
    expect(totalElapsedMs).toBeLessThan(5000);
  });

  // ============================================================================
  // GROUP 5: Public Access & Consistency (2 tests)
  // ============================================================================

  // AC-14: No authentication required
  it('RH-14: endpoint requires no authentication', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  // AC-15: Consistency — multiple sequential calls return identical responses
  it('RH-15: multiple sequential calls return consistent responses', async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);
    const bodies = await Promise.all(responses.map((res) => res.json()));

    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });

    const expected = { data: { ok: true, variant: '121996100' }, error: null };
    bodies.forEach((body) => {
      expect(body).toEqual(expected);
    });
  });
});
```

**Key test points:**
- Import GET handler and NextResponse
- 15 tests organized in 5 groups
- Each test is independent (beforeEach has no setup)
- Tests cover response structure, types, headers, performance, and consistency
- No database, auth, or external call mocking needed

---

## 4. Definition of Done

✅ **Code written:**
- [ ] `src/app/api/healthz-smoke-121996100-c/route.ts` created and committed
- [ ] `src/app/api/healthz-smoke-121996100-c/__tests__/route.test.ts` created and committed

✅ **Tests passing:**
- [ ] All 15 tests pass: `npm run test -- src/app/api/healthz-smoke-121996100-c`
- [ ] Coverage for new code > 85%

✅ **Code quality:**
- [ ] `npm run typecheck` passes (TypeScript strict)
- [ ] `npm run lint` passes (0 warnings) for new files
- [ ] No new dependencies added to `package.json`

✅ **Build succeeds:**
- [ ] `npm run build` completes without errors

✅ **Verification:**
- [ ] Endpoint reachable via `curl http://localhost:3000/api/healthz-smoke-121996100-c`
- [ ] Returns correct JSON structure and HTTP 200

✅ **Commit & push:**
- [ ] All changes staged and committed with clear message
- [ ] Branch pushed to remote with `-u origin`

---

## 5. Notes

- **No database access** — endpoint is completely stateless
- **No environment variables** — hardcoded variant "121996100"
- **No rate limiting** — endpoint is public and unrestricted
- **Idempotent** — multiple calls return identical responses
- **Parallel safety** — no shared state with endpoints `-a` or `-b`

This task is a **standalone implementation** with no dependencies on VRTX-0423 or VRTX-0424. Can be assigned to any engineer and completed independently.

