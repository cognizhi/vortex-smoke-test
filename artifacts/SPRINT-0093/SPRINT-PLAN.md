# SPRINT-0093 Plan: Add Three Independent Healthz-Smoke Endpoints (929192825)

**Sprint Goal:** Deliver three completely independent, self-contained GET HTTP endpoints (`/healthz-smoke-929192825-a`, `/healthz-smoke-929192825-b`, `/healthz-smoke-929192825-c`) that return deterministic health check responses with no shared code, no auth, no database dependencies, and no orchestration overhead between them.

**Sprint Idea:** VST-0080 (smoke-178447759538041)

**Date:** 2026-07-19

---

## 1. Scope

### In Scope
- Three independent GET endpoints at `/api/healthz-smoke-929192825-{a,b,c}`
- Each returns `{ ok: true, variant: "929192825" }` with HTTP 200
- Each has its own isolated route handler and test suite
- No shared utilities, helpers, or dependencies between the three
- Response time target: <100ms per endpoint (typical <10ms)
- Designed for load balancer and Kubernetes readiness probes

### Out of Scope
- Authentication
- Database queries or dependencies
- Shared helper code between endpoints
- HTTP methods other than GET
- Caching headers or conditional logic
- Changes to existing endpoints or platform infrastructure

---

## 2. Acceptance Criteria

All criteria from the idea (VST-0080) must be met:

- [ ] GET `/api/healthz-smoke-929192825-a` returns HTTP 200 with body `{ ok: true, variant: "929192825" }`
- [ ] GET `/api/healthz-smoke-929192825-b` returns HTTP 200 with body `{ ok: true, variant: "929192825" }`
- [ ] GET `/api/healthz-smoke-929192825-c` returns HTTP 200 with body `{ ok: true, variant: "929192825" }`
- [ ] Each endpoint has comprehensive test coverage (unit tests for response structure, status code, Content-Type header)
- [ ] No shared code between the three implementations (each is a standalone route + test pair)
- [ ] All three endpoints deployable in parallel with no dependency constraints
- [ ] Existing endpoints (`/api/healthz-smoke`, `/api/health`, etc.) remain unmodified and passing
- [ ] CI pipeline runs successfully: lint, typecheck, tests (all three new endpoints + existing), and build

---

## 3. Ticket Decomposition (Minimum Viable Backlog)

### EPIC-0093-001: "Add three independent healthz-smoke endpoints (variant 929192825)"
**Acceptance Criteria:**
- All three endpoints return correct HTTP 200 response with expected JSON body
- Each endpoint has isolated tests with ≥80% code coverage
- No shared code between endpoints
- All lint, typecheck, and test phases pass
- Sprint checklist validation passes with no blockers

**Stories and Tasks** (see ticket creation section below for full details):

#### STORY-0093-001-A: "Add /healthz-smoke-929192825-a endpoint"
→ TASK-0093-001-A: Implement endpoint and tests

#### STORY-0093-001-B: "Add /healthz-smoke-929192825-b endpoint"
→ TASK-0093-001-B: Implement endpoint and tests

#### STORY-0093-001-C: "Add /healthz-smoke-929192825-c endpoint"
→ TASK-0093-001-C: Implement endpoint and tests

#### STORY-0093-002: "Verify all three endpoints and run CI"
→ TASK-0093-002: Integration test, CI verification, and final acceptance

---

## 4. Implementation Phases

### Phase 1: Parallel Implementation (Tasks run in parallel)
**Duration:** ~2 hours (wall-clock)
**Owner:** Engineer(s) (can parallelize across three team members or serial)

Three independent implementation tasks, with **no dependencies between them**:

#### Task A: Implement `/api/healthz-smoke-929192825-a`
- Create directory: `src/app/api/healthz-smoke-929192825-a/`
- Create `route.ts` with GET handler returning `{ ok: true, variant: "929192825" }`
- Create `__tests__/route.test.ts` with:
  - Response status (200) test
  - Response body structure test (has `ok` and `variant` keys, no others)
  - `ok` value is boolean true
  - `variant` value is string "929192825"
  - Content-Type header includes "application/json"
- Run `npm run lint` and `npm run typecheck` — must pass
- Commit: "feat(sprint-0093): add /healthz-smoke-929192825-a endpoint"

#### Task B: Implement `/api/healthz-smoke-929192825-b`
- Create directory: `src/app/api/healthz-smoke-929192825-b/`
- Create `route.ts` with GET handler returning `{ ok: true, variant: "929192825" }`
- Create `__tests__/route.test.ts` with same comprehensive test structure as Task A
- Run `npm run lint` and `npm run typecheck` — must pass
- Commit: "feat(sprint-0093): add /healthz-smoke-929192825-b endpoint"

#### Task C: Implement `/api/healthz-smoke-929192825-c`
- Create directory: `src/app/api/healthz-smoke-929192825-c/`
- Create `route.ts` with GET handler returning `{ ok: true, variant: "929192825" }`
- Create `__tests__/route.test.ts` with same comprehensive test structure as Task A
- Run `npm run lint` and `npm run typecheck` — must pass
- Commit: "feat(sprint-0093): add /healthz-smoke-929192825-c endpoint"

**Output:** Three isolated commits, each adding one endpoint + tests, ready for parallel merge.

---

### Phase 2: Test-Harness & Verification
**Duration:** ~1.5 hours (wall-clock)
**Owner:** QA / Engineer

After all three tasks are merged:

1. **Unit Tests** — Run comprehensive Vitest suite:
   ```bash
   npm run test -- src/app/api/healthz-smoke-929192825-{a,b,c}/__tests__/route.test.ts
   ```
   - All new endpoint tests pass
   - Existing health endpoint tests still pass (e.g., `/healthz-smoke`, `/health`)

2. **Full Test Coverage** — Run with coverage report:
   ```bash
   npm run test:coverage
   ```
   - Verify new code is >80% covered
   - No regressions in existing coverage

3. **Manual Smoke Test** — Verify endpoint responses in dev environment:
   ```bash
   npm run dev
   # In parallel terminal:
   curl -s http://localhost:3000/api/healthz-smoke-929192825-a | jq
   curl -s http://localhost:3000/api/healthz-smoke-929192825-b | jq
   curl -s http://localhost:3000/api/healthz-smoke-929192825-c | jq
   ```
   Expected: Each returns `{"ok":true,"variant":"929192825"}` with HTTP 200

4. **Performance Validation** — Confirm sub-100ms response times:
   ```bash
   # Measure response time with curl
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/healthz-smoke-929192825-a
   ```
   Expected: <100ms, typical <10ms

**Output:** Verification checklist signed off.

---

### Phase 3: CI Pipeline Validation
**Duration:** ~10 minutes (automated)
**Owner:** CI (GitHub Actions or equivalent)

On merge to sprint branch, CI runs:

1. **Lint** (`npm run lint`):
   - ESLint on new endpoint files
   - Must have 0 warnings (--max-warnings 0)
   - Validate code style matches codebase conventions

2. **Type Check** (`npm run typecheck`):
   - TypeScript strict mode (tsc --noEmit)
   - All imports/exports resolve
   - NextResponse and NextRequest types correct

3. **Test Suite** (`npm run test run`):
   - Run all tests including new three endpoints
   - All existing tests still pass
   - No test regressions

4. **Build** (`npm run build`):
   - Next.js production build succeeds
   - No build warnings or errors
   - Bundle size check (no significant increase expected)

**Output:** CI pipeline green, all checks pass.

---

### Phase 4: Acceptance & Closure
**Duration:** ~30 minutes
**Owner:** Product / QA

Final acceptance before sprint closure:

1. **All Acceptance Criteria Verified**:
   - ✓ Three endpoints respond with correct JSON
   - ✓ Each has comprehensive tests
   - ✓ No shared code between them
   - ✓ No modifications to existing endpoints
   - ✓ CI pipeline passes

2. **Documentation Updated**:
   - ARCHITECTURE.md updated with entry in "Smoke Test Endpoints" section
   - DESIGN.md updated if any UI-facing endpoints affected (none in this case)
   - Changelog entries added to each doc

3. **Sprint Checklist**:
   - Run `a2a_sprint_plan_checklist` to validate ticket dependencies and scope
   - Fix any blockers or warnings

4. **Sprint Closure**:
   - Mark all tickets DONE
   - Transition sprint to CLOSE
   - Document any learnings in memory

---

## 5. Testing Strategy

### Unit Tests
Each endpoint has a dedicated test file (`__tests__/route.test.ts`) with:

1. **Response Status** — Verify HTTP 200
2. **Response Body** — Verify exact JSON structure:
   - Contains `ok` (boolean) and `variant` (string) fields
   - No extra fields
   - No nested objects
3. **Response Headers** — Verify Content-Type is application/json
4. **Edge Cases** (if any):
   - Invalid HTTP methods (e.g., POST) should 405 (handled by Next.js)
   - No query parameters expected (endpoint ignores them)

### Integration Tests
- Manual curl test during Phase 2 to confirm end-to-end routing and response
- Load balancer probe simulation (repeated HEAD/GET requests)

### Regression Tests
- Verify existing health endpoints still work:
  - `/api/health` (if exists)
  - `/api/healthz-smoke` (base endpoint)
  - Any other monitoring endpoints

### Test Execution
```bash
# All new endpoint tests
npm run test -- src/app/api/healthz-smoke-929192825-{a,b,c}/__tests__/

# With coverage
npm run test:coverage

# Watch mode during development
npm run test src/app/api/healthz-smoke-929192825-a/__tests__/route.test.ts
```

---

## 6. CI/CD Pipeline

### Triggers
- On push to sprint branch (`vortex/sprint/sprint-0093-*`)
- On pull request to sprint or main branch (for intermediate verification)

### Steps
1. **Checkout** — Clone repo at commit SHA
2. **Setup** — Node.js 22.x, npm ci (locked dependencies)
3. **Lint** — `npm run lint --max-warnings 0` (0 warnings allowed)
4. **Typecheck** — `npm run typecheck` (TypeScript strict)
5. **Test** — `npm run test run` (all tests, coverage report)
6. **Build** — `npm run build` (production build)
7. **Report** — Attach artifacts (coverage HTML, build logs)

### Success Criteria
- All steps complete with exit code 0
- No warnings in lint output
- Test coverage ≥80% for new code
- Build artifacts generated successfully

### Failure Handling
- If lint fails: Review file and re-commit with corrections
- If typecheck fails: Review types and re-commit with fixes
- If tests fail: Debug failing test, re-commit with fix
- If build fails: Review build log, fix errors, re-commit

---

## 7. File Structure

After completion, the repository will contain:

```
src/app/api/
├── healthz-smoke-929192825-a/
│   ├── route.ts                 (GET handler)
│   └── __tests__/
│       └── route.test.ts        (comprehensive tests)
├── healthz-smoke-929192825-b/
│   ├── route.ts                 (GET handler)
│   └── __tests__/
│       └── route.test.ts        (comprehensive tests)
└── healthz-smoke-929192825-c/
    ├── route.ts                 (GET handler)
    └── __tests__/
        └── route.test.ts        (comprehensive tests)
```

Each follows the exact same file structure and conventions as existing smoke test endpoints (e.g., `/healthz-smoke-509572604-a`).

---

## 8. Key Decisions

- **No shared code** — Each endpoint is completely independent. No helper functions, no constants file, no shared middleware. This ensures they can be developed, tested, and deployed in parallel without any coordination overhead.
- **Variant value** — All three endpoints share the same `variant: "929192825"` to indicate they're part of the same test batch, following existing patterns (e.g., `509572604-a` all return variant `509572604`).
- **Response format** — Simple `{ ok: true, variant: "..." }` with no nested structure or extra fields, matching existing smoke endpoint patterns.
- **No database or auth** — These are pure, stateless HTTP handlers. No tenant resolution, no database calls, no JWT verification.

---

## 9. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| File path conflicts or duplicate routes | Low | Medium | Verify unique paths before implementation; Next.js route resolution is deterministic |
| Test framework issues | Low | Low | Tests follow existing pattern from 509572604-a; reuse test structure |
| TypeScript type mismatches | Low | Low | IDE will flag immediately; NextResponse and NextRequest types are stable |
| Performance regression | Very Low | Low | No shared code means no performance impact on existing endpoints |

---

## 10. Success Metrics

- ✅ All three endpoints respond 200 with correct JSON
- ✅ All new tests pass and maintain >80% coverage
- ✅ Existing endpoints unmodified and still passing
- ✅ CI pipeline green on merge
- ✅ Sprint closes with all tickets marked DONE
- ✅ No regressions in performance, reliability, or other endpoints

---

## 11. Appendices

### A. Reference: Existing Smoke Endpoint Pattern
Pattern file: `/workspace/repo/src/app/api/healthz-smoke-509572604-a/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '509572604' },
    { status: 200 }
  )
}
```

Test file: `/workspace/repo/src/app/api/healthz-smoke-509572604-a/__tests__/route.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/healthz-smoke-509572604-a', () => {
  it('returns 200 with correct JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-509572604-a', {
      method: 'GET',
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, variant: '509572604' });
  });

  it('has correct response structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-509572604-a', {
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
    const request = new NextRequest('http://localhost:3000/api/healthz-smoke-509572604-a', {
      method: 'GET',
    });
    const response = await GET(request);

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
```

### B. Commands to Execute

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Quality checks
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test         # Vitest (watch by default)
npm run test run     # Vitest (single run for CI)
npm run test:coverage # Coverage report

# Build
npm run build        # Production build
npm run start        # Serve production build

# Manual testing
curl http://localhost:3000/api/healthz-smoke-929192825-a
curl http://localhost:3000/api/healthz-smoke-929192825-b
curl http://localhost:3000/api/healthz-smoke-929192825-c
```

---

**Sprint Plan Complete** | 2026-07-19

