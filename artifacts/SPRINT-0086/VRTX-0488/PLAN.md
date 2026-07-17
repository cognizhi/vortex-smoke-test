# VRTX-0488: Add `/api/healthz-smoke-bugfix-ha-28079633` Endpoint

## Issue
`GET /api/healthz-smoke-bugfix-ha-28079633` returns 404; should return 200 with variant identification.

## Root Cause
The route handler directory and implementation file do not exist for this specific variant endpoint.

## Fix Summary
Create a new Next.js API route handler that returns a lightweight health check response.

**File to Create**: `src/app/api/healthz-smoke-bugfix-ha-28079633/route.ts`

## Implementation Details

### Route Handler
```typescript
import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-bugfix-ha-28079633
 *
 * Variant-specific smoke test endpoint for deployment verification.
 * Lightweight health check endpoint that allows monitoring systems and load balancers
 * to verify this specific application variant (28079633) is deployed and reachable.
 *
 * Public endpoint — no authentication required.
 * Self-contained with zero dependencies (no database, no external calls, no auth checks).
 * Designed for high-frequency polling by monitoring systems and load balancers.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and variant is active
 *
 * Response body:
 *   { "ok": true, "variant": "28079633" }
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '28079633',
    },
    { status: 200 }
  );
}
```

### Endpoint Behavior
- **Path**: `/api/healthz-smoke-bugfix-ha-28079633`
- **Method**: GET
- **Status Code**: 200
- **Response Body**: `{ "ok": true, "variant": "28079633" }`
- **Content-Type**: `application/json` (automatically set by NextResponse.json)
- **Auth Required**: No
- **Database Required**: No
- **External Calls**: None
- **Typical Response Time**: < 10ms

## Reference Pattern
This implementation follows the established pattern from existing variant endpoints:
- See: `src/app/api/healthz-smoke-bugfix-ha-30297400/route.ts`
- See: `src/app/api/healthz-smoke-bugfix-ha2-244944780/route.ts`

## Definition of Done

### Code
- [ ] Directory created: `src/app/api/healthz-smoke-bugfix-ha-28079633/`
- [ ] File created: `src/app/api/healthz-smoke-bugfix-ha-28079633/route.ts`
- [ ] Handler exports async `GET()` function
- [ ] Response returns HTTP 200 with JSON body
- [ ] Variant ID in response is exactly `"28079633"`
- [ ] No dependencies (database, auth, external calls)

### Testing
- [ ] Endpoint responds with 200 status on `GET /api/healthz-smoke-bugfix-ha-28079633`
- [ ] Response body is valid JSON with `ok: true`
- [ ] Response includes `variant: "28079633"`
- [ ] Content-Type header is `application/json`
- [ ] Response completes within 1 second
- [ ] Test passes: `curl -s http://localhost:3000/api/healthz-smoke-bugfix-ha-28079633 | jq`

### Documentation
- [ ] Code includes JSDoc comments (reference existing endpoints)
- [ ] Documentation matches other variant endpoints in tone/structure

### Quality
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] File follows existing code style and patterns

## Related Tickets
- **Parent Sprint**: SPRINT-0086
- **Related**: VRTX-0489 (sibling defect for ha2 variant)
- **Dependencies**: None

## Test Case
```bash
# Manual test (requires app running on localhost:3000)
curl -s -i http://localhost:3000/api/healthz-smoke-bugfix-ha-28079633

# Expected output:
# HTTP/1.1 200 OK
# Content-Type: application/json
# { "ok": true, "variant": "28079633" }
```

## Notes
- This is a self-contained endpoint with zero dependencies
- No database, auth, or external calls needed
- Should be extremely fast (< 10ms typical)
- Designed for high-frequency health check probes
- Response variant is intentional for load balancer canary routing
