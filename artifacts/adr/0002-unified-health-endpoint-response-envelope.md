# ADR-0002: Unified response envelope for health check endpoints

## Status

Accepted (SPRINT-0017+)

## Context

Health check endpoints have evolved across multiple sprints:
- **SPRINT-0033:** Base endpoints `/api/health` and `/api/healthz-smoke` with standard envelope `{ data: {...}, error: null }`
- **SPRINT-0005 to SPRINT-0015:** Variant endpoints `/api/healthz-smoke-{variant}` with bare response `{ ok: true, variant: "..." }`

This inconsistency creates two problems:
1. **API Inconsistency** — Different endpoints return different response shapes
2. **Client complexity** — Consuming systems must handle two different response patterns
3. **Future scalability** — Adding new health check features becomes unclear (which envelope to use?)

SPRINT-0017 introduces an opportunity to unify the response format across all health check endpoints.

## Decision

Starting with SPRINT-0017, all variant-specific health check endpoints will use the unified response envelope:

```json
{
  "data": {
    "ok": true,
    "variant": "{variant-id}"
  },
  "error": null
}
```

This matches the envelope used by `/api/healthz-smoke` (SPRINT-0033) and maintains consistency with the platform's standard API response pattern.

## Rationale

### Why unify with the standard envelope?

1. **API consistency** — All health check endpoints now have the same response structure
2. **Client simplicity** — Monitoring systems can use a single response parser for all health endpoints
3. **Framework alignment** — Aligns with the platform's standard API envelope pattern used elsewhere
4. **Error handling** — The `error: null` field provides a clear contract for error scenarios (future expansion)
5. **Extensibility** — Easy to add new fields to `data` without breaking the envelope structure

### Why now?

SPRINT-0017 is a good inflection point because:
- Variant endpoints are now a stable pattern (SPRINT-0005 through SPRINT-0016)
- The platform API response envelope is well-established
- Future monitoring improvements can build on this unified foundation

## Alternatives considered

### Alternative 1: Keep variant endpoints as-is
```json
{
  "ok": true,
  "variant": "1072853191"
}
```

**Rejected:** Perpetuates API inconsistency; limits future extensibility.

### Alternative 2: Migrate all existing variant endpoints to new envelope
```
Retro-fit SPRINT-0001 through SPRINT-0015 endpoints
```

**Rejected:** Breaking change; existing monitoring systems depend on the current format. SPRINT-0017 establishes the new standard moving forward.

## Implementation

- **New variant endpoints (SPRINT-0017+)** use the unified envelope
- **Existing variant endpoints (SPRINT-0001–SPRINT-0015)** maintain backward compatibility
  - Continue returning `{ ok: true, variant: "..." }` to avoid breaking deployed monitoring
  - Can be migrated in a future sprint if monitoring systems are updated
- **Path pattern:** Endpoints using new envelope are indicated by naming convention in PRODUCT.md

## Consequences

### Positive

- ✅ Consistent API response structure across all health endpoints
- ✅ Simplified client code (single parser for all health checks)
- ✅ Clear error handling path for future error scenarios
- ✅ Aligns with platform's established API patterns
- ✅ Improves monitoring system integration

### Negative

- ⚠️ Breaks backward compatibility with systems expecting the bare variant format
- ⚠️ Monitoring systems must be updated to handle new envelope
- ⚠️ Migration strategy needed if all variants are to be unified later

### Mitigation for negatives

- New envelope introduced only for SPRINT-0017 endpoint onwards
- Existing endpoints remain stable (no breaking changes to currently-deployed variants)
- Clear documentation in PRODUCT.md distinguishes old vs. new response formats
- When ready, legacy endpoints can be migrated with advance notice and monitoring system updates

## Related decisions

- **ADR-0001:** Variant endpoint architecture and deployment verification pattern
- **SPRINT-0033:** Introduction of standard API response envelope `{ data: {...}, error: null }`
- **SPRINT-0005 to SPRINT-0015:** Variant endpoint implementations with bare response format

## Future considerations

- Monitor adoption of SPRINT-0017 envelope across monitoring systems
- Plan migration of legacy variant endpoints when safe
- Consider a unified health endpoint registry that returns all active variants
- Evaluate whether error scenarios (e.g., database unavailable during health check) should be represented in the `error` field
