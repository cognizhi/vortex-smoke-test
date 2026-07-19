# TASK-0093-001-C: Implement /healthz-smoke-929192825-c endpoint

**Story:** STORY-0093-001-C — "Add /healthz-smoke-929192825-c endpoint"

**Scope:** Create a completely independent GET HTTP endpoint at `/api/healthz-smoke-929192825-c` that returns a deterministic health check response.

---

## Implementation Details

### Files to Create

1. **`src/app/api/healthz-smoke-929192825-c/route.ts`**
   - GET handler that returns `{ ok: true, variant: "929192825" }` with HTTP 200
   - No shared code, no dependencies, no middleware
   - Response time target: <100ms (typical <10ms)

2. **`src/app/api/healthz-smoke-929192825-c/__tests__/route.test.ts`**
   - Comprehensive test suite with 100% coverage of route.ts
   - Tests:
     - Response status is 200
     - Response body equals `{ ok: true, variant: "929192825" }`
     - Response body has exactly two keys: `ok` and `variant`
     - `ok` is boolean true
     - `variant` is string "929192825"
     - Content-Type header contains "application/json"

### Implementation Pattern

Follow exact pattern from `/workspace/repo/src/app/api/healthz-smoke-509572604-c/`:

**route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '929192825' },
    { status: 200 }
  )
}
```

**route.test.ts:**
- Import Vitest, GET handler, NextRequest
- Create describe block for "GET /api/healthz-smoke-929192825-c"
- Implement 3+ test cases covering response status, body structure, headers
- Use NextRequest constructor with proper URL and method

### Quality Gates

Before commit:
1. `npm run lint` — must pass with 0 warnings
2. `npm run typecheck` — must pass with no errors
3. `npm run test src/app/api/healthz-smoke-929192825-c/__tests__/route.test.ts` — all tests pass
4. Verify no console errors or warnings in test output

### Commit

```bash
git add src/app/api/healthz-smoke-929192825-c/
git commit -m "feat(sprint-0093): add /healthz-smoke-929192825-c endpoint

- Create GET handler returning { ok: true, variant: '929192825' }
- Add comprehensive test suite with response validation
- Follows pattern from existing smoke test endpoints
- No shared code, no dependencies, no database queries"
```

### Acceptance Criteria

- [ ] Route file exists at `src/app/api/healthz-smoke-929192825-c/route.ts`
- [ ] Test file exists at `src/app/api/healthz-smoke-929192825-c/__tests__/route.test.ts`
- [ ] GET /api/healthz-smoke-929192825-c returns HTTP 200
- [ ] Response body is exactly `{ ok: true, variant: "929192825" }`
- [ ] Test suite passes with ≥3 test cases
- [ ] `npm run lint` passes with 0 warnings
- [ ] `npm run typecheck` passes with no errors
- [ ] Changes committed on feature branch

---

## Key Points

- **Standalone** — No shared code or dependencies with other endpoints
- **No Database** — Pure stateless HTTP handler
- **No Auth** — Public endpoint, no authentication required
- **Deterministic** — Always returns same response, no side effects
- **Fast** — <10ms typical response time, <100ms target

