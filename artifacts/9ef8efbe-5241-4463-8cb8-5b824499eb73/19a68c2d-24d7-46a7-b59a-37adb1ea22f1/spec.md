# Specification: Implement /healthz-smoke-518124667 GET Endpoint

**Ticket:** VRTX-0019
**Type:** Feature
**Date:** 2026-07-03
**Author:** Engineer Agent

---

## 1. Overview

Implement a lightweight variant-identified health check endpoint (`GET /api/healthz-smoke-518124667`) that enables specialized monitoring and canary deployment workflows. This endpoint returns a deterministic response (`{ ok: true, variant: "518124667" }`) with zero dependencies, supporting independent routing and health tracking by deployment variant for load balancers and monitoring systems.

## 2. User Stories

### Primary story
**As a** deployment engineer / monitoring system,
**I want to** query a variant-specific health endpoint,
**So that** I can track health and route traffic independently to specific deployment variants in canary and blue-green deployment workflows.

### Secondary stories
- As a load balancer, I want to check endpoint health without database queries, so that I can do frequent polling with minimal overhead.
- As a monitoring dashboard, I want to receive a variant identifier, so that I can distinguish health signals across different deployment versions.

## 3. Acceptance Criteria

### Happy path
- **AC-01**: GET request to `/api/healthz-smoke-518124667` returns HTTP 200 status code
- **AC-02**: Response body is valid JSON with structure `{ "ok": true, "variant": "518124667" }`
- **AC-03**: Response includes `Content-Type: application/json` header
- **AC-04**: `ok` field is boolean `true` (not truthy or string)
- **AC-05**: `variant` field is string `"518124667"` (exact match)
- **AC-06**: Response time is less than 100ms (typical < 10ms)

### Self-contained constraints
- **AC-07**: No database queries or connections
- **AC-08**: No authentication/authorization checks required
- **AC-09**: No external API calls or network I/O
- **AC-10**: No environment variable lookups or configuration loading
- **AC-11**: Pure function always returns 200 regardless of system state

### Error states
- **AC-E01**: Under concurrent load (50+ requests), all respond within 100ms

### Edge cases
- **AC-X01**: Response body contains exactly 2 fields: `ok` and `variant` (no extra fields)
- **AC-X02**: Multiple sequential calls return identical responses (consistency)
- **AC-X03**: Works without any .env variables set (self-contained)

## 4. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Export async GET function from `src/app/api/healthz-smoke-518124667/route.ts` | Must |
| FR-02 | Use `NextResponse.json()` to construct response | Must |
| FR-03 | Return status 200 with JSON body `{ ok: true, variant: "518124667" }` | Must |
| FR-04 | Include JSDoc comments documenting endpoint purpose, response codes, and behavior | Must |
| FR-05 | Keep handler pure (no side effects, no state mutation) | Must |
| FR-06 | Follow Next.js App Router conventions and existing pattern from `/api/healthz-smoke` | Should |

## 5. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | Response time < 100ms, typical < 10ms; handles 50+ concurrent requests |
| Code Quality | TypeScript strict mode; zero `any` types; `npm run lint` and `npm run typecheck` pass |
| Testability | 100% coverage of public GET handler; all acceptance criteria testable |
| Security | No authentication; no secrets in response; deterministic JSON only |
| Consistency | Follows existing `/api/healthz-smoke` pattern for structure and JSDoc |

## 6. Test Strategy

| Layer | Tool | What to cover |
|-------|------|---------------|
| Unit | Vitest | GET handler response status, JSON structure, field values, performance |
| Route Handler | Vitest | NextResponse construction, no side effects, idempotency under load |

**Coverage target:** 100% of route handler code

**Test cases to implement:**
- Response status is 200
- Response JSON has exactly `ok` and `variant` fields
- `ok` value is boolean `true`
- `variant` value is string `"518124667"`
- Content-Type header is `application/json`
- Response time is < 100ms (typical < 10ms)
- Multiple sequential calls return identical responses
- Response is a NextResponse instance
- Works without any environment variables
- No database or external service calls made

## 7. Out of Scope

- Configuration of variant values (hardcoded for this endpoint)
- Monitoring/alerting on the endpoint (infrastructure responsibility)
- Integration with specific load balancer or orchestration system
- Performance profiling or optimization beyond < 100ms target
- Any dynamic logic or state

## 8. Dependencies & Blockers

| Dependency | Type | Status |
|------------|------|--------|
| Next.js NextResponse API | Internal | Available (used in existing `/api/healthz-smoke`) |
| Vitest testing framework | Internal | Available (project already uses) |

## 9. Implementation Notes

### Pattern Reference
Follow the existing `/api/healthz-smoke/route.ts` endpoint as a template:
- Same JSDoc structure and inline comments
- Same `NextResponse.json()` usage
- Same async GET function signature
- Similar test structure and naming conventions

### Response Body Structure
This endpoint has a **simpler response structure** than `/api/healthz-smoke`:
- ✅ `/api/healthz-smoke`: `{ data: { ok: true }, error: null }`
- ✅ `/api/healthz-smoke-518124667`: `{ ok: true, variant: "518124667" }`

Both are valid; this variant is used for canary deployments and variant-specific routing.

### TypeScript Type Safety
Ensure the response type is properly inferred:
```typescript
type HealthzVariantResponse = {
  ok: boolean;
  variant: string;
};
```

---

*This spec is the source of truth for implementation, testing, and acceptance. Any deviation must be documented in summary.md.*
