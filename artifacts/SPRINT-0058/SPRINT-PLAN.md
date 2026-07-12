# SPRINT-0058 Health Check Endpoints Plan

**Sprint Goal:** Add three independent smoke test health check endpoints to enhance monitoring and load balancer testing capabilities.

**Sprint Type:** Enhancement (Bootstrap)

**Date:** 2026-07-12

---

## Overview

SPRINT-0058 implements three completely independent GET HTTP endpoints for smoke testing and load balancer health checks. Each endpoint is a self-contained unit with no shared code, no authentication, and no database dependencies, enabling high-frequency polling for infrastructure monitoring.

**Endpoints to implement:**
- `GET /api/healthz-smoke-971125744-a` → `{ ok: true, variant: "971125744" }`
- `GET /api/healthz-smoke-971125744-b` → `{ ok: true, variant: "971125744" }`
- `GET /api/healthz-smoke-971125744-c` → `{ ok: true, variant: "971125744" }`

**Key characteristics:**
- Public, unauthenticated endpoints
- No database queries
- No external API calls
- Target response time: < 100ms (typical < 10ms)
- HTTP 200 status with JSON body
- Consistent response across repeated calls
- Designed for Kubernetes readiness probes, load balancers, and monitoring systems

---

## Specification

### Endpoint A: `/api/healthz-smoke-971125744-a`

**Method:** GET

**Authentication:** None (public endpoint)

**Request:**
```
GET /api/healthz-smoke-971125744-a HTTP/1.1
Host: <platform-domain>
```

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "971125744"
}
```

**Response Headers:**
- `Content-Type: application/json`
- Standard security headers (via middleware)

**Behavior:**
- Always returns 200 status
- Response is deterministic (same output every time)
- No side effects (stateless, read-only)
- Fast execution (< 100ms)

### Endpoint B: `/api/healthz-smoke-971125744-b`

**Method:** GET

**Authentication:** None (public endpoint)

**Request:**
```
GET /api/healthz-smoke-971125744-b HTTP/1.1
Host: <platform-domain>
```

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "971125744"
}
```

**Response Headers:**
- `Content-Type: application/json`
- Standard security headers (via middleware)

**Behavior:**
- Always returns 200 status
- Response is deterministic (same output every time)
- No side effects (stateless, read-only)
- Fast execution (< 100ms)

### Endpoint C: `/api/healthz-smoke-971125744-c`

**Method:** GET

**Authentication:** None (public endpoint)

**Request:**
```
GET /api/healthz-smoke-971125744-c HTTP/1.1
Host: <platform-domain>
```

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "971125744"
}
```

**Response Headers:**
- `Content-Type: application/json`
- Standard security headers (via middleware)

**Behavior:**
- Always returns 200 status
- Response is deterministic (same output every time)
- No side effects (stateless, read-only)
- Fast execution (< 100ms)

---

## Implementation Details

### File Structure

```
src/app/api/
├── healthz-smoke-971125744-a/
│   ├── route.ts                    # TASK-A: Endpoint implementation
│   └── __tests__/
│       └── route.test.ts           # Included in TASK-A
├── healthz-smoke-971125744-b/
│   ├── route.ts                    # TASK-B: Endpoint implementation
│   └── __tests__/
│       └── route.test.ts           # Included in TASK-B
└── healthz-smoke-971125744-c/
    ├── route.ts                    # TASK-C: Endpoint implementation
    └── __tests__/
        └── route.test.ts           # Included in TASK-C
```

### Implementation Pattern

Each endpoint follows the existing pattern from `src/app/api/healthz-smoke-572185676/route.ts`:

```typescript
// GET /api/healthz-smoke-971125744-{a,b,c}
import { NextResponse } from 'next/server';

/**
 * GET handler for /api/healthz-smoke-971125744-{variant}
 * 
 * Returns a deterministic health check response.
 * No dependencies; always returns 200 with ok: true.
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

### Key Design Decisions

1. **Independent Implementation** — Each endpoint has its own route file. No shared helper code. Each file is approximately 40 lines (documentation + implementation).

2. **No Shared Logic** — Even though the implementations are similar, NOT creating a shared utility. Reasons:
   - Each endpoint is independent and can be deployed/scaled separately
   - Simplifies testing (each test is completely isolated)
   - Enables teams to work in parallel with zero coordination
   - Easier to modify individual endpoints later without side effects
   - Reduces coupling and dependency risk

3. **Variant Identifier** — The `variant: "971125744"` field enables:
   - A/B testing of health check logic
   - Gradual rollouts of monitoring changes
   - Distinguishing between deployment variants
   - Load balancer routing decisions based on variant

4. **No Configuration** — Hard-coded values (variant, status, JSON structure) make these endpoints extremely simple and predictable. No env vars, no database lookups, no conditionals.

---

## Test Strategy

### Unit Tests (per-endpoint)

Each endpoint includes comprehensive unit tests covering:

**Coverage areas (AC = Acceptance Criterion):**
- AC-01: HTTP 200 status code
- AC-02: Correct JSON structure: `{ ok: true, variant: "971125744" }`
- AC-03: Content-Type header is `application/json`
- AC-04: No authentication required
- AC-05: Multiple calls return consistent responses
- AC-06: Response is a NextResponse instance
- AC-07: Response time < 100ms

**Test file location:** `src/app/api/healthz-smoke-971125744-{a,b,c}/__tests__/route.test.ts`

**Test pattern** (from existing endpoint):
```typescript
import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';

describe('GET /api/healthz-smoke-971125744-{variant}', () => {
  it('RH-01: returns HTTP 200 status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('RH-02: returns correct JSON structure', async () => {
    const res = await GET();
    const json = (await res.json()) as { ok: boolean; variant: string };
    expect(json.ok).toBe(true);
    expect(json.variant).toBe('971125744');
  });

  it('RH-03: Content-Type header is application/json', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('RH-04: endpoint requires no authentication', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  it('RH-05: multiple sequential calls return consistent responses', async () => {
    const res1 = await GET();
    const res2 = await GET();
    const res3 = await GET();
    
    const json1 = (await res1.json()) as { ok: boolean; variant: string };
    const json2 = (await res2.json()) as { ok: boolean; variant: string };
    const json3 = (await res3.json()) as { ok: boolean; variant: string };

    expect(json1).toEqual({ ok: true, variant: '971125744' });
    expect(json2).toEqual({ ok: true, variant: '971125744' });
    expect(json3).toEqual({ ok: true, variant: '971125744' });
  });

  it('RH-06: response is a NextResponse instance', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
  });

  it('RH-07: response time is less than 100ms', async () => {
    const startTime = performance.now();
    await GET();
    const endTime = performance.now();
    const elapsedMs = endTime - startTime;
    expect(elapsedMs).toBeLessThan(100);
  });
});
```

### Integration Tests (optional)

A single integration test file that verifies all three endpoints are reachable via HTTP:
- Endpoint A returns correct response
- Endpoint B returns correct response
- Endpoint C returns correct response
- Each endpoint is independent (no cross-contamination)

**Test file location:** `src/app/api/__tests__/healthz-smoke-971125744.integration.test.ts` (optional; depends on available tools)

---

## CI/CD Phases

### Phase 1: Unit Testing (Vitest)
**Command:** `npm run test`
- Runs all test files matching `**/*.test.ts`
- Tests for endpoints A, B, C execute in parallel
- Coverage reporting (optional): `npm run test:coverage`

**Success criteria:**
- All endpoint tests pass (21 test cases total: 7 per endpoint)
- No console errors or warnings
- Coverage ≥ 95% (all code paths hit)

### Phase 2: Type Checking (TypeScript)
**Command:** `npm run typecheck`
- `tsc --noEmit` over all TypeScript files
- Ensures no type errors in endpoint implementations
- Strict mode enabled (`tsconfig.json`)

**Success criteria:**
- Zero type errors
- All generated types are correct

### Phase 3: Linting (ESLint)
**Command:** `npm run lint`
- ESLint with 0 warnings tolerance (`--max-warnings 0`)
- Checks code style, best practices, unused variables

**Success criteria:**
- Zero linting errors
- Zero linting warnings

### Phase 4: Build Verification (Next.js)
**Command:** `npm run build`
- Full Next.js production build
- Tree-shaking, minification, optimization
- Generates .next directory

**Success criteria:**
- Build succeeds with no errors
- All routes are included in the build output
- No build warnings

### Phase 5: Production Verification (Optional)
**Command:** `npm run start` (locally)
- Starts the production server
- Manual smoke test hitting the endpoints
- Verifies endpoints are routable and return correct responses

**Success criteria:**
- Server starts without errors
- `curl http://localhost:3000/api/healthz-smoke-971125744-{a,b,c}` returns 200 and correct JSON

---

## Test Harness Setup

### Vitest Configuration (`vitest.config.ts`)

The project already has Vitest configured. No changes needed for these endpoints, as they:
- Use the jsdom environment (default)
- Have no dependencies on server-only features beyond `NextResponse`
- Are importable from test files

**Existing configuration is sufficient:**
```typescript
// vitest.config.ts (no changes required)
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

### Running Tests

```bash
# Run all tests (including these three endpoints)
npm run test

# Run with coverage
npm run test:coverage

# Run a single endpoint's tests
npx vitest run src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts

# Watch mode (during development)
npx vitest src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts
```

---

## Phases of Work

### Phase 1: Endpoint A Implementation (VRTX-0309)
**Deliverable:** Implement `/api/healthz-smoke-971125744-a/route.ts` with unit tests

**Acceptance Criteria:**
- File `src/app/api/healthz-smoke-971125744-a/route.ts` exists and exports `GET` function
- File `src/app/api/healthz-smoke-971125744-a/__tests__/route.test.ts` exists with 7 passing tests
- TypeScript strict mode: zero type errors
- ESLint: zero warnings
- All tests pass with `npm run test`

**Module ownership:** `src/app/api/healthz-smoke-971125744-a/`

### Phase 2: Endpoint B Implementation (VRTX-0310)
**Deliverable:** Implement `/api/healthz-smoke-971125744-b/route.ts` with unit tests

**Acceptance Criteria:**
- File `src/app/api/healthz-smoke-971125744-b/route.ts` exists and exports `GET` function
- File `src/app/api/healthz-smoke-971125744-b/__tests__/route.test.ts` exists with 7 passing tests
- TypeScript strict mode: zero type errors
- ESLint: zero warnings
- All tests pass with `npm run test`

**Module ownership:** `src/app/api/healthz-smoke-971125744-b/`

### Phase 3: Endpoint C Implementation (VRTX-0311)
**Deliverable:** Implement `/api/healthz-smoke-971125744-c/route.ts` with unit tests

**Acceptance Criteria:**
- File `src/app/api/healthz-smoke-971125744-c/route.ts` exists and exports `GET` function
- File `src/app/api/healthz-smoke-971125744-c/__tests__/route.test.ts` exists with 7 passing tests
- TypeScript strict mode: zero type errors
- ESLint: zero warnings
- All tests pass with `npm run test`

**Module ownership:** `src/app/api/healthz-smoke-971125744-c/`

### Phase 4: Verification & Documentation (VRTX-0312)
**Deliverable:** Verify all three endpoints work, update docs, run full CI pipeline

**Acceptance Criteria:**
- All three endpoints are routable and reachable via HTTP GET
- Each endpoint returns 200 status with correct JSON body
- Full test suite passes: `npm run test` (21+ tests)
- Type checking passes: `npm run typecheck` (zero errors)
- Linting passes: `npm run lint` (zero warnings)
- Production build succeeds: `npm run build`
- Root docs are updated (PRODUCT.md, ARCHITECTURE.md if needed)

**Module ownership:** `src/app/api/healthz-smoke-971125744-{a,b,c}/` (all three)

---

## Documentation Updates

### Root Documents

**PRODUCT.md:**
- Add "Health Check Endpoints" subsection under "4. How it works" or a new section
- Document the availability of smoke test endpoints for monitoring

**ARCHITECTURE.md:**
- Update "4. Directory layout" section to mention the healthz-smoke endpoints directory structure
- Add a new section "Health Check & Monitoring" if needed

**DESIGN.md:**
- No changes (health check endpoints have no visual component)

**AGENT.md:**
- No changes (no new patterns or conventions introduced)

### Changelog

Add dated entry to ARCHITECTURE.md Changelog:
```markdown
## Changelog

### 2026-07-12 (SPRINT-0058)
- Added three independent smoke test health check endpoints for infrastructure monitoring:
  - `/api/healthz-smoke-971125744-a`
  - `/api/healthz-smoke-971125744-b`
  - `/api/healthz-smoke-971125744-c`
- Each endpoint returns `{ ok: true, variant: "971125744" }` with no dependencies, auth, or database access
- Enables load balancer health checks and Kubernetes readiness probes
- Full unit test coverage (7 tests per endpoint)
```

---

## Execution Dependencies

**Dependency Graph:**
```
VRTX-0309 (Endpoint A)    ─┐
                           ├─→ VRTX-0312 (Verification)
VRTX-0310 (Endpoint B)    ─┤
                           │
VRTX-0311 (Endpoint C)    ─┘
```

- Phases 1–3 (Endpoints A, B, C) can be executed in **parallel** (no dependencies)
- Phase 4 (Verification) depends on Phases 1–3 completing

---

## Success Criteria (Sprint-level)

- ✅ All three endpoints are implemented and passing unit tests
- ✅ All tests pass: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`
- ✅ Each endpoint returns correct response: HTTP 200 with `{ ok: true, variant: "971125744" }`
- ✅ No shared code between endpoints (each is independent)
- ✅ Root docs updated with dated Changelog entry
- ✅ Per-ticket PLAN.md files created for all four tickets
- ✅ All work committed on the ticket branch
- ✅ Sprint plan checklist passes (no blockers)

---

## Known Constraints

1. **No shared utilities** — Each endpoint must be completely independent. No `lib/` functions, no helpers, no shared logic.
2. **Existing pattern** — Must follow the structure of existing healthz-smoke endpoints (e.g., `healthz-smoke-572185676/route.ts`)
3. **Response immutability** — The response body `{ ok: true, variant: "971125744" }` is fixed. No dynamic computation.
4. **HTTP 200 always** — No error cases. If the endpoint is reachable, it returns 200.

---

## Testing Checklist

### Manual Testing (before CI)

```bash
# Install dependencies
npm ci

# Run all tests
npm run test

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start

# In another terminal, test endpoints
curl http://localhost:3000/api/healthz-smoke-971125744-a
curl http://localhost:3000/api/healthz-smoke-971125744-b
curl http://localhost:3000/api/healthz-smoke-971125744-c

# Expected response (all three):
# {"ok":true,"variant":"971125744"}
```

### Automated CI Pipeline

- Unit tests pass
- Type checking passes
- Linting passes
- Production build succeeds

---

## Summary

SPRINT-0058 adds three independent, self-contained health check endpoints for infrastructure monitoring. Each endpoint is a simple, fast, stateless response with no dependencies. The implementation is straightforward, tests are comprehensive, and deployment is low-risk because each endpoint is independent and can be rolled out separately.
