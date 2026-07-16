# VRTX-0440 Fix Plan — Missing `/api/healthz-smoke-bugfix2-712753350` endpoint

**Ticket:** VRTX-0440  
**Sprint:** SPRINT-0075  
**Date:** 2026-07-16  
**Status:** Planning

---

## Problem Statement

The health check endpoint `/api/healthz-smoke-bugfix2-712753350` is missing from the application. This endpoint is required for deployment verification and monitoring systems to validate that this specific application variant is deployed and reachable.

**Current Behavior:**
- `GET /api/healthz-smoke-bugfix2-712753350` returns HTTP 404 Not Found

**Expected Behavior:**
- `GET /api/healthz-smoke-bugfix2-712753350` returns HTTP 200 OK
- Response body: `{"ok":true,"variant":"712753350"}`

---

## Root Cause Analysis

The route file `src/app/api/healthz-smoke-bugfix2-712753350/route.ts` does not exist in the codebase. Next.js API routing automatically generates 404 responses when a route file is not found.

---

## Fix Implementation

### File to Create:
`src/app/api/healthz-smoke-bugfix2-712753350/route.ts`

### Implementation Details:

1. **Create directory structure:** `src/app/api/healthz-smoke-bugfix2-712753350/`

2. **Create route.ts file** following the pattern of existing health check endpoints (e.g., `src/app/api/healthz-smoke-800427409/route.ts`):
   - Import `NextResponse` from 'next/server'
   - Implement async GET function with no parameters
   - Return `NextResponse.json({ ok: true, variant: '712753350' }, { status: 200 })`

3. **Include JSDoc documentation** explaining:
   - Purpose: variant-specific smoke test endpoint for deployment verification
   - Public endpoint — no authentication required
   - Self-contained with zero dependencies (no database, no external calls)
   - Target response time: < 100ms (typical < 10ms)
   - Response codes: 200 - Service is healthy and variant is active
   - Response body: `{ "ok": true, "variant": "712753350" }`

---

## Verification

The fix can be verified by:

1. **Local development:**
   ```bash
   npm run dev
   curl -s http://localhost:3000/api/healthz-smoke-bugfix2-712753350 | jq
   # Expected output: { "ok": true, "variant": "712753350" }
   ```

2. **Production build:**
   ```bash
   npm run build
   npm run start
   curl -s http://localhost:3000/api/healthz-smoke-bugfix2-712753350 | jq
   # Expected output: { "ok": true, "variant": "712753350" }
   ```

3. **Response headers validation:**
   - Content-Type: application/json
   - Status Code: 200 OK

---

## Dependencies

- **None.** This is a self-contained endpoint with no database, auth, or external dependencies.

---

## References

- Existing pattern: `src/app/api/healthz-smoke-800427409/route.ts`
- Next.js App Router: https://nextjs.org/docs/app/routing
- Next.js Response API: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## Definition of Done

- [ ] Directory `src/app/api/healthz-smoke-bugfix2-712753350/` created
- [ ] File `src/app/api/healthz-smoke-bugfix2-712753350/route.ts` created with proper JSDoc comments
- [ ] GET endpoint returns status 200 for requests to `/api/healthz-smoke-bugfix2-712753350`
- [ ] Response body is exactly `{"ok":true,"variant":"712753350"}`
- [ ] No authentication or authorization checks required
- [ ] No database queries or external API calls
- [ ] Verified locally with `npm run dev` and curl request
- [ ] Verified in production build with `npm run build && npm run start`
- [ ] Code follows existing patterns and style conventions
- [ ] All linting and type checks pass (`npm run lint` and `npm run typecheck`)
