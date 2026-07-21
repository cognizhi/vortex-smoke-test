# VRTX-0554 Implementation Plan

**Title:** [smoke-bugfix-178459795870584] /healthz-smoke-bugfix3-739668299 returns 404

**Ticket Type:** DEFECT (Bugfix)

**Priority:** P1

---

## Defect Summary

GET request to `/api/healthz-smoke-bugfix3-739668299` currently returns HTTP 404 Not Found.

**Expected:** HTTP 200 with JSON response body:
```json
{"ok":true,"variant":"739668299"}
```

**Actual:** HTTP 404 Not Found (endpoint does not exist)

---

## Root Cause Analysis

The endpoint is missing entirely. The directory `src/app/api/healthz-smoke-bugfix3-739668299/` and its handler file `route.ts` do not exist in the codebase.

This endpoint follows a well-established pattern used by other variant-specific health check endpoints (e.g., `healthz-smoke-bugfix-ha2-244944780`), but the implementation for this variant ID was not created.

---

## Reproduction Steps

```bash
# Expected: 200 OK
# Actual: 404 Not Found
curl -v http://localhost:3000/api/healthz-smoke-bugfix3-739668299

# Expected response (on 200):
# {"ok":true,"variant":"739668299"}
```

---

## Solution Design

### Implementation Steps

1. **Create the endpoint directory:**
   ```bash
   mkdir -p src/app/api/healthz-smoke-bugfix3-739668299
   ```

2. **Create the handler file:** `src/app/api/healthz-smoke-bugfix3-739668299/route.ts`
   - Pattern: Copy and adapt from `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts`
   - Change the variant ID in the response from "244944780" to "739668299"
   - Keep the same JSDoc documentation structure with the correct endpoint path
   - Export async function `GET()` that returns `NextResponse.json({ok:true, variant:"739668299"}, {status:200})`

3. **Handler implementation:**
   ```typescript
   import { NextResponse } from 'next/server';

   export async function GET(): Promise<NextResponse> {
     return NextResponse.json(
       {
         ok: true,
         variant: '739668299',
       },
       { status: 200 }
     );
   }
   ```

4. **Verification:**
   - Handler is located at correct path: `src/app/api/healthz-smoke-bugfix3-739668299/route.ts`
   - Variant ID in response matches the endpoint name: "739668299"
   - No dependencies (no database, no auth, no external calls)
   - Returns exactly and only: `{"ok":true,"variant":"739668299"}`

### File Structure

```
src/app/api/healthz-smoke-bugfix3-739668299/
└── route.ts
```

---

## Technical Constraints & Considerations

- **No Dependencies:** Endpoint must be self-contained with no database or auth
- **Response Time:** Must respond in < 100ms (typical < 10ms)
- **Response Format:** Must match exactly: `{"ok":true,"variant":"739668299"}`
- **HTTP Status:** Must be 200 (not 201, not any other success code)
- **Public Access:** No authentication required
- **Next.js Routing:** Uses App Router convention (file-based routing via directory structure)

---

## Definition of Done (Acceptance Criteria)

- [ ] Directory `src/app/api/healthz-smoke-bugfix3-739668299/` created
- [ ] File `src/app/api/healthz-smoke-bugfix3-739668299/route.ts` created with correct implementation
- [ ] GET request to `/api/healthz-smoke-bugfix3-739668299` returns HTTP 200
- [ ] Response body is exactly: `{"ok":true,"variant":"739668299"}`
- [ ] Response time is < 100ms
- [ ] Endpoint works without database access
- [ ] Endpoint works without authentication
- [ ] No linting errors (npm run lint passes)
- [ ] No type errors (npm run typecheck passes)
- [ ] No regressions to other healthz endpoints
- [ ] Code follows existing pattern from `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts`

---

## Testing Strategy

### Manual Testing
```bash
# Build and start the server
npm run build
npm run start

# Test the endpoint
curl http://localhost:3000/api/healthz-smoke-bugfix3-739668299
# Expected: {"ok":true,"variant":"739668299"}

curl -w "\nStatus: %{http_code}\n" http://localhost:3000/api/healthz-smoke-bugfix3-739668299
# Expected status: 200
```

### Automated Testing
- Add test case to regression test suite or e2e tests
- Test pattern: See `src/__tests__/regression/vrtx-0546-api-healthz-smoke-bugfix-261077566.test.ts`
- Verify endpoint name, response structure, and variant ID

---

## Dependencies

**None.** This fix is independent and does not depend on other tickets in this sprint.

**Related Tickets (in same sprint but independent):**
- VRTX-0552: Missing /healthz-smoke-bugfix-863883409 endpoint
- VRTX-0553: Missing /healthz-smoke-bugfix2-813098132 endpoint

These follow the same pattern but are independent implementations.

---

## Risk Assessment

**Risk Level:** Very Low

**Rationale:**
- Simple, self-contained endpoint (no dependencies, no side effects)
- Exact pattern already exists and is proven (`healthz-smoke-bugfix-ha2-244944780`)
- No changes to database, auth, or existing endpoints
- Endpoint is read-only and public (no security risk)
- Easy to verify and rollback if needed

---

## References

- **Existing Variant Endpoint Pattern:** `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts`
- **Base Health Check Pattern:** `src/app/api/healthz-smoke/route.ts`
- **Related Regression Test:** `src/__tests__/regression/vrtx-0546-api-healthz-smoke-bugfix-261077566.test.ts`
- **E2E Tests:** `e2e/healthz-smoke-endpoints-sprint-0094.spec.ts`
- **Sprint Plan:** See `artifacts/SPRINT-0095/SPRINT-PLAN.md`
