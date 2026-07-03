# ADR-0001: Variant-Identified Health Check Endpoints

**Date:** 2026-07-03  
**Status:** Accepted  
**Scope:** SPRINT-0004

## Context

Existing health check endpoints (`/api/health`, `/api/healthz-smoke`) provide
platform-wide health status but do not support specialized monitoring workflows
such as:

- **Canary deployments** — tracking health separately per variant for gradual rollouts
- **Blue-green deployments** — independent health checks for the blue and green stacks
- **Load balancer routing** — directing traffic to specific deployment variants
  based on health signals
- **Monitoring dashboards** — displaying health metrics distinct by deployment variant

Load balancers and monitoring systems (Kubernetes, Prometheus, Datadog) benefit
from variant-specific endpoints that can be polled independently without requiring
query parameters or database lookups.

## Decision

We introduce **variant-identified health check endpoints** at paths like
`/api/healthz-smoke-{variant-id}` that return the variant identifier alongside
the health status.

### Design

- **Path pattern:** `/api/healthz-smoke-{variant-id}`
- **Response:** `{ "ok": true, "variant": "{variant-id}" }`
- **Example:** `/api/healthz-smoke-518124667` returns `{ "ok": true, "variant": "518124667" }`
- **Performance:** < 100ms response time (typical < 10ms)
- **Dependencies:** None (no database, auth, or external service calls)

### Implementation

Each variant endpoint is a simple, hardcoded route handler in
`src/app/api/healthz-smoke-{variant-id}/route.ts` returning the variant ID as a
string. No dynamic configuration or environment variables are required.

## Rationale

1. **Simplicity** — static paths require no query parsing or configuration lookup.
   The variant ID is baked into the endpoint path and response.

2. **Load balancer compatibility** — most load balancers and monitoring systems
   support direct HTTP GET probes without query parameters. Path-based variants
   integrate seamlessly.

3. **Cacheability** — static responses can be cached by CDNs and reverse proxies
   without cache-key complexity.

4. **Observability** — monitoring dashboards can label health signals by endpoint
   path, making variant-specific metrics visible without parsing response bodies.

5. **Scalability** — each variant endpoint is independent, allowing load balancers
   to poll different variants concurrently with zero contention.

## Consequences

**Positive**

- Variant endpoints are fully stateless, require zero configuration, and deploy
  instantly.
- Load balancers and monitoring systems integrate without additional tooling.
- Canary and blue-green deployments can use independent health checks.
- Response time is deterministic (< 10ms hardcoded JSON).

**Negative**

- Each variant requires a dedicated route file (`src/app/api/healthz-smoke-{id}/route.ts`).
  Adding new variants requires new files, not configuration changes.
- The variant ID is hardcoded; dynamic variants would require a different pattern
  (e.g., query parameters on a single `/api/healthz-smoke` endpoint).

**Trade-off**

This pattern favors **static, pre-deployed variants** (e.g., `a`, `b`, `canary`,
`prod-v1`) over **dynamic, on-demand variants**. For MVP and near-term deployments,
this is acceptable.

## Alternatives Considered

### Alternative 1: Query parameter on a single endpoint

```
GET /api/healthz-smoke?variant=518124667
→ { "ok": true, "variant": "518124667" }
```

**Pros:** Single implementation, supports unlimited variants dynamically.

**Cons:** Query strings complicate load balancer configuration; some systems
require separate cache keys per query; monitoring dashboards must parse response
bodies to identify variants.

**Decision:** Rejected. Path-based variants are simpler for load balancers.

### Alternative 2: Environment variable for variant ID

```
GET /api/healthz-smoke
→ { "ok": true, "variant": "${process.env.DEPLOYMENT_VARIANT}" }
```

**Pros:** Single implementation, variant ID set at deployment time.

**Cons:** Requires environment variable injection; no indication of variant in
the URL itself; difficult for load balancers to discover which variants are
running.

**Decision:** Rejected. Baking the variant ID into the path is more discoverable.

## Status

**Accepted** — Implemented in SPRINT-0004.

First variant endpoint: `/api/healthz-smoke-518124667` for canary deployments.
