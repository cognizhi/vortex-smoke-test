# Specification: Implement /healthz-smoke-423911289 Variant Health Check Endpoint

**Ticket:** VRTX-0030  
**Date:** 2026-07-03  
**Sprint:** da3e2c30-133a-4c89-a900-f805fcdd699a  
**ID:** a7848b25-b4c0-4c0b-b807-c14ac1cbc2ee

---

## 1. Overview

Implement a variant health check endpoint at `GET /api/healthz-smoke-423911289` that returns a deterministic, self-contained health status with no dependencies (no database, no auth, no external calls). The endpoint is designed for load balancers and monitoring systems that need fast, lightweight health checks for the variant build identified by `423911289`.

---

## 2. Requirements

### 2.1 Endpoint Definition
- **Path:** `/api/healthz-smoke-423911289`
- **Method:** GET
- **HTTP Status:** 200
- **Response Format:** JSON
- **Auth Required:** No
- **Dependencies:** None (self-contained)

### 2.2 Response Body
The endpoint must return a JSON response with the following structure:

```json
{
  "ok": true,
  "variant": "423911289"
}
```

**Fields:**
- `ok` (boolean, required): Always `true`. Indicates the service is running.
- `variant` (string, required): The literal value `"423911289"`. Identifies this specific variant build.

**Constraints:**
- No extra fields in the response
- Both fields must always be present
- `ok` must be a boolean `true` (not a truthy string or number)
- `variant` must be a string with the exact value `"423911289"`
- Content-Type header must be `application/json`

### 2.3 Performance
- Target response time: **< 100ms** (typically < 10ms)
- No external calls, database queries, or I/O
- Suitable for high-frequency polling by Kubernetes readiness probes and load balancers

### 2.4 Public Access
- No authentication required
- No headers, cookies, or credentials needed
- Endpoint must be reachable from load balancers and monitoring systems

---

## 3. Acceptance Criteria

| AC | Criterion | Verification |
|---|-----------|--------------|
| AC-01 | Route handler created at `src/app/api/healthz-smoke-423911289/route.ts` | File exists and exports `GET` |
| AC-02 | GET `/api/healthz-smoke-423911289` returns HTTP 200 | Status code is 200 |
| AC-03 | Response body is `{ "ok": true, "variant": "423911289" }` | JSON matches spec exactly |
| AC-04 | No extra fields in response | Only two root fields: `ok`, `variant` |
| AC-05 | `ok` field is boolean true (not truthy string) | Type check: `typeof ok === 'boolean'` and `ok === true` |
| AC-06 | `variant` field is string `"423911289"` | Type check: `typeof variant === 'string'` and `variant === "423911289"` |
| AC-07 | Content-Type header is `application/json` | Header present and correct |
| AC-08 | Response time < 100ms | Measured via `performance.now()` |
| AC-09 | Response time typically < 10ms | Soft assertion; failure indicates regression |
| AC-10 | No authentication required | Endpoint works without auth headers/cookies |
| AC-11 | Under load (50+ concurrent calls), all respond within 100ms | Concurrent performance test |
| AC-12 | No environment variables required | Implementation must not reference `process.env` |
| AC-13 | Consistent responses across multiple calls | Sequential and concurrent calls return identical bodies |
| AC-14 | Response is a `NextResponse` instance | Type check: `instanceof NextResponse` |
| AC-15 | Comprehensive unit tests written | All tests in `__tests__/route.test.ts` pass |
| AC-16 | All tests pass with `npm run test` | Test suite is green |
| AC-17 | No lint warnings | `npm run lint` returns 0 warnings |
| AC-18 | No type errors | `npm run typecheck` passes |
| AC-19 | High test coverage (>= 95%) | `npm run test:coverage` reports coverage |

---

## 4. Test Design (TDD Red Phase)

The test suite will be organized into five dimensions:

### 4.1 Response Correctness (HTTP Status & Body)
- **RH-01:** Returns HTTP 200 status
- **RH-02:** Response body matches spec: `{ "ok": true, "variant": "423911289" }`
- **RH-03:** Response has no extra fields in root object
- **RH-04:** Response has exactly two root fields (`ok`, `variant`)

### 4.2 Field Type Safety
- **RH-05:** `ok` is boolean `true` (not truthy string/number)
- **RH-06:** `variant` is string `"423911289"` (not number or other type)

### 4.3 HTTP Headers & Meta
- **RH-07:** Content-Type header is `application/json`
- **RH-08:** Response is a `NextResponse` instance

### 4.4 Performance
- **RH-09:** Single call response time < 100ms
- **RH-10:** Single call response time typically < 10ms
- **RH-11:** Under load (50 concurrent calls), all respond within 100ms

### 4.5 Public Access & Consistency
- **RH-12:** No authentication required; endpoint works without auth
- **RH-13:** Multiple sequential calls return identical responses
- **RH-14:** No environment variables needed; self-contained

---

## 5. Implementation Notes

### 5.1 Pattern
The implementation follows the existing `GET /api/healthz-smoke` endpoint pattern:
- Import `NextResponse` from `next/server`
- Export `async function GET()` that returns a `NextResponse`
- Call `NextResponse.json(data, { status: 200 })`
- No request parameters, no dependencies

### 5.2 Variant Identification
This endpoint is identified by the variant code `423911289` embedded in:
1. The URL path: `/api/healthz-smoke-423911289`
2. The response `variant` field: `"423911289"`

This allows monitoring systems to identify which variant build is running based on the endpoint's response.

### 5.3 Isolation
- The endpoint must be self-contained with zero external dependencies
- No database queries, no external API calls, no environment variable reads
- This ensures minimal latency and maximum uptime availability

---

## 6. Related Files

- **Implementation:** `src/app/api/healthz-smoke-423911289/route.ts`
- **Tests:** `src/app/api/healthz-smoke-423911289/__tests__/route.test.ts`
- **Reference (existing pattern):** `src/app/api/healthz-smoke/route.ts`
- **ARCHITECTURE.md:** Section 4, API routes layout

---

## 7. Success Criteria Summary

✅ Endpoint exists at correct path  
✅ Returns correct HTTP 200 status  
✅ Response body matches spec exactly (no extra/missing fields)  
✅ Both fields are correct type and value  
✅ Content-Type header is present and correct  
✅ Response time < 100ms (typically < 10ms)  
✅ Works under load (50+ concurrent requests)  
✅ No auth required  
✅ No environment variables needed  
✅ Comprehensive test suite (14+ tests)  
✅ All tests passing  
✅ No lint/type warnings  
✅ High coverage (>= 95%)  
