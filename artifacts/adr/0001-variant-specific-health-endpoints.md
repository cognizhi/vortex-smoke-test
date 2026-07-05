# ADR-0001: Variant-specific health check endpoints for deployment verification

## Status

Accepted (SPRINT-0005+, continuing through SPRINT-0015)

## Context

Distributed deployments require the ability to verify that specific application variants are active and reachable. Monitoring systems and load balancers need lightweight, dependency-free mechanisms to confirm that:
- Specific code path deployments are live
- Canary deployments and A/B testing variants are active
- Progressive rollouts are reaching target infrastructure
- Variant-specific traffic can be routed intelligently

Previous health check endpoints (`/api/health`, `/api/healthz-smoke`) provided generic platform health but could not distinguish between deployment variants.

## Decision

Implement variant-specific health check endpoints using the pattern:
- **Endpoint:** `GET /api/healthz-smoke-{variant-id}`
- **Response:** `{ ok: true, variant: "{variant-id}" }`
- **Variant ID:** Hardcoded, unique identifier per endpoint (e.g., "423911289", "547016860")
- **Dependencies:** None (no database, auth, or external calls)
- **Performance target:** < 100ms response time (typical < 10ms)
- **Implementation:** Separate route file per variant (`/api/healthz-smoke-{variant}/route.ts`)

## Rationale

### Why hardcoded variant IDs instead of environment variables?

**Hardcoded variant IDs are preferred because:**
1. **Simplicity** — No environment variable configuration required; the variant is baked into the code path
2. **Deployment confidence** — Verifying a specific variant is equivalent to verifying that specific code has been deployed
3. **Immutability** — The variant identifier cannot be misconfigured or change after deployment
4. **Isolation** — Each variant is independent; failures in one route don't affect others
5. **Deployment clarity** — When a variant endpoint responds, you know that exact version is live

**Environment variables would complicate:**
- Configuration management (must be set correctly in each environment)
- Deployment verification (env vars can be misconfigured)
- Route isolation (a single shared handler is more complex)

### Why separate route files instead of a dynamic handler?

1. **Route isolation** — Each variant is a distinct, independently deployable file
2. **Type safety** — No dynamic string-based routing; TypeScript validates the handler structure
3. **Monitoring clarity** — Each variant shows as a distinct endpoint in logs and monitoring
4. **Rollback safety** — Removing a variant is just removing the file; no conditional logic to break

### Why this endpoint exists alongside `/api/healthz-smoke`

- **`/api/healthz-smoke`** — Generic platform health; always present, identical across variants
- **`/api/healthz-smoke-{variant}`** — Variant-specific; allows distributed monitoring to confirm *which* variant is deployed

Together they enable two-layer verification:
1. Is the app reachable? (healthz-smoke)
2. Is the *specific* variant I expect deployed? (healthz-smoke-{variant})

## Alternatives considered

### Alternative 1: Dynamic handler with environment variable
```typescript
// GET /api/healthz-smoke/[variant]/route.ts
export async function GET(req, { params }) {
  const variant = process.env.VARIANT_ID;
  return NextResponse.json({ ok: true, variant });
}
```

**Rejected:** Harder to verify deployments (env var could be wrong), adds configuration burden.

### Alternative 2: Single shared endpoint returning multiple variants
```typescript
// GET /api/healthz-smoke
// Returns { ok: true, variants: ["423911289", "547016860"] }
```

**Rejected:** Doesn't scale (one response per app instance); can't route per-variant; defeats the purpose of variant verification.

### Alternative 3: Query parameter variant identifier
```typescript
// GET /api/healthz-smoke?variant=423911289
```

**Rejected:** Not RESTful; harder for monitoring systems and load balancers to configure distinct checks; defeats the immutability benefit.

## Implementation

- **Location:** `src/app/api/healthz-smoke-{variant}/route.ts`
- **Pattern:** Each variant is a separate file with hardcoded variant ID
- **Tests:** Unit tests verify response structure, performance, and that endpoint requires no dependencies
- **Monitoring:** Each variant is independently monitored; missing response indicates deployment issue

## Consequences

### Positive

- ✅ Simple, clear deployment verification mechanism
- ✅ Type-safe, immutable variant identification
- ✅ Independent route files reduce complexity
- ✅ Easy to add new variants; easy to deprecate old ones
- ✅ No runtime configuration burden
- ✅ Works seamlessly with load balancers and monitoring systems

### Negative

- ⚠️ Multiple endpoints to maintain (one per variant)
- ⚠️ Requires code change to add/remove variants
- ⚠️ Historical variants accumulate unless explicitly removed

### Mitigation for negatives

- Variants are very simple files (~20 lines); easy to add and maintain
- CI/CD automation handles variant registration and removal
- Clear naming convention and path structure make management straightforward

## Related sprints

- **SPRINT-0033:** Initial health check endpoints (`/api/health`, `/api/healthz-smoke`)
- **SPRINT-0001–0003:** Early variant endpoint implementations (`908186049`, `859005244`, `518124667`)
- **SPRINT-0005:** Introduction of variant endpoint pattern with `547016860`
- **SPRINT-0006:** Addition of variant `423911289`
- **SPRINT-0007:** Addition of variant `963602537`
- **SPRINT-0009:** Addition of variant `48842051`
- **SPRINT-0013:** Addition of variant `110428092`
- **SPRINT-0015:** Addition of variant `305070125`

## Future considerations

- Could automate variant registration via build-time configuration
- Could implement a variant registry endpoint if needed in the future
- Could extend to variant-specific feature detection if required
