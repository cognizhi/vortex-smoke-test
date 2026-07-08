# Specification: GET /api/healthz-smoke-800427409 Variant Endpoint

**Ticket:** VRTX-0192  
**Type:** Task (Feature Implementation)  
**Sprint:** SPRINT-0038  
**Date:** 2026-07-08  
**Author:** Engineer Agent

---

## 1. Overview

Implement a lightweight, variant-specific health check endpoint `/api/healthz-smoke-800427409` for deployment verification. This endpoint enables monitoring systems and load balancers to verify that this specific application variant (800427409) is deployed and reachable. The endpoint has zero dependencies (no database, auth, or external calls) and responds in < 100ms with a deterministic JSON response.

This follows the established pattern of variant-specific smoke test endpoints documented in PRODUCT.md (SPRINT-0005+) for deployment verification scenarios.

## 2. User Stories

### Primary story
**As a** DevOps operator or monitoring system,  
**I want to** query `/api/healthz-smoke-800427409` and receive a variant-specific health check response,  
**So that** I can verify this specific application variant (800427409) is deployed and reachable in a distributed rollout.

### Secondary stories
- As a load balancer, I want to route traffic to this variant endpoint to enable canary deployments and A/B testing.
- As a CI/CD system, I want to poll this endpoint post-deployment to confirm the specific variant is live.

## 3. Acceptance Criteria

Written in Given/When/Then format.

### Happy path
- **AC-01**: Given a request to `GET /api/healthz-smoke-800427409`, when the handler executes, then it returns HTTP 200 with JSON body `{ "ok": true, "variant": "800427409" }`.
- **AC-02**: Given the endpoint is queried, when the response is returned, then the `Content-Type` header is `application/json; charset=utf-8`.
- **AC-03**: Given the endpoint is queried multiple times in sequence, when each request is made, then all responses are identical and consistent.
- **AC-04**: Given 50 concurrent requests to the endpoint, when all complete, then all return status 200 with the correct response body in < 100ms each (p95).
- **AC-05**: Given a request to the endpoint, when it is processed, then no database queries are made.
- **AC-06**: Given a request to the endpoint, when it is processed, then no authentication or authorization checks are performed.
- **AC-07**: Given a request to the endpoint, when it is processed, then no external service calls are made.

### Code quality
- **AC-C01**: TypeScript has zero type errors (`npm run typecheck` passes).
- **AC-C02**: ESLint passes with zero warnings (`npm run lint --max-warnings 0`).
- **AC-C03**: The handler includes comprehensive JSDoc comments documenting the endpoint, its behavior, and response format.

## 4. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Create file at `src/app/api/healthz-smoke-800427409/route.ts` | Must |
| FR-02 | Export async `GET()` function that returns `NextResponse.json()` | Must |
| FR-03 | Response body is `{ ok: true, variant: "800427409" }` with status 200 | Must |
| FR-04 | Endpoint is publicly accessible (no auth guard) | Must |
| FR-05 | Handler has no dependencies on database, config, or external services | Must |
| FR-06 | Include JSDoc header documenting endpoint purpose, dependencies, response codes, and response format | Must |
| FR-07 | Response time must be < 100ms (typical < 10ms) | Must |
| FR-08 | Handler is self-contained with no side effects | Must |

## 5. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | Response time < 100ms (target: < 10ms). No I/O, no blocking operations. |
| Code Quality | Strict TypeScript (no implicit `any`), ESLint zero warnings, JSDoc headers. |
| Dependencies | Zero dependencies: no database queries, no auth checks, no external API calls, no env var lookups. |
| Documentation | JSDoc comments documenting purpose, visibility, dependencies, response codes, and response body. |
| Consistency | Follows the exact pattern of existing variant endpoints (e.g., `/api/healthz-smoke-54367903`). |
| Accessibility | N/A for API endpoint. |

## 6. Test Strategy

| Layer | Tool | What to cover |
|-------|------|---------------|
| Route Handler | Vitest | GET handler returns 200 status and correct JSON response body; no side effects; response time < 100ms; concurrent load handling (50 requests); consistency under repeated calls |

### Test Cases (Red Phase)

1. **Status code test**: GET request returns 200
2. **Response body test**: Response is valid JSON with exact shape `{ ok: true, variant: "800427409" }`
3. **Type safety test**: `ok` is boolean `true`, `variant` is string `"800427409"`
4. **No extra fields test**: Response contains exactly 2 fields, no additional properties
5. **Consistency test**: 10 sequential calls return identical responses
6. **Content-Type test**: Response header is `application/json`
7. **Performance test**: Response time < 100ms
8. **Load test**: 50 concurrent requests all succeed and complete in < 100ms
9. **No auth required test**: Request succeeds without authentication headers
10. **No side effects test**: Handler executes with no database queries, no external calls

### Coverage Target
- 100% line coverage for the route handler (single GET function)

## 7. Out of Scope

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants in a single response
- Custom response formats per variant
- Variant-specific feature detection or capabilities
- Admin dashboard UI for variant management
- Monitoring integration (external systems handle the integration)

## 8. Dependencies & Blockers

| Dependency | Type | Status |
|------------|------|--------|
| Next.js App Router (already in place) | Internal | ✅ Available |
| NextResponse API | Internal | ✅ Available |
| Vitest test framework | Internal | ✅ Available |

**No blockers.** This is a straightforward, self-contained implementation following an established pattern.

## 9. Implementation Pattern

### File Structure
```
src/app/api/healthz-smoke-800427409/
└── route.ts              ← Main handler
```

### Handler Signature
```typescript
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: "800427409" },
    { status: 200 }
  );
}
```

### JSDoc Header
Should document:
- What the endpoint does (health check with variant identifier)
- That it's public and requires no auth
- That it has no dependencies
- Response codes (200 only)
- Response body format
- Target response time (< 100ms)

## 10. Reference Implementations

**Base endpoint** (`/api/healthz-smoke`):
- `src/app/api/healthz-smoke/route.ts` — demonstrates the handler pattern
- Note: Base endpoint returns `{ data: { ok: true }, error: null }` (different envelope)
- Variant endpoints use simpler envelope: `{ ok: true, variant: "800427409" }`

**Similar variant endpoints**:
- `/api/healthz-smoke-54367903` (SPRINT-0037)
- `/api/healthz-smoke-688707801` (SPRINT-0034)
- All follow the same pattern and response structure

## 11. Open Questions

- [x] Should the response match the base `/api/healthz-smoke` envelope? **No** — variant endpoints use a simpler envelope `{ ok: true, variant: "..." }` per PRODUCT.md spec and established pattern.
- [x] Should the variant identifier be dynamic or hardcoded? **Hardcoded** — variant identifier is baked into the endpoint path, not dynamic configuration.
- [x] Should we add caching headers? **No** — monitoring systems expect fresh responses; health checks should reflect current state.

---

**This spec is the source of truth. Implementation must match these requirements exactly. Any deviation must be documented in summary.md.**

