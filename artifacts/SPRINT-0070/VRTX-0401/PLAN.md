# VRTX-0401: Implement /healthz-smoke-1012136249-b endpoint

**Phase:** 2 — Endpoint B Implementation

**Owner:** Engineer

**Effort:** 2 hours

---

## Objective

Create a completely self-contained health check endpoint at `/api/healthz-smoke-1012136249-b` that returns variant-specific health status with zero dependencies (no database, auth, or external calls).

---

## Scope

### Files to Create
- `src/app/api/healthz-smoke-1012136249-b/route.ts` — GET handler
- `src/app/api/healthz-smoke-1012136249-b/__tests__/route.test.ts` — Test suite (15 tests)

### No Shared Code
- This implementation is completely independent; no shared utilities or helpers with endpoints A or C
- Pattern taken directly from SPRINT-0069 endpoint `/api/healthz-smoke-276127630-b`

---

## Interface Contract

### GET /api/healthz-smoke-1012136249-b

**Request:**
```
GET /api/healthz-smoke-1012136249-b
Content-Type: application/json (implicit)
```

**Response (200 OK):**
```json
{
  "ok": true,
  "variant": "1012136249"
}
```

**Response Status:** 200
**Response Time Target:** < 100ms (typical < 10ms)

---

## Implementation Details

### Handler Template (from SPRINT-0069 variant b)

```typescript
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '1012136249',
    },
    { status: 200 }
  );
}
```

### Test Strategy

Write 15 tests covering:
1. Handler exports `GET` function
2. GET returns status 200
3. Response body contains `ok: true`
4. Response body contains `variant: "1012136249"`
5. Response is JSON
6. Response has correct Content-Type header
7. No request body is required
8. GET method only (test other methods return 405 or similar)
9. Response time is acceptable (< 100ms)
10. Responses are deterministic (multiple calls return same result)
11. Zero database calls
12. Zero auth checks
13. Zero external HTTP calls
14. Invalid HTTP methods rejected
15. Response structure matches exact spec

### No Dependencies
- ✅ No database connection
- ✅ No authentication
- ✅ No external API calls
- ✅ No file I/O
- ✅ No environment variables
- ✅ Pure function

---

## Definition of Done

1. **Code written** — both files created and committed
2. **Tests passing** — all 15 tests pass (`npm run test`)
3. **Lint clean** — `npm run lint` shows 0 warnings
4. **TypeScript strict** — `npm run typecheck` shows no errors
5. **Build succeeds** — `npm run build` completes
6. **Manual verification** — `curl http://localhost:3000/api/healthz-smoke-1012136249-b` returns correct JSON
7. **No regressions** — existing endpoints still work
8. **Committed** — changes on ticket branch, ready to push

---

## Test File Structure

```typescript
// src/app/api/healthz-smoke-1012136249-b/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/healthz-smoke-1012136249-b', () => {
  it('exports GET function', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns 200 status', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  // ... 13 more tests covering all aspects
});
```

---

## Acceptance Criteria

✅ Handler function created and exports `GET`
✅ GET returns NextResponse with status 200
✅ Response body: `{ ok: true, variant: "1012136249" }`
✅ All 15 tests pass
✅ 0 lint warnings
✅ TypeScript strict mode clean
✅ Build succeeds
✅ Manual curl test works

---

## Notes

- This endpoint is **completely independent** — no shared helpers with endpoints A or C
- Copy-paste implementation from SPRINT-0069-b if desired for consistency
- All dependencies are zero; this makes it trivial to test and deploy
- Response time is deterministic and instant (no I/O)
