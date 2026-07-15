# SPRINT-0069 Plan — Add Independent Health Check Endpoints

**Idea**: VST-0046 — [smoke-178413759242571] 3 independent endpoints (276127630)

**Sprint Goal**: Enhance the running service by adding THREE completely independent GET HTTP endpoints (`/healthz-smoke-276127630-a`, `/healthz-smoke-276127630-b`, `/healthz-smoke-276127630-c`), each as a self-contained unit with no shared code, no inter-dependencies, and no external dependencies (no auth, no database).

---

## Overview

### Context

The booking SaaS platform currently has foundational health check endpoints (`/api/health` and `/api/healthz-smoke`). This sprint adds three independent variants designed to support diverse deployment and monitoring scenarios. Each endpoint is deliberately isolated — no shared utilities, no cross-endpoint dependencies, no middleware beyond basic Next.js routing — allowing parallel development and independent testing.

### What We're Building

Three identical-logic but completely isolated GET endpoints:

| Endpoint | Response | Auth | Dependencies | File |
|----------|----------|------|--------------|------|
| `/api/healthz-smoke-276127630-a` | `{ ok: true, variant: "276127630" }` | None | None | `src/app/api/healthz-smoke-276127630-a/route.ts` |
| `/api/healthz-smoke-276127630-b` | `{ ok: true, variant: "276127630" }` | None | None | `src/app/api/healthz-smoke-276127630-b/route.ts` |
| `/api/healthz-smoke-276127630-c` | `{ ok: true, variant: "276127630" }` | None | None | `src/app/api/healthz-smoke-276127630-c/route.ts` |

**Contract Guarantees**:
- HTTP method: GET
- HTTP status: 200 (success), 500 (error)
- Response body:
  ```json
  {
    "ok": true,
    "variant": "276127630"
  }
  ```
- No request body required
- No authentication headers required
- No database calls
- No external service calls
- Maximum latency: < 100ms (best effort)

---

## Phases

### Phase 1: Planning & Documentation (Completed)
**Duration**: This document
**Deliverables**: Sprint plan, root docs (AGENT.md, PRODUCT.md, ARCHITECTURE.md, DESIGN.md), ticket decomposition
**Owner**: Product

---

### Phase 2: Implementation
**Duration**: ~30 min per task (3 tasks in parallel)
**Deliverables**: Three route handlers with full typing

**Implementation Details**:
- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict mode, no `any`)
- **Pattern**: Route handler in `src/app/api/healthz-smoke-<variant>/route.ts`
- **Handler Signature**:
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  
  export async function GET(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json(
      { ok: true, variant: '276127630' },
      { status: 200 }
    )
  }
  ```
- **Constraints**:
  - No shared utility functions across endpoints
  - No imports from `lib/` or other endpoints
  - No middleware
  - Inline response for full self-containment
  - TypeScript types must be complete (no implicit `any`)

**Tasks**:
- **TASK-0069-A**: Implement `/healthz-smoke-276127630-a` endpoint (no dependencies)
- **TASK-0069-B**: Implement `/healthz-smoke-276127630-b` endpoint (no dependencies)
- **TASK-0069-C**: Implement `/healthz-smoke-276127630-c` endpoint (no dependencies)

---

### Phase 3: Test Harness
**Duration**: ~20 min per task (3 tasks in parallel)
**Deliverables**: Unit tests for all three endpoints

**Testing Strategy**:
- **Framework**: Vitest 2.1.9 (jsdom environment)
- **Test Location**: Co-located `__tests__/route.test.ts` under each endpoint directory
- **Test Pattern**: Mirrors existing `src/app/api/healthz-smoke/__tests__/route.test.ts`
- **Test File Structure**:
  ```typescript
  import { GET } from '../route'
  import { NextRequest } from 'next/server'
  
  describe('/api/healthz-smoke-276127630-[variant]', () => {
    // Test cases
  })
  ```

**Per-Endpoint Test Cases** (replicable for all three variants):
1. **Status Code**: Verify endpoint returns HTTP 200
2. **Content-Type**: Verify `application/json` response header
3. **Response Structure**: Verify response body has `ok` (boolean) and `variant` (string)
4. **Correct Values**: Verify `ok === true` and `variant === "276127630"`
5. **Performance**: Verify response time < 100ms
6. **Consistency**: Verify 10 sequential calls return identical response
7. **Concurrent Load**: Verify 50 concurrent calls all succeed with correct response

**Test File Template**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'

describe('/api/healthz-smoke-276127630-[variant]', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = new NextRequest(
      new URL('http://localhost:3000/api/healthz-smoke-276127630-[variant]')
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

**Tasks**:
- **TASK-0069-A**: Write unit tests for `/healthz-smoke-276127630-a`
- **TASK-0069-B**: Write unit tests for `/healthz-smoke-276127630-b`
- **TASK-0069-C**: Write unit tests for `/healthz-smoke-276127630-c`

---

### Phase 4: Linting, Typecheck & Test Validation
**Duration**: ~5 min
**Deliverables**: Clean lint, typecheck, and test passes

**Validation Commands**:
```bash
npm run lint       # ESLint — must be 0 warnings
npm run typecheck  # tsc --noEmit (strict mode)
npm run test:ci    # Vitest CI mode (single run, all tests)
npm run test -- src/app/api/healthz-smoke-276127630-a  # Per-endpoint test runs
npm run test -- src/app/api/healthz-smoke-276127630-b
npm run test -- src/app/api/healthz-smoke-276127630-c
```

**Expected Outcomes**:
- ✅ Zero ESLint warnings or errors
- ✅ Full TypeScript strict mode compliance (no implicit `any`, complete type annotations)
- ✅ All per-endpoint unit tests pass
- ✅ All lint and typecheck tests execute successfully

---

### Phase 5: CI Pipeline (Specification)
**Duration**: Not implemented in this sprint; specification only
**Owner**: DevOps/Infrastructure
**Status**: OUT OF SCOPE for implementation, but specified below for future automation

**CI Trigger**: On push to sprint branch or PR to main

**CI Pipeline Stages**:

#### Stage 1: Lint & Typecheck (parallel)
```bash
npm run lint && npm run typecheck
```
- Timeout: 5 min
- Failure: Block merge

#### Stage 2: Test (single run, all tests)
```bash
npm run test:ci
```
- Timeout: 10 min
- Coverage: v8 (optional, no gate)
- Failure: Block merge

#### Stage 3: Build (Next.js production build)
```bash
npm run build
```
- Timeout: 15 min
- Artifacts: `.next/` directory
- Failure: Block merge

#### Stage 4: Integration Tests (if available)
```bash
npm run test:integration  # Placeholder — not currently defined
```
- Timeout: 10 min
- Only runs if test:integration script exists
- Failure: Block merge

**Example GitHub Actions Workflow** (`.github/workflows/ci.yml` template):
```yaml
name: CI

on:
  push:
    branches: [ main, vortex/** ]
  pull_request:
    branches: [ main ]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:ci

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
```

---

## Decomposition

### Ticket Structure

```
EPIC-0069: Add independent health check endpoints for variant 276127630
└── TASK-0069-A: Implement /healthz-smoke-276127630-a endpoint & tests (no deps)
└── TASK-0069-B: Implement /healthz-smoke-276127630-b endpoint & tests (no deps)
└── TASK-0069-C: Implement /healthz-smoke-276127630-c endpoint & tests (no deps)
```

### Rationale

- **EPIC-level**: Single standalone feature (add variant endpoints)
- **Single TASK per endpoint**: No shared code, no shared test setup, complete self-containment
- **No inter-task dependencies**: Each endpoint is isolated, can be developed in parallel
- **Parallel execution**: All three tasks can run simultaneously on different machines/agents

---

## File Ownership Map

### New Files (One per Task)

**TASK-0069-A**:
- `src/app/api/healthz-smoke-276127630-a/route.ts` (handler, ~20 lines)
- `src/app/api/healthz-smoke-276127630-a/__tests__/route.test.ts` (tests, ~120 lines)

**TASK-0069-B**:
- `src/app/api/healthz-smoke-276127630-b/route.ts` (handler, ~20 lines)
- `src/app/api/healthz-smoke-276127630-b/__tests__/route.test.ts` (tests, ~120 lines)

**TASK-0069-C**:
- `src/app/api/healthz-smoke-276127630-c/route.ts` (handler, ~20 lines)
- `src/app/api/healthz-smoke-276127630-c/__tests__/route.test.ts` (tests, ~120 lines)

### No Shared Code
- No utility functions shared between endpoints
- No modifications to existing files (no imports in other handlers)
- No changes to middleware or global configuration

---

## Success Criteria

✅ All three endpoints respond with HTTP 200  
✅ All endpoints return `{ ok: true, variant: "276127630" }`  
✅ All unit tests pass (7 tests per endpoint = 21 total)  
✅ Zero ESLint warnings or errors  
✅ Full TypeScript strict mode compliance  
✅ Response latency < 100ms per endpoint  
✅ No shared code across endpoints  
✅ Ci pipeline specification documented (even if not executed)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Task ordering / blocking | No dependencies — tasks run in parallel; mitigated by independent file ownership |
| TypeScript strict mode violations | Code review checklist in PLAN.md files; linter enforces in CI |
| Performance regression | Hardcoded simple response; performance tests verify < 100ms |
| Copy-paste errors across endpoints | Each endpoint is separate file; visual inspection during PR review |

---

## Timeline

- **Phase 1 (Planning)**: ✅ Complete (this document)
- **Phase 2 & 3 (Implementation + Test Harness)**: ~1.5–2 hours (parallel across 3 tasks)
- **Phase 4 (Validation)**: ~5 min
- **Phase 5 (CI Setup)**: Out of scope (specification only; future work)
- **Total**: ~2–2.5 hours (wall-clock, due to parallelism)

---

## Changelog

**2026-07-15** — SPRINT-0069 initiated with 3 independent health check endpoints (variant 276127630). Added comprehensive sprint plan with implementation, test-harness, and CI phases. Decomposed into 3 parallel TASK tickets with no inter-dependencies. Specified response contract, test cases, and CI pipeline template.
