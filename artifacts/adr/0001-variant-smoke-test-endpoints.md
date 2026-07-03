# ADR-0001: Variant Smoke Test Endpoints for Deployment Verification

## Status
Accepted (SPRINT-0005)

## Context

Modern distributed deployments and A/B testing scenarios require monitoring systems to verify that specific application variants are deployed and running correctly. A variant-specific health check endpoint allows:

- **Deployment verification** — Confirm that a specific code variant is deployed and running
- **Canary/blue-green testing** — Verify traffic is routing to the expected variant
- **Build identification** — External monitoring can track which application version is serving requests
- **Feature flag validation** — Confirm feature flags or configuration are active as expected

The base `/api/healthz-smoke` endpoint (SPRINT-0033) provides a lightweight, dependency-free health check with response time < 100ms. We need to extend this pattern for variant-specific scenarios without adding complexity to the base endpoint.

## Decision

We will create variant-specific health check endpoints following the pattern `/api/healthz-smoke-{variant}`, where each variant is:

1. **A separate route file** — Each variant gets its own Next.js route handler at
   `src/app/api/healthz-smoke-{variant}/route.ts`
2. **Hardcoded identifier** — The variant string is hardcoded in the response, not
   dynamically derived from environment variables or runtime state
3. **Zero dependencies** — No database, auth, configuration lookups, or external
   service calls (identical to the base endpoint pattern)
4. **Simple response format** — Returns `{ ok: true, variant: "{variant}" }`
   (no error envelope wrapper, following the simpler smoke test pattern)
5. **Public endpoint** — No authentication required for accessibility by monitoring systems
6. **Independent deployment** — Each variant route file can be deployed, updated, or
   removed independently

## Rationale

### Why separate route files vs. dynamic routing?

| Approach | Pros | Cons |
|----------|------|------|
| **Separate files (chosen)** | • Each variant is independently deployable • No dynamic parameter lookup overhead • Clear code visibility • Easy to add/remove variants • Route name exactly matches deployment variant | • More files in the codebase • Manual file creation per variant |
| **Single dynamic route** | • Fewer files • Centralized handler | • All variants must be deployed together • Adds lookup/parsing logic • Risk of variant collisions or typos • Harder to audit deployed variants |

For health check endpoints, the cost of separate files is minimal and the benefits for independent deployment and clear visibility are significant.

### Why hardcoded variant vs. environment variable?

| Approach | Pros | Cons |
|----------|------|------|
| **Hardcoded (chosen)** | • Response is guaranteed correct for this build/file • No environment lookup latency • Works in any environment • Build artifact and deployed code are aligned | • Requires rebuild to change variant • Less flexible for multi-variant single-image deployments |
| **Environment variable** | • Same image can serve multiple variants | • Environment must be configured correctly • Adds latency to response • Risk of misconfiguration |

Health check endpoints are part of the deployment artifact — the variant identifier should be baked into the code just like the version. This ensures monitoring systems get an accurate reflection of what's actually deployed.

### Why no error envelope?

The base `/api/healthz-smoke` uses the standard envelope format `{ data: T, error: null }` for consistency with other API endpoints. Variant endpoints omit this and use the simpler `{ ok: true, variant: "{variant}" }` format because:

- **Smoke tests are minimal** — The endpoint always succeeds (no error path to communicate)
- **Monitoring systems expect simplicity** — Load balancers and monitoring systems parsing these responses benefit from minimal JSON structure
- **Legacy compatibility** — Earlier variant endpoints used this simpler format; standardizing it reduces churn

## Consequences

### Positive
- Clear and auditable health check per deployment variant
- No runtime overhead (hardcoded values, no lookups)
- Each variant can be deployed independently without coordinating configuration
- Monitoring systems can track build variants and validate feature flags at scale
- Response time remains < 100ms with zero dependencies

### Negative
- Additional route files in the codebase (one per variant)
- Variants cannot be changed without code rebuild
- No single endpoint to enumerate all available variants
- Scaling to many variants (100+) would require tooling to generate route files

## Alternatives Considered

1. **Single endpoint with dynamic variant from `process.env.BUILD_VARIANT`**
   - Rejected: adds environment configuration complexity and latency

2. **Single endpoint returning all variants in an array**
   - Rejected: violates the smoke test principle (no external lookups or complex logic)

3. **Hardcoded variants stored in a centralized registry**
   - Rejected: adds a lookups (file read or database query), defeats simplicity

## Implementation Notes

- Start with variant `547016860` (`src/app/api/healthz-smoke-547016860/route.ts`)
- Each variant endpoint includes JSDoc header documenting its purpose
- Each variant should have test coverage for correct JSON response shape and status code
- Pattern can be replicated for additional variants by creating new route files
- Consider future automation to generate variant route files if scaling demands it

## References

- PRODUCT.md § SPRINT-0005: Variant smoke test endpoint feature spec
- ARCHITECTURE.md § Health check endpoints: system documentation
- Related ADR: variant smoke test endpoint pattern design
