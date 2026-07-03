# Plan: Create /healthz-smoke-859005244 Route Handler

**Ticket:** VRTX-0015  
**Type:** TASK  
**Title:** Create /healthz-smoke-859005244 route handler  
**Sprint:** SPRINT-0003 (2026-07-03)

---

## Objective

Implement a variant-specific health check endpoint at `/api/healthz-smoke-859005244` for monitoring systems and canary deployments. This endpoint returns a simple JSON response with a hardcoded variant ID.

---

## Requirements (from PRODUCT.md)

### Endpoint Specification

- **Path:** `GET /api/healthz-smoke-859005244`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "859005244"
  }
  ```
- **Response Time:** < 100ms (typical < 10ms)

### Characteristics

- Self-contained (no database, auth, or external calls)
- Simple direct JSON response (not wrapped in standard envelope like `/api/healthz-smoke`)
- No dependencies; works in any environment
- Variant ID is hardcoded in the response for identification
- Suitable for monitoring specific deployment versions independently

---

## Implementation Plan

### Step 1: Create Route File Structure
- Create directory: `src/app/api/healthz-smoke-859005244/`
- Create file: `src/app/api/healthz-smoke-859005244/route.ts`

### Step 2: Implement GET Handler
- Export async function `GET()`
- Return `NextResponse.json()` with exact response format
- Include comprehensive JSDoc documentation
- Set HTTP status to 200

### Step 3: Follow Existing Pattern
- Model after `/api/healthz-smoke/route.ts` but with variant-specific response format
- Use same imports: `NextResponse` from `'next/server'`
- Use same export pattern: `export async function GET(): Promise<NextResponse>`

### Step 4: Testing Strategy (TDD)
- Red phase: Write test that:
  - Makes GET request to `/api/healthz-smoke-859005244`
  - Expects status 200
  - Expects response body: `{ ok: true, variant: "859005244" }`
  - Verifies response is consistent across multiple requests
- Green phase: Implement handler to make tests pass
- Verify all existing tests still pass

### Step 5: Quality Checks
- `npm run typecheck` — strict TypeScript compliance
- `npm run lint` — zero ESLint warnings
- All tests passing
- Manual verification with curl or API test tool

### Step 6: Documentation & Artifacts
- JSDoc comments in the route handler
- Commit all artifacts (plan, spec, tests, results, summary)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/healthz-smoke-859005244/route.ts` | Main implementation |
| `artifacts/.../spec.md` | Feature specification |
| `artifacts/.../tdd-test-cases.md` | Test design matrix |
| `artifacts/.../tdd-test-result.md` | Test execution results |
| `artifacts/.../summary.md` | Implementation summary |

---

## Acceptance Criteria

- ✅ File created at `src/app/api/healthz-smoke-859005244/route.ts`
- ✅ GET handler returns exact JSON: `{ok: true, variant: "859005244"}`
- ✅ HTTP status code is 200
- ✅ Response includes JSDoc comments documenting the endpoint
- ✅ No authentication or database access
- ✅ `npm run typecheck` passes (strict TypeScript)
- ✅ No ESLint warnings (`npm run lint`)
- ✅ Endpoint is accessible at GET /api/healthz-smoke-859005244
- ✅ Response is consistent across multiple requests
- ✅ Request/response verified manually (e.g., curl or API test tool)
- ✅ All artifacts committed on branch

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Response format mismatch (variant vs standard) | Verified against PRODUCT.md spec; different format by design |
| TypeScript strict mode compliance | Follow existing pattern in codebase; use NextResponse types |
| Endpoint routing conflicts | Next.js App Router handles route precedence; no conflicts expected |

---

## Timeline

- **Spec writing:** 5 min
- **Test cases:** 10 min
- **Implementation:** 5 min
- **Testing & verification:** 10 min
- **Code review:** 10 min
- **Total:** ~40 min
