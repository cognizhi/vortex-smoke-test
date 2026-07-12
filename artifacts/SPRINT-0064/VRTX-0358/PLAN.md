# VRTX-0358: Implement `/api/healthz-smoke-637917955-a` endpoint

**Part of:** SPRINT-0064 — Three Independent Variant Smoke Test Endpoints (637917955)

**Scope:** Implement a single, self-contained variant-specific health check endpoint at `/api/healthz-smoke-637917955-a` with comprehensive test coverage.

---

## 1. What We're Building

A lightweight, dependency-free HTTP GET endpoint that returns a JSON response identifying the "637917955-a" variant.

**Endpoint:** `GET /api/healthz-smoke-637917955-a`

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "637917955"
}
```

**Characteristics:**
- Public endpoint (no authentication)
- No database dependencies
- No external API calls
- No state management
- Hardcoded variant identifier
- Target response time: < 100ms (typical < 10ms)

---

## 2. File Ownership Map

This task owns the following files (no shared files with other tasks):

```
src/app/api/
└── healthz-smoke-637917955-a/
    ├── route.ts                    ← GET handler
    └── __tests__/
        └── route.test.ts           ← Comprehensive test suite
```

**Documentation (shared with other tasks, updated once per sprint):**
- `ARCHITECTURE.md` (health check inventory + changelog)
- `PRODUCT.md` (changelog entry)

---

## 3. Implementation Details

### Handler File: `src/app/api/healthz-smoke-637917955-a/route.ts`

**Content:**
```typescript
/**
 * GET /api/healthz-smoke-637917955-a
 *
 * Variant-specific lightweight smoke test endpoint for load balancers and monitoring systems.
 * This endpoint identifies the specific variant build (637917955) in the response.
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
 *   { "ok": true, "variant": "637917955" }
 */
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-637917955-a
 *
 * Returns a deterministic health check response with variant identification.
 * Since the handler has no dependencies, it always returns 200 with ok: true.
 * If the endpoint is unreachable, the infrastructure (load balancer, orchestration platform) handles that.
 *
 * @returns NextResponse with status 200 and body { ok: true, variant: "637917955" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '637917955',
    },
    { status: 200 }
  );
}
```

**Key decisions:**
- Hardcoded variant string "637917955" (not parameterized)
- Async function for consistency with Next.js patterns
- `NextResponse.json()` for proper JSON serialization and headers
- Explicit status 200 for clarity

### Test File: `src/app/api/healthz-smoke-637917955-a/__tests__/route.test.ts`

**Content:** Comprehensive 15-test suite organized in 7 test suites

**Test Suites:**

| Suite | Count | What it tests |
|-------|-------|---------------|
| Response Status & Body | 5 tests | HTTP 200, JSON parsing, field count, `ok` type, `variant` value |
| HTTP Headers | 1 test | `Content-Type: application/json` |
| Consistency | 1 test | Multiple calls return identical responses |
| Performance | 2 tests | Response time < 100ms, typical < 50ms |
| Load Testing | 2 tests | 50 concurrent requests all return 200, all with correct body |
| No Dependencies | 3 tests | No DB access, no auth required, no side effects |
| Type Safety | 1 test | Response is `NextResponse` instance |

**Test file structure:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-637917955-a', () => {
  beforeEach(() => {
    // No setup needed
  });

  describe('Suite 1: Response Status and Body', () => {
    // RH-01 through RH-05
  });

  describe('Suite 2: HTTP Headers', () => {
    // RH-06
  });

  describe('Suite 3: Consistency', () => {
    // RH-07
  });

  describe('Suite 4: Performance', () => {
    // RH-08, RH-09
  });

  describe('Suite 5: Load Testing', () => {
    // RH-10, RH-11
  });

  describe('Suite 6: No Dependencies', () => {
    // RH-12, RH-13, RH-14
  });

  describe('Suite 7: Type Safety', () => {
    // RH-15
  });
});
```

**Reference:** See `/workspace/repo/src/app/api/healthz-smoke-28611693/__tests__/route.test.ts` for complete example.

---

## 4. Test Coverage

**15 tests, 100% code coverage:**

1. **RH-01:** Returns HTTP 200 status
2. **RH-02:** Returns valid JSON with exact response body
3. **RH-03:** Response body has exactly 2 fields (ok and variant)
4. **RH-04:** `ok` field is boolean `true`
5. **RH-05:** `variant` field is string "637917955"
6. **RH-06:** Content-Type header is `application/json`
7. **RH-07:** Multiple calls return identical responses
8. **RH-08:** Response completes in less than 100ms
9. **RH-09:** Response completes in less than 50ms (typical)
10. **RH-10:** Handles 50 concurrent requests with all returning 200
11. **RH-11:** All concurrent requests return correct response body
12. **RH-12:** Handler executes without making database queries
13. **RH-13:** Handler returns response without requiring authentication
14. **RH-14:** Handler has no external side effects
15. **RH-15:** Response is a `NextResponse` instance

---

## 5. Definition of Done

This task is complete when:

- [ ] File `src/app/api/healthz-smoke-637917955-a/route.ts` exists and is committed
- [ ] File `src/app/api/healthz-smoke-637917955-a/__tests__/route.test.ts` exists and is committed
- [ ] All 15 tests pass: `npm run test src/app/api/healthz-smoke-637917955-a/__tests__/route.test.ts`
- [ ] Code coverage 100% for new endpoint code
- [ ] Lint clean: `npm run lint` (0 warnings across entire repo)
- [ ] TypeScript strict: `npm run typecheck` (no errors)
- [ ] Build succeeds: `npm run build`
- [ ] Manual verification: `GET http://localhost:3000/api/healthz-smoke-637917955-a` returns `{"ok":true,"variant":"637917955"}`
- [ ] Response time verified < 100ms in test suite
- [ ] Commit message clear and descriptive
- [ ] Branch pushed to remote with `-u origin` flag

---

## 6. Reference Patterns

### How to Run Tests Locally
```bash
# Single test file
npm run test src/app/api/healthz-smoke-637917955-a/__tests__/route.test.ts

# Watch mode
npm run test -- --watch src/app/api/healthz-smoke-637917955-a/__tests__/route.test.ts

# Coverage report
npm run test:coverage src/app/api/healthz-smoke-637917955-a/__tests__/route.test.ts
```

### How to Test the Endpoint Locally
```bash
# After npm run dev
curl http://localhost:3000/api/healthz-smoke-637917955-a

# Expected output
{"ok":true,"variant":"637917955"}
```

### How to Verify Performance
The performance tests in the suite verify:
- Response completes in < 100ms
- Typical responses complete in < 50ms

---

## 7. Related Work

This task is **completely independent** — it does not depend on or share code with:
- VRTX-0359 (healthz-smoke-637917955-b endpoint)
- VRTX-0360 (healthz-smoke-637917955-c endpoint)

Each endpoint is a standalone implementation with its own files.

---

## 8. Notes for Implementer

1. **Copy-paste OK:** You can copy the exact pattern from `src/app/api/healthz-smoke-28611693/` as a template, then update:
   - The directory name to `healthz-smoke-637917955-a`
   - The variant string to `"637917955"` (same in all three endpoints)
   - The endpoint path in comments to `/api/healthz-smoke-637917955-a`

2. **No shared utilities:** Do not create or use shared helpers — each endpoint should be self-contained.

3. **Variant string is "637917955":** All three endpoints (a, b, c) return the same variant string "637917955". The difference is in the URL suffix (-a, -b, -c) which allows operations teams to monitor three independent builds.

4. **Tests are comprehensive:** The 15-test suite is intentionally thorough to ensure:
   - Response format is correct
   - No hidden dependencies (database, auth, side effects)
   - Performance meets targets
   - Load testing passes

5. **Run full test suite before committing:** `npm run test` to ensure no regressions in other endpoints.

---

## 9. Success Metrics

After this task is done:
- ✅ Endpoint accessible at `GET /api/healthz-smoke-637917955-a`
- ✅ Returns `{ ok: true, variant: "637917955" }`
- ✅ HTTP 200 status
- ✅ Zero dependencies (no DB, auth, or external calls)
- ✅ Response time < 100ms
- ✅ 15 tests pass, 100% coverage
- ✅ All repo lint/TypeScript/build checks pass
- ✅ Committed and pushed to remote
