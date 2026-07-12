# VRTX-0331: Implement healthz-smoke-43762983-c endpoint

**Task type:** Implementation  
**Sprint:** SPRINT-0062  
**Epic:** Health check endpoints (variant 43762983)  
**Effort:** 30 minutes  
**Phase:** Implementation — Endpoint C  
**Depends on:** None (parallel with VRTX-0329, VRTX-0330)

---

## Summary

Implement a lightweight, self-contained GET endpoint at `/api/healthz-smoke-43762983-c` that returns `{ ok: true, variant: "43762983" }` with HTTP 200 status. The endpoint has zero dependencies (no database, auth, or external calls) and is designed for deployment verification and monitoring. This is an independent implementation — no shared code with endpoint A or B.

**File ownership:**
- `src/app/api/healthz-smoke-43762983-c/route.ts` — The sole file for this endpoint

---

## Scope

**In scope:**
- Create route file at `src/app/api/healthz-smoke-43762983-c/route.ts`
- Implement async `GET()` function exporting from Next.js App Router
- Return `NextResponse.json({ ok: true, variant: "43762983" }, { status: 200 })`
- Add comprehensive JSDoc documentation
- Ensure TypeScript strict mode compliance
- Zero dependencies (no imports of helper functions, utilities, middleware, or code from endpoint A or B)

**Out of scope:**
- Shared code (no utilities, helpers, or middleware — self-contained implementation)
- Environment variables or configuration
- Database access or auth guards
- External API calls or infrastructure dependencies
- Imports from VRTX-0329 or VRTX-0330

---

## Interface Contracts

### Route: `GET /api/healthz-smoke-43762983-c`

**Request:**
```
GET /api/healthz-smoke-43762983-c HTTP/1.1
Host: {slug}.{domain}
```
No request body, no query parameters, no auth required.

**Response (HTTP 200 OK):**
```json
{
  "ok": true,
  "variant": "43762983"
}
```

**Response headers:**
- `Content-Type: application/json`
- `Content-Length: <byte-count>`

**Status codes:**
- `200 OK` — always; no error cases

---

## Implementation Details

### File: `src/app/api/healthz-smoke-43762983-c/route.ts`

**Structure:**
1. Import `NextResponse` from `'next/server'`
2. JSDoc block:
   - Route path: `GET /api/healthz-smoke-43762983-c`
   - Description: lightweight smoke test endpoint for load balancers and monitoring
   - Response contract and variant identifier
   - Use case: deployment verification, monitoring, A/B testing
   - Performance target: < 100ms (typical < 10ms)
   - Response codes: 200 only
   - Response body structure
3. Export async `GET()` function with return type `Promise<NextResponse>`
4. Function body: return `NextResponse.json({ ok: true, variant: "43762983" }, { status: 200 })`

**Important:** This is a separate, independent implementation. Do NOT import code from VRTX-0329 (endpoint A) or VRTX-0330 (endpoint B). Each endpoint must be self-contained.

### Type Safety
- Function signature: `async function GET(): Promise<NextResponse>`
- Response body types: `ok: boolean`, `variant: string`
- No use of `any` type

### Linting & Formatting
- Follow ESLint configuration (0 warnings)
- Prettier auto-format
- No trailing whitespace
- JSDoc block follows project conventions

---

## Definition of Done

- [ ] Route file `src/app/api/healthz-smoke-43762983-c/route.ts` created
- [ ] Exports async `GET()` function with correct type signature
- [ ] Returns `NextResponse.json({ ok: true, variant: "43762983" }, { status: 200 })`
- [ ] JSDoc block documents endpoint, response contract, variant, and use case
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] Endpoint is self-contained (no shared code, no imports from endpoint A or B)
- [ ] File is committed on ticket branch
- [ ] Ready for test harness (VRTX-0334)

---

## Testing Strategy (VRTX-0334)

The companion test task will verify:
- HTTP 200 status
- Correct JSON response `{ ok: true, variant: "43762983" }`
- Content-Type header is application/json
- No authentication required
- Response time < 100ms
- Consistency across calls
- Type safety (ok is boolean, variant is string)

---

## Related Tasks

**Parallel (no dependencies):**
- VRTX-0329 — Implement healthz-smoke-43762983-a endpoint
- VRTX-0330 — Implement healthz-smoke-43762983-b endpoint

**Sequential (test harness for this endpoint):**
- VRTX-0334 — Test harness for endpoint C

**CI/Build verification (after all endpoints + tests):**
- VRTX-0335 — CI/Build verification

**Documentation (after all code):**
- VRTX-0336 — Documentation update

---

## Checklist for Implementation

- [ ] Create file at exact path `src/app/api/healthz-smoke-43762983-c/route.ts`
- [ ] Copy pattern from recent variant endpoint (e.g., `/api/healthz-smoke-85511011/route.ts`)
- [ ] Update variant identifier to `"43762983"`
- [ ] Update JSDoc comments (path, variant, etc.)
- [ ] Import `NextResponse` from `'next/server'`
- [ ] Export async `GET()` function
- [ ] Return JSON with `{ ok: true, variant: "43762983" }` and status 200
- [ ] Verify NO imports from VRTX-0329 or VRTX-0330
- [ ] Run `npm run typecheck` and verify zero errors
- [ ] Run `npm run lint` and verify zero warnings
- [ ] Commit with clear message: "Add healthz-smoke-43762983-c endpoint for deployment verification"
- [ ] Push to ticket branch
