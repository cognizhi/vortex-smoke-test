# ADR-0001: Variant Health Check Endpoint for Canary Deployments

**Date:** 2026-07-03 (SPRINT-0001)
**Status:** Accepted
**Sprint:** SPRINT-0001

## Context

The platform needs a way to monitor health and distinguish between different deployment cohorts during canary deployments and A/B testing. The existing `/api/healthz-smoke` endpoint provides a basic stateless health check, but does not include a way to identify which deployment variant the traffic is reaching.

### Problem

- Load balancers and monitoring systems need to verify they are reaching the correct deployment cohort
- Canary deployments require the ability to monitor variant-specific health
- A/B testing infrastructure benefits from being able to distinguish between deployment versions
- We need high-frequency polling capability for rapid deployment verification

### Constraints

- Must be stateless (no database lookups)
- Must have zero external dependencies
- Must respond in < 100ms (typical < 10ms)
- Must be suitable for high-frequency polling
- Must be idempotent and side-effect-free

## Decision

We will add a new variant health check endpoint at `GET /api/healthz-smoke-951516779` that:

1. **Returns variant identifier in response** — includes `variant: "951516779"` in the JSON response to identify the deployment cohort
2. **Follows the same pattern as `/api/healthz-smoke`** — stateless, zero dependencies, fast response
3. **Uses a semantic variant ID** — the number `951516779` serves as both a version identifier and a unique variant marker
4. **Implements as a Next.js App Router route handler** — consistent with existing health check patterns
5. **Maintains API consistency** — returns `{ ok: true, variant: "951516779" }` matching the stateless style of existing endpoints

## Rationale

### Why a separate endpoint?

- **Backwards compatibility** — existing `/api/healthz-smoke` remains unchanged
- **Clear semantics** — the URL path itself indicates this is a variant check
- **Flexibility** — allows different deployment cohorts to have different endpoints if needed in the future
- **Monitoring separation** — load balancers and monitoring systems can route to specific variants

### Why stateless and dependency-free?

- **Reliability** — no external system failures can cause false negatives
- **Performance** — consistent sub-10ms response times enable frequent polling
- **Simplicity** — no need for caching or state management
- **Deployment-friendly** — works correctly during all stages of deployment (startup, warmup, shutdown)

### Why a numeric variant ID?

- **Immutable** — the variant doesn't change during the endpoint's lifetime
- **Debuggable** — easy to correlate with deployment records and logs
- **Version-like** — can serve as a deployment timestamp or version reference

## Alternatives Considered

1. **Add optional variant parameter to existing endpoint** — rejected because it would require conditional logic and complicate the stateless design

2. **Use HTTP headers to return variant** — rejected because response bodies are more observable in monitoring dashboards and logs

3. **Include variant in environment-driven path** — rejected because it would complicate deployment and make the endpoint path dynamic

## Implementation Details

**Location:** `src/app/api/healthz-smoke-951516779/route.ts`

**Response Format:**
```json
{
  "ok": true,
  "variant": "951516779"
}
```

**HTTP Details:**
- Method: GET
- Status Code: 200 (success)
- Content-Type: application/json
- Authentication: None required
- Rate Limiting: Not applied (health checks exempt)

**Key Characteristics:**
- No database calls
- No authentication/authorization checks
- No external service dependencies
- Typical response time < 10ms
- Maximum response time < 100ms (SLA)

## Consequences

### Positive

- ✅ Canary deployments can now verify they reach specific cohorts
- ✅ Multi-variant monitoring becomes possible without additional infrastructure
- ✅ Load balancer routing verification works for variant-specific traffic
- ✅ Deployment infrastructure gains better visibility into variant distribution
- ✅ A/B testing infrastructure has built-in variant identification

### Neutral

- ↔️ Adds one new endpoint to the health check surface area
- ↔️ Requires monitoring systems to be configured to check the variant endpoint

### Negative

- ⚠️ Deployment scripts must be aware of the variant identifier to configure correctly
- ⚠️ Multiple variant endpoints may proliferate if additional variants are needed in the future

## Future Considerations

- If many variants are needed, consider a dynamic variant endpoint: `/api/healthz-smoke/{variantId}`
- Consider consolidating all health check endpoints under `/api/healthz/*` with consistent response formats
- If variant information becomes dynamic (e.g., based on feature flags), consider moving to a dedicated config endpoint

## Related Decisions

- **Stateless endpoints** — consistent with the design of `/api/healthz-smoke` (SPRINT-0033)
- **Response format consistency** — both health check endpoints return simple JSON objects
- **Zero-dependency principle** — aligns with the platform's approach to infrastructure endpoints

## References

- PRODUCT.md § Health Check Endpoints — requirements specification
- ARCHITECTURE.md § Health check endpoints — architecture documentation
- Implementation: `src/app/api/healthz-smoke-951516779/route.ts`
