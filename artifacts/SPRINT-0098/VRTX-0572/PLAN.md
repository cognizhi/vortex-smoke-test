# TASK PLAN: VRTX-0572 — Implement /api/healthz-smoke-107173471-b

**Sprint:** SPRINT-0098  
**Story:** VRTX-0570 — Implement three endpoint variants (107173471)  
**Idea:** VST-0085

---

## 1. Overview

Implement a single lightweight health check endpoint at `/api/healthz-smoke-107173471-b` that returns an HTTP 200 response with a simple JSON body. This endpoint is completely self-contained with no dependencies, no database queries, no authentication, and no external calls. It follows the established pattern of similar endpoints already in the codebase.

**Endpoint:** `/api/healthz-smoke-107173471-b`  
**HTTP Method:** GET  
**Response:** `{"ok": true, "variant": "107173471"}`  
**Status Code:** 200  
**Content-Type:** `application/json`  

---

## 2. Implementation

### File Location
```
src/app/api/healthz-smoke-107173471-b/
  └── route.ts (~10 lines)
```

### Route Handler Template

```typescript
import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '107173471',
    },
    { status: 200 }
  )
}
```

### Implementation Steps

1. Create directory: `src/app/api/healthz-smoke-107173471-b/`
2. Create file: `route.ts`
3. Import `NextResponse` from `'next/server'`
4. Export async `GET()` function
5. Return JSON object with `ok: true` and `variant: '107173471'`
6. Explicit HTTP 200 status code

### Type Safety

The function signature must return `Promise<NextResponse>`:
```typescript
export async function GET(): Promise<NextResponse>
```

This satisfies TypeScript strict mode and Next.js App Router conventions.

---

## 3. No Dependencies

This task has **no blocking dependencies** on other tasks:
- ✅ No shared code or helpers
- ✅ No database access
- ✅ No authentication checks
- ✅ No external API calls
- ✅ No configuration needed
- ✅ Works independently of VRTX-0571 and VRTX-0573

Can be worked on and tested immediately.

---

## 4. Testing Strategy

### Local Verification (Manual)

1. Start dev server: `npm run dev`
2. Call endpoint: `curl http://localhost:3000/api/healthz-smoke-107173471-b`
3. Verify response:
   ```json
   {"ok":true,"variant":"107173471"}
   ```
4. Verify status: `HTTP 200`

### Automated Tests (Unit + E2E)

Unit and E2E tests are in separate tasks (VRTX-0577, VRTX-0578) but verify this endpoint's correctness.

---

## 5. Acceptance Criteria (Definition of Done)

### Code
- ✅ File created: `src/app/api/healthz-smoke-107173471-b/route.ts`
- ✅ Imports `NextResponse` from `'next/server'`
- ✅ Exports async function `GET(): Promise<NextResponse>`
- ✅ Returns `NextResponse.json()` with status 200
- ✅ Response body: `{"ok": true, "variant": "107173471"}`
- ✅ No extra fields in JSON response
- ✅ TypeScript strict mode: 0 type errors
- ✅ ESLint: 0 warnings on this file

### Verification
- ✅ Endpoint accessible at `GET /api/healthz-smoke-107173471-b`
- ✅ HTTP 200 status code returned
- ✅ Content-Type header is `application/json`
- ✅ JSON response parses correctly
- ✅ Response structure matches spec exactly

### Testing (Unit + E2E, see VRTX-0577 & VRTX-0578)
- ✅ Unit test verifies endpoint response
- ✅ E2E test verifies HTTP 200 and JSON body
- ✅ All existing tests still pass
- ✅ No regression in other endpoints

### Integration
- ✅ Committed to feature branch with clear commit message
- ✅ No conflicts with other parallel tasks (VRTX-0571, VRTX-0573)
- ✅ `npm run build` succeeds with this endpoint in place
- ✅ `npm run typecheck` passes
- ✅ `npm run lint` passes

---

## 6. Fixed Interface Contract

**HTTP Interface:**

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Path** | /api/healthz-smoke-107173471-b |
| **Status Code** | 200 |
| **Content-Type** | application/json |
| **Body** | `{"ok": true, "variant": "107173471"}` |
| **Latency** | < 100ms (no I/O) |

**Response Structure:**
```json
{
  "ok": true,
  "variant": "107173471"
}
```

**Constraints:**
- Response must have exactly 2 fields: `ok` and `variant`
- `ok` must be a boolean `true`
- `variant` must be the string `"107173471"` (not a number)
- No additional fields permitted

---

## 7. File Ownership

**This TASK owns:**
- `src/app/api/healthz-smoke-107173471-b/route.ts` (10 lines)

**This TASK does NOT own:**
- `src/app/api/healthz-smoke-107173471-a/` (separate task: VRTX-0571)
- `src/app/api/healthz-smoke-107173471-c/` (separate task: VRTX-0573)
- Test files (separate tasks: VRTX-0577, VRTX-0578)

---

## 8. Git Workflow

1. **Branch:** `vortex/feat/VRTX-0572-endpoint-b-107173471` (created from sprint branch)
2. **Commit:** One clear commit with the route handler
   ```
   feat(api): /api/healthz-smoke-107173471-b health check endpoint

   Adds a simple GET endpoint for smoke testing and health monitoring.
   Returns HTTP 200 with {"ok": true, "variant": "107173471"}.
   Part of SPRINT-0098 smoke test endpoints.
   ```
3. **Push:** To feature branch, no force-push
4. **Merge:** Via squash-merge to sprint branch (automated)

---

## 9. Dependencies

**Blocking:** None  
**Assumed:** 
- Next.js 15 app router working
- `src/app/api/` directory exists
- TypeScript build working
- `NextResponse` available from `next/server`

---

## 10. References

- **Sprint Plan:** artifacts/SPRINT-0098/SPRINT-PLAN.md
- **Story:** VRTX-0570
- **Related Tasks:** VRTX-0571 (endpoint -a), VRTX-0573 (endpoint -c)
- **Test Tasks:** VRTX-0577 (unit tests), VRTX-0578 (E2E tests)
- **Idea:** VST-0085
- **Previous Pattern:** `src/app/api/healthz-smoke-276127630-b/route.ts`

---

## 11. Definition of Done

This TASK is complete when:

1. ✅ Code committed to feature branch
2. ✅ Endpoint responds to GET requests at the correct path
3. ✅ HTTP 200 status returned
4. ✅ JSON response matches spec exactly
5. ✅ TypeScript strict mode passes
6. ✅ ESLint passes with 0 warnings
7. ✅ `npm run build` succeeds
8. ✅ `npm run typecheck` passes
9. ✅ Unit test (VRTX-0577) passes for this endpoint
10. ✅ E2E test (VRTX-0578) passes for this endpoint
11. ✅ No merge conflicts with parallel tasks
12. ✅ All existing tests still pass

---

**Task Status:** 🟢 Ready for Assignment  
**Effort Estimate:** 30 minutes  
**Last Updated:** 2026-07-21  
**Document Version:** 1.0
