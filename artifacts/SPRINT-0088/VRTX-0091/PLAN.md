# Task Plan: VRTX-0091
## Implement /healthz-smoke-53261999-c Endpoint

**EPIC:** VRTX-0087 — Add 3 independent smoke test endpoints (53261999)  
**STORY:** VRTX-0088 — Core implementation  
**TASK:** VRTX-0091  
**Assigned to:** Engineer  
**Effort:** 1 day  
**Status:** Ready for implementation  

---

## 1. Scope

Implement a single GET endpoint `/api/healthz-smoke-53261999-c` that returns a JSON object indicating the service is healthy.

### What's In Scope
- Create the route handler: `src/app/api/healthz-smoke-53261999-c/route.ts`
- Implement GET request handler that returns `{ ok: true, variant: "53261999" }`
- Ensure TypeScript strict mode compliance
- Ensure linter passes with 0 warnings
- This endpoint is completely independent; no shared code with endpoints a and b

### What's Out of Scope
- Unit tests (covered by VRTX-0092: Test-harness)
- E2E tests (covered by VRTX-0092: Test-harness)
- CI/CD configuration (covered by VRTX-0093: CI integration, optional)
- Shared helper functions or utilities

---

## 2. Design & Interface Contract

### Endpoint Specification

**Request:**
```
GET /api/healthz-smoke-53261999-c
```

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "53261999"
}
```

**HTTP Status:** Always 200 (no error cases; no conditional logic)

**Headers:**
- No authentication required
- No special headers expected
- Response: `Content-Type: application/json`

**Latency Target:** < 10ms (pure response generation, no I/O)

**Dependencies:** None
- No database access
- No external API calls
- No auth checks
- No rate limiting
- No tenant routing

---

## 3. Implementation Details

### File Structure

```
src/app/api/healthz-smoke-53261999-c/
└── route.ts          ← Route handler (GET)
```

### Route Handler Code Structure

Use the Next.js App Router pattern (from `src/app/api/`) — specifically, follow the pattern from `/api/healthz-smoke` and `/api/health`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Return JSON response with 200 status
  return NextResponse.json(
    {
      ok: true,
      variant: '53261999',
    },
    { status: 200 }
  );
}
```

### Key Requirements

1. **TypeScript strict mode:** Full type annotations; no `any`
2. **No async/await logic:** Pure response generation
3. **Standard response structure:** Matches existing `/api/healthz-smoke` and `/api/health` endpoints
4. **No middleware:** This endpoint is not guarded by auth, rate limiting, or tenant routing
5. **Linter & typecheck:** Must pass `npm run lint` and `npm run typecheck` with 0 errors/warnings

### Imports & Dependencies

- `NextRequest`, `NextResponse` from `'next/server'` — **only these**; no external deps

---

## 4. File Ownership Map

| File | Owner | Responsibility |
|------|-------|-----------------|
| `src/app/api/healthz-smoke-53261999-c/route.ts` | This TASK | GET handler implementation |

No shared files with TASK-a or TASK-b; each endpoint is completely independent.

---

## 5. Testing Strategy

**Unit tests** are covered by VRTX-0092 (Test-harness TASK).  
**E2E tests** are covered by VRTX-0092 (Test-harness TASK).

Engineer should verify locally before committing:
```bash
npm run dev      # Start dev server
curl http://localhost:3000/api/healthz-smoke-53261999-c  # Manual test
```

Expected output:
```json
{"ok":true,"variant":"53261999"}
```

---

## 6. Acceptance Criteria

- [ ] File `src/app/api/healthz-smoke-53261999-c/route.ts` created
- [ ] GET handler returns `{ ok: true, variant: "53261999" }` with HTTP 200
- [ ] No auth, database, or external dependencies
- [ ] TypeScript strict mode: no errors, no `any` without justification
- [ ] Passes `npm run lint` with 0 warnings
- [ ] Passes `npm run typecheck` with 0 errors
- [ ] Passes `npm run build` (builds successfully)
- [ ] Manual verification: `curl http://localhost:3000/api/healthz-smoke-53261999-c` returns expected JSON
- [ ] Commit message is clear and follows conventions
- [ ] Branch pushed to remote with `-u origin`

---

## 7. Definition of Done

1. All acceptance criteria above are checked
2. Tests pass (unit + E2E, when TASK-3 is done)
3. No breaking changes to existing endpoints
4. Code committed and pushed to ticket branch
5. Ready for integration review

---

## 8. Notes for Engineer

- **Simplicity is a feature.** This endpoint is intentionally trivial; don't over-engineer it.
- **No shared code.** Do not extract a helper function for the response; each endpoint is independent.
- **Existing patterns:** Look at `src/app/api/healthz-smoke/route.ts` and `src/app/api/health/route.ts` for reference.
- **Independent work:** This TASK can be implemented in parallel with TASK-a and TASK-b.
- **Testing comes later:** Focus on the implementation; TASK-3 covers unit and E2E tests.

---

## 9. Related Tasks

- **TASK-0:** Implement endpoint a (independent, parallel)
- **TASK-1:** Implement endpoint b (independent, parallel)
- **TASK-2 (this):** Implement endpoint c
- **TASK-3:** Test-harness (depends on all three endpoints above)
- **TASK-4:** CI/CD integration (optional)

---

## Changelog

### 2026-07-19 — Initial plan

**Created:** TASK plan for /healthz-smoke-53261999-c endpoint implementation  
**Scope:** Route handler only; testing deferred to TASK-3  
**Effort:** 1 day (trivial implementation, no complex logic)
