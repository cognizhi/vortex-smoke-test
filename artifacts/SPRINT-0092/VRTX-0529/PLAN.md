# TASK PLAN: VRTX-0529 — Implement /api/healthz-smoke-509572604-b endpoint

**Sprint:** SPRINT-0092  
**Epic:** VRTX-0525 — Three independent smoke test endpoints (509572604)  
**Feature:** VRTX-0526 — Implement three independent endpoints  
**Depends On:** None (parallel with VRTX-0528, VRTX-0530)  
**Blocks:** VRTX-0531 (E2E tests)

---

## 1. Overview

Implement the second independent GET endpoint for variant 509572604 deployment verification.

**Endpoint:** `GET /api/healthz-smoke-509572604-b`  
**Response:** `{ok: true, variant: "509572604"}` with HTTP 200  
**Dependencies:** None (no database, auth, external calls)  
**Response Time Target:** < 10ms

---

## 2. Implementation

### File Location
```
src/app/api/healthz-smoke-509572604-b/
  └── route.ts
```

### Implementation Code

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '509572604' },
    { status: 200 }
  )
}
```

### Key Details

- **Type Annotations:** Full TypeScript strict mode (no `any`)
- **Request Parameter:** Unused; prefixed with `_`
- **Return Type:** Explicit `Promise<NextResponse>`
- **Response:** `NextResponse.json()` with `{ status: 200 }`
- **Variant String:** Hardcoded `"509572604"`

---

## 3. Architecture Decisions

1. **No Shared Code** — This endpoint is completely independent from endpoints -a and -c. Duplication is intentional and acceptable because:
   - Enables parallel team workflows (zero merge conflicts)
   - Each endpoint can be developed, tested, and deployed independently
   - Minimal code surface (8 lines each)
   - Reduces cognitive overhead and cross-endpoint coupling

2. **Hardcoded Variant** — The variant string is hardcoded (not from env vars) because:
   - Deployment verification requires immediate visibility into the active build
   - No runtime configuration overhead
   - Simpler testing (no env setup required)

3. **Stateless Pure Function** — No side effects:
   - No database access
   - No logging beyond natural HTTP request/response logging
   - No auth checks
   - No external service calls

---

## 4. Testing Strategy

### Local Manual Verification

```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:3000/api/healthz-smoke-509572604-b

# Expected output:
# {"ok":true,"variant":"509572604"}
```

### Acceptance Criteria (Definition of Done)

- ✅ Route file created at `src/app/api/healthz-smoke-509572604-b/route.ts`
- ✅ Exports `async function GET(_request: NextRequest): Promise<NextResponse>`
- ✅ Returns `NextResponse.json({ ok: true, variant: '509572604' }, { status: 200 })`
- ✅ No shared code with endpoints -a or -c (no helpers, no utils)
- ✅ TypeScript strict mode compliance (npm run typecheck passes)
- ✅ ESLint passes (npm run lint passes, 0 warnings)
- ✅ Manual test: `curl http://localhost:3000/api/healthz-smoke-509572604-b` returns correct JSON
- ✅ Code review approval

---

## 5. Acceptance Criteria (Fixed Interface Contract)

**HTTP Interface:**
- **Method:** GET
- **Path:** `/api/healthz-smoke-509572604-b`
- **Status Code:** 200 OK
- **Content-Type:** `application/json`
- **Response Body:** `{"ok":true,"variant":"509572604"}`
- **Response Time:** < 100ms (target < 10ms)

**Code Interface:**
- **Export:** `export async function GET(request: NextRequest): Promise<NextResponse>`
- **Return:** `NextResponse.json(body, { status: 200 })`
- **No Side Effects:** Pure function, no I/O, no mutable state

---

## 6. CI/CD Integration

### Automated Checks
```bash
npm run lint           # ESLint — must pass with 0 warnings
npm run typecheck      # TypeScript — must pass strict mode
npm run build          # Next.js build — must include this endpoint
```

### E2E Testing
- Verified in VRTX-0531 (E2E tests TASK)
- Test: `GET /api/healthz-smoke-509572604-b returns 200 with ok and variant`

---

## 7. File Ownership

**This TASK owns:**
- `src/app/api/healthz-smoke-509572604-b/route.ts` (8 lines)

**This TASK does NOT own:**
- `src/app/api/healthz-smoke-509572604-a/route.ts` (separate TASK: VRTX-0528)
- `src/app/api/healthz-smoke-509572604-c/route.ts` (separate TASK: VRTX-0530)
- `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts` (separate TASK: VRTX-0531)

---

## 8. Definition of Done

This TASK is complete when:

1. ✅ Code is committed to ticket branch with clear commit message
2. ✅ Local manual test passes (endpoint returns correct JSON)
3. ✅ `npm run typecheck` passes (TypeScript strict mode)
4. ✅ `npm run lint` passes (ESLint, 0 warnings)
5. ✅ `npm run build` succeeds (Next.js build includes the endpoint)
6. ✅ Code review approved by peer
7. ✅ No merge conflicts with other endpoints (-a, -c)
8. ✅ PR merged to sprint branch

---

## 9. Git Workflow

1. **Branch:** `vortex/feat/VRTX-0529-implement-endpoint-b`
2. **Commit:** One clear commit with the route file
   ```
   feat(smoke): /api/healthz-smoke-509572604-b endpoint
   
   Implements independent GET endpoint returning {ok:true, variant:"509572604"}
   with HTTP 200. Part of SPRINT-0092 variant deployment verification.
   ```
3. **Push:** To feature branch, no force-push
4. **Merge:** Via squash-merge to sprint branch

---

## 10. References

- **Sprint Plan:** artifacts/SPRINT-0092/SPRINT-PLAN.md
- **Epic:** VRTX-0525
- **Related Tasks:** VRTX-0528 (endpoint -a), VRTX-0530 (endpoint -c)
- **Test Task:** VRTX-0531 (E2E tests)
- **Idea:** VST-0079
- **Previous Sprint Pattern:** SPRINT-0088 (53261999-a/b/c), SPRINT-0073 (121996100-a/b/c)

---

**Task Status:** 🟢 Ready for Assignment  
**Last Updated:** 2026-07-19  
**Document Version:** 1.0
