# VRTX-0450 Implementation Plan

## Defect Summary
Missing health check endpoint `/api/healthz-smoke-bugfix-ha2-454075717` returns 404 instead of 200.

## Root Cause Analysis
The endpoint directory and route handler do not exist in the codebase. The endpoint is expected to be a simple, self-contained health check similar to existing endpoints like `/api/healthz-smoke-bugfix-1021340604`.

## Solution Design

### File Structure
Create new file: `src/app/api/healthz-smoke-bugfix-ha2-454075717/route.ts`

### Implementation Details
- **Handler**: Export async GET function
- **Status Code**: 200
- **Response Body**: `{"ok":true,"variant":"454075717"}`
- **Response Format**: JSON
- **Dependencies**: None (no database, no auth, no external services)
- **Performance Target**: < 100ms typical response time

### Code Template
```typescript
import { NextResponse } from 'next/server';

/**
 * GET /api/healthz-smoke-bugfix-ha2-454075717
 *
 * Lightweight smoke test endpoint for load balancers and monitoring systems.
 * Fast, self-contained health check with no dependencies (no database, no auth, no external calls).
 * Designed for high-frequency polling by Kubernetes readiness probes, load balancers, and monitoring services.
 *
 * Public endpoint — no authentication required.
 * Target response time: < 100ms (typical < 10ms).
 *
 * Response codes:
 *   200 - Service is healthy and reachable
 *
 * Response body:
 *   { "ok": true, "variant": "454075717" }
 */

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '454075717',
    },
    { status: 200 }
  );
}
```

## Testing Plan

### Manual Testing
```bash
curl http://localhost:3000/api/healthz-smoke-bugfix-ha2-454075717
```

Expected output:
```json
{"ok":true,"variant":"454075717"}
```

### Verification Checklist
- [ ] Endpoint exists at the correct path
- [ ] GET request returns 200 status code
- [ ] Response body matches expected JSON structure
- [ ] Response contains correct variant identifier "454075717"
- [ ] No errors in server logs
- [ ] Response time < 100ms

## Files to Create
- `src/app/api/healthz-smoke-bugfix-ha2-454075717/route.ts`

## Definition of Done
1. File created at correct path
2. Implements async GET handler returning NextResponse
3. Returns 200 status with correct JSON body
4. Manual curl test passes
5. No TypeScript or linting errors
6. Committed with message referencing VRTX-0450
