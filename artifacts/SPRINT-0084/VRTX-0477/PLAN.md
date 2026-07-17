# VRTX-0477: Add `/api/healthz-smoke-bugfix-ha-609817388` Endpoint

## Issue
`GET /api/healthz-smoke-bugfix-ha-609817388` returns 404; should return 200 with variant identification.

## Root Cause
The route handler directory and implementation file do not exist for this specific variant endpoint.

## Fix Summary
Create a new Next.js API route handler that returns a lightweight health check response.

**File to Create**: `src/app/api/healthz-smoke-bugfix-ha-609817388/route.ts`

## Implementation Details

### Route Handler
```typescript
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '609817388',
    },
    { status: 200 }
  );
}
```

### Endpoint Behavior
- **Path**: `/api/healthz-smoke-bugfix-ha-609817388`
- **Method**: GET
- **Status Code**: 200
- **Response Body**: `{ "ok": true, "variant": "609817388" }`
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
- [ ] Directory created: `src/app/api/healthz-smoke-bugfix-ha-609817388/`
- [ ] File created: `src/app/api/healthz-smoke-bugfix-ha-609817388/route.ts`
- [ ] Handler exports async `GET()` function
- [ ] Response returns HTTP 200 with JSON body
- [ ] Variant ID in response is exactly `"609817388"`
- [ ] No dependencies (database, auth, external calls)

### Testing
- [ ] Endpoint responds with 200 status on `GET /api/healthz-smoke-bugfix-ha-609817388`
- [ ] Response body is valid JSON with `ok: true`
- [ ] Response includes `variant: "609817388"`
- [ ] Content-Type header is `application/json`
- [ ] Response completes within 1 second
- [ ] Test passes: `curl -s http://localhost:3000/api/healthz-smoke-bugfix-ha-609817388 | jq`

### Documentation
- [ ] Code includes JSDoc comments (reference existing endpoints)
- [ ] Documentation matches other variant endpoints in tone/structure

### Quality
- [ ] `bun run typecheck` passes (0 errors)
- [ ] `bun run lint` passes (0 warnings)
- [ ] File follows existing code style and patterns

## Related Tickets
- **Parent Sprint**: SPRINT-0084
- **Related**: VRTX-0478 (sibling defect for ha2 variant)
- **Dependencies**: None

## Test Case
```bash
# Manual test (requires app running on localhost:3000)
curl -s -i http://localhost:3000/api/healthz-smoke-bugfix-ha-609817388

# Expected output:
# HTTP/1.1 200 OK
# Content-Type: application/json
# { "ok": true, "variant": "609817388" }
```

## Notes
- This is a self-contained endpoint with zero dependencies
- No database, auth, or external calls needed
- Should be extremely fast (< 10ms typical)
- Designed for high-frequency health check probes
- Response variance is intentional for load balancer canary routing
