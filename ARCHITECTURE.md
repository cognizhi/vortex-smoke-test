# Architecture

A multi-tenant booking SaaS built on Next.js (App Router). Each merchant is
isolated in its own **private PostgreSQL schema**; a subdomain determines which
merchant a request belongs to.

> See `PRODUCT.md` for what the system does and `DESIGN.md` for the visual
> design system.

---

## 1. Stack

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 15 (App Router), React 19 (Server Components by default) |
| Language | TypeScript 5 (strict) |
| Runtime | Node.js ≥ 22 |
| Database | PostgreSQL, accessed via Drizzle ORM (`drizzle-orm/node-postgres`, `pg` pool) |
| Styling | Tailwind CSS 3 with HSL CSS-variable tokens; shadcn/ui-style primitives |
| Forms / validation | React Hook Form + Zod |
| Auth | JWT (`jose`, HS256) in an httpOnly cookie; bcrypt password hashing |
| Email | SendGrid (`@sendgrid/mail`) with HTML templates |
| Rate limiting | Upstash Redis / Vercel KV (`@upstash/ratelimit`); skipped when unset |
| Global state | Zustand (used sparingly), React Context for auth/theme/sidebar |
| Tests | Vitest + React Testing Library (jsdom) |
| Deploy | Docker (multi-stage, non-root) behind Caddy; or Vercel |

> The stack is Next.js/React **15/19**, not the "16" mentioned in some legacy
> docs. Verify versions in `package.json`.

## 2. Multi-tenancy model

Tenancy is **schema-per-merchant** inside a single PostgreSQL database.

```
PostgreSQL database
├── platform schema
│   └── merchants        ← registry: slug → schema_name, status, owner creds
├── merchant_<uuidA>     ← tenant A's private tables
│   ├── admin_users, staff, staff_availability, staff_blocked_dates
│   ├── services, customers, bookings
│   └── merchant_settings, merchant_design, merchant_branding, discounts
└── merchant_<uuidB>     ← tenant B, fully isolated
```

- **`platform.merchants`** (`src/lib/db/platform-schema.ts`) is the only shared,
  cross-tenant table. It maps a merchant `slug` to its private `schema_name`
  (`merchant_<32-hex-uuid>`) and holds the lifecycle `status`
  (`provisioning | active | suspended | cancelled`) plus owner login credentials.
- **Per-merchant tables** are defined by a factory,
  `createMerchantSchema(schemaName)` in `src/lib/db/merchant-schema.ts`, which
  returns Drizzle table objects bound to that named schema.
- **Provisioning** (`src/lib/db/provision-merchant.ts`) runs at registration:
  inside one transaction it inserts the merchant row, `CREATE SCHEMA`, runs raw
  DDL for every tenant table (with indexes and a booking-number sequence), seeds
  default `merchant_settings` + `merchant_design`, inserts the owner
  `admin_users` row, then flips status to `active`. On failure it best-effort
  deletes the partial merchant row. `dropMerchantSchema()` tears a tenant down
  after the cancellation grace period.

## 3. Request routing (`src/middleware.ts`)

Edge middleware turns the **hostname into a tenant**:

1. Parse the `Host` header (port stripped). `extractMerchantSlug()` resolves the
   slug from `{slug}.<PLATFORM_DOMAIN>` (and `{slug}.localhost` in dev),
   validating against the slug regex and reserved-slug set.
2. If a slug is present:
   - **Page routes** are rewritten to `/site/{slug}/...` so the App Router
     resolves the public booking pages. The user's URL is unchanged.
   - **API routes** and admin paths (`/admin`, `/login`, `/register`) are *not*
     rewritten — the slug is passed downstream via an `x-merchant-slug` header.
3. Security headers (`X-Content-Type-Options`, `X-Frame-Options`,
   `X-XSS-Protection`, `Referrer-Policy`) are added to every response.

Handlers resolve the tenant DB with `getMerchantDb(slug)`
(`src/lib/db/get-merchant-db.ts`): it looks up `schema_name` in the platform
registry (only for `active` merchants — else `MerchantNotFoundError`), builds a
Drizzle instance scoped to that schema over the shared `pg` pool, and caches the
instance in-process keyed by slug (schema names are immutable).

## 4. Directory layout

```
src/
├── middleware.ts            # Subdomain → tenant routing + security headers
├── instrumentation.ts       # Next.js startup hook
├── globals.css              # Tailwind + design tokens (see DESIGN.md)
├── app/
│   ├── layout.tsx, page.tsx, error.tsx, not-found.tsx
│   ├── about/, contact/, founders/     # Public marketing pages
│   ├── (admin)/             # Route group: login, register, /admin/* dashboard
│   │   └── admin/{bookings,staff,services,customers,discounts,branding,design,settings,profile}
│   ├── site/[slug]/         # Public booking page + BookingFlow + cancel pages
│   │   └── api/             # Slug-scoped booking/slots/confirm/cancel handlers
│   └── api/                 # Platform APIs: auth/*, admin/*, booking/*, cancel/*,
│                            #   check-slug, health, healthz-smoke, avatars/[filename]
├── components/
│   ├── ui/                  # button, card, theme-toggle (shadcn/ui-style)
│   ├── layout/              # header, user-profile
│   ├── admin/               # BookingListTable, ServiceForm, AvailabilityEditor,
│   │                        #   RescheduleModal, BrandingForm, StaffForm, …
│   └── profile/             # AvatarUpload, ProfileCard
├── hooks/                   # useProfile, useAdminData, useDebounce
└── lib/
    ├── db/                  # schema, platform-schema, merchant-schema (factory),
    │                        #   provision-merchant, get-merchant-db, client, migrate
    ├── auth/                # session (JWT), password (bcrypt), admin-guard
    ├── booking/             # cancel-token (HMAC)
    ├── slots.ts             # slot availability engine
    ├── email/               # sendgrid, email-service, templates/
    ├── validations/         # Zod schemas: auth, booking, admin, profile
    ├── storage/             # photo-storage (avatars)
    ├── ratelimit.ts, env.ts, utils.ts
    └── *-context.tsx        # auth / theme / sidebar React contexts
```

## 5. Core subsystems

### Slot availability engine — `src/lib/slots.ts`
`getAvailableSlots()` computes bookable slots for a (staff, service, date):
fetch the staff's weekly availability for that day-of-week → reject if the date
is blocked → read service `durationMinutes` and merchant `slotDurationMinutes` →
generate candidate slots at the slot step → keep only slots whose overlapping
**confirmed** bookings are below `maxConcurrent` → drop past slots (for today,
require start > now + 30 min buffer). All times are computed in **UTC**.
`isSlotAvailable()` re-checks concurrency at write time (optimistic — no row lock
in the MVP).

### Authentication — `src/lib/auth/`
- **Sessions** (`session.ts`): HS256 JWT signed with `AUTH_SECRET`, payload
  `{ userId, merchantId, slug, role }`, 7-day TTL, stored in an httpOnly,
  `SameSite=Strict` cookie (`admin_session`).
- **Passwords** (`password.ts`): bcrypt.
- **Authorization** (`admin-guard.ts`): guards admin route handlers.
- Admins are per-tenant (`admin_users` in the merchant schema) with roles
  `owner | admin`. Auth endpoints (`/api/auth/*`) are rate-limited.

### Cancel tokens — `src/lib/booking/cancel-token.ts`
HMAC-signed, stateless tokens embedded in cancel URLs — valid until the booking
start time, verifiable without a DB lookup. Signed with `CANCEL_TOKEN_SECRET`.

### Email — `src/lib/email/`
`email-service.ts` orchestrates SendGrid sends using HTML templates in
`templates/` (booking confirmation, cancellation, reschedule, merchant
new-booking). HTML is escaped via `escape-html.ts`. Sending is a no-op when
SendGrid env vars are absent (dev-friendly).

### Storage — `src/lib/storage/photo-storage.ts`
Handles avatar/logo uploads to `PHOTO_STORAGE_PATH` (local dir in dev, object
store in prod); served back through `/api/avatars/[filename]`.

### Health check endpoints
- **`/api/health`** — Basic health check returning `{ status, timestamp }`. Used
  for general monitoring and deployment health probes.
- **`/api/healthz-smoke`** (SPRINT-0033) — Lightweight, stateless smoke test for
  load balancers and monitoring systems. Returns `{ data: { ok: true }, error: null }`
  with zero dependencies (no database, auth, or external service calls). Designed
  for frequent polling with response time < 100ms.
- **`/api/healthz-smoke-{variant}`** (SPRINT-0005+) — Variant-specific health check
  endpoints for deployment verification and A/B testing. Each endpoint returns
  `{ ok: true, variant: "{variant-id}" }` with zero dependencies. Used by monitoring
  systems to verify specific application variants are deployed and reachable. Current
  variants: `85511011` (SPRINT-0054), `28611693` (SPRINT-0053), `453353908` (SPRINT-0051), `992377535` (SPRINT-0050), `96685` (SPRINT-0048), `763023087` (SPRINT-0039), `800427409` (SPRINT-0038), `54367903` (SPRINT-0037), `688707801` (SPRINT-0034), `572185676` (SPRINT-0029), `901947994` (SPRINT-0027), `305070125` (SPRINT-0015), `110428092` (SPRINT-0013),
  `48842051` (SPRINT-0009), `963602537` (SPRINT-0007), `423911289` (SPRINT-0006),
  `547016860` (SPRINT-0005), `518124667` (SPRINT-0003), `859005244` (SPRINT-0002),
  `908186049` (SPRINT-0001), `637917955-a` (SPRINT-0064), `637917955-b` (SPRINT-0064), `637917955-c` (SPRINT-0064), `1065487472-a` (SPRINT-0067), `1065487472-b` (SPRINT-0067), `1065487472-c` (SPRINT-0067), `276127630-a` (SPRINT-0069), `276127630-b` (SPRINT-0069), `276127630-c` (SPRINT-0069), `1012136249-a` (SPRINT-0070), `1012136249-b` (SPRINT-0070), `1012136249-c` (SPRINT-0070), `121996100-a` (SPRINT-0073), `121996100-b` (SPRINT-0073), `121996100-c` (SPRINT-0073), `53261999-a` (SPRINT-0088), `53261999-b` (SPRINT-0088), `53261999-c` (SPRINT-0088), `509572604-a` (SPRINT-0092), `509572604-b` (SPRINT-0092), `509572604-c` (SPRINT-0092).
- **`/api/healthz-smoke-bugfix-{variant}`** (SPRINT-0052+) — Bugfix smoke test health
  check endpoints following the same variant-specific pattern. Each endpoint returns
  `{ ok: true, variant: "{variant-id}" }` with zero dependencies. Used for deployment
  verification of smoke test fixes. Current variants: `432732268` (SPRINT-0052).
- **`/api/healthz-smoke-bugfix2-{variant}`** (SPRINT-0052+) — Additional bugfix smoke
  test health check endpoints. Each endpoint returns `{ ok: true, variant: "{variant-id}" }`
  with zero dependencies. Current variants: `407985318` (SPRINT-0052).

## 6. Data flow (a booking)

1. Customer on `{slug}.<domain>` picks service + staff (`BookingFlow`).
2. `GET /api/booking/slots` → `getMerchantDb(slug)` → `getAvailableSlots()`.
3. Customer submits → `POST /api/booking/confirm`: Zod-validate → `isSlotAvailable`
   re-check → insert `customers` (upsert by email) + `bookings` (confirmed) →
   generate cancel token → send confirmation + merchant-notification emails.
4. Booking appears immediately in the admin dashboard; the customer gets a cancel
   link that stays valid until the appointment starts.

## 7. Configuration (`src/lib/env.ts`)

Env vars are parsed/validated with Zod at startup. Required in production:
`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET` (≥ 32 chars — a hard
pre-parse guard exits the process if missing in prod), `CANCEL_TOKEN_SECRET`.
Optional: `PLATFORM_DOMAIN` (default `platform.com`), SendGrid keys,
`PHOTO_STORAGE_PATH`, `MAX_BOOKING_DAYS_AHEAD` (90), `SLUG_EXPIRY_GRACE_DAYS`
(30), and `KV_REST_API_*` for rate limiting. `next build` tolerates missing
runtime-only secrets (no requests are served during static analysis).

## 8. Deployment

- **Docker**: multi-stage build, runs as non-root, `/api/health` health check.
  Fronted by **Caddy** (`Caddyfile`) for wildcard TLS + reverse proxy. Local
  stack via `docker-compose.yml` / `Makefile` (`make docker-up`).
- **Vercel**: connect the repo; the shared `pg` pool and in-process merchant-DB
  cache survive across warm invocations.
- **Migrations**: `platform` and base tables via Drizzle
  (`npm run db:generate` / `db:migrate`); per-merchant tables are created at
  runtime by the provisioning DDL, not by Drizzle migrations.

## Key Decisions

- **Schema-per-tenant over row-level tenancy** — strong isolation, simple per-merchant backup/teardown, at the cost of runtime DDL and many schemas.
- **Stateless HMAC cancel tokens** — no session store for the cancel flow; the token itself proves authorization and encodes expiry.
- **Optimistic concurrency for bookings** — availability is re-checked at write time without row locks; acceptable for MVP volumes.
- **In-process tenant-DB cache** — fast slug resolution; must be evicted on status change (`evictMerchantDbCache`).
- **Server Components by default** — minimal client JS; Client Components are small and marked `"use client"`.

---

## Changelog

### 2026-07-19 — SPRINT-0092: Three independent smoke test endpoints (509572604)

**Added:**
- Three independent smoke test endpoints: `/api/healthz-smoke-509572604-a`, `/api/healthz-smoke-509572604-b`, `/api/healthz-smoke-509572604-c`
- Each endpoint returns `{ ok: true, variant: "509572604" }` with HTTP 200
- All endpoints are stateless with zero dependencies (no database, auth, or external calls)
- Comprehensive test coverage: Playwright E2E tests
- Designed for parallel, independent implementation supporting autonomous team delivery

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous variant endpoints
- Implemented as three separate route files (`/api/healthz-smoke-509572604-{a,b,c}/route.ts`)
- Hardcoded variant identifier `509572604` enables deployment verification without dynamic configuration
- Three independent implementations (no shared code) supporting parallel team workflows
- Target response time < 10ms (typical pure response generation)

**Testing infrastructure:**
- E2E tests via Playwright: full HTTP requests verifying all three endpoints respond correctly
- Test file: `e2e/healthz-smoke-endpoints-sprint-0092.spec.ts`

### 2026-07-19 — SPRINT-0088: Three independent smoke test endpoints (53261999)

**Added:**
- Three independent smoke test endpoints: `/api/healthz-smoke-53261999-a`, `/api/healthz-smoke-53261999-b`, `/api/healthz-smoke-53261999-c`
- Each endpoint returns `{ ok: true, variant: "53261999" }` with HTTP 200
- All endpoints are stateless with zero dependencies (no database, auth, or external calls)
- Comprehensive test coverage: Vitest unit tests + Playwright E2E tests
- 100% code coverage for all three endpoints
- Designed for parallel, independent implementation supporting autonomous team delivery

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous variant endpoints
- Implemented as three separate route files (`/api/healthz-smoke-53261999-{a,b,c}/route.ts`)
- Hardcoded variant identifier `53261999` enables deployment verification without dynamic configuration
- Three independent implementations (no shared code) supporting parallel team workflows
- Target response time < 10ms (typical pure response generation)

**Testing infrastructure:**
- Unit tests per endpoint: mocking NextRequest/NextResponse, validating 200 status and JSON structure
- E2E tests via Playwright: full HTTP requests verifying all three endpoints respond correctly
- 100% code coverage (trivial endpoints with no branching logic)

### 2026-07-16 — SPRINT-0073: Three independent variant endpoints (121996100)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-121996100-a` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "121996100" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-121996100-b` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "121996100" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-121996100-c` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "121996100" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include three new variant endpoints. Continues
  the established pattern for variant endpoints enabling monitoring systems to verify specific
  application variants are deployed and reachable.

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous
  variant endpoints.
- Implemented as three separate route files (`/api/healthz-smoke-121996100-{a,b,c}/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Three independent implementations (no shared code) supporting parallel deployment testing.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite per endpoint (15 tests, 100% coverage each).

### 2026-07-15 — SPRINT-0070: Three independent variant endpoints (1012136249)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-1012136249-a` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1012136249" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-1012136249-b` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1012136249" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-1012136249-c` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1012136249" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include three new variant endpoints. Continues
  the established pattern for variant endpoints enabling monitoring systems to verify specific
  application variants are deployed and reachable.

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous
  variant endpoints.
- Implemented as three separate route files (`/api/healthz-smoke-1012136249-{a,b,c}/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Three independent implementations (no shared code) supporting parallel deployment testing.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite per endpoint (15 tests, 100% coverage each).

### 2026-07-15 — SPRINT-0069: Three independent variant endpoints (276127630)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-276127630-a` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "276127630" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-276127630-b` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "276127630" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-276127630-c` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "276127630" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include three new variant endpoints. Continues
  the established pattern for variant endpoints enabling monitoring systems to verify specific
  application variants are deployed and reachable.

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous
  variant endpoints.
- Implemented as three separate route files (`/api/healthz-smoke-276127630-{a,b,c}/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Three independent implementations (no shared code) supporting parallel deployment testing.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite per endpoint (15 tests, 100% coverage each).

### 2026-07-14 — SPRINT-0067: Three independent variant endpoints (1065487472)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-1065487472-a` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1065487472" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-1065487472-b` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1065487472" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-1065487472-c` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1065487472" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include three new variant endpoints. Continues
  the established pattern for variant endpoints enabling monitoring systems to verify specific
  application variants are deployed and reachable.

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous
  variant endpoints.
- Implemented as three separate route files (`/api/healthz-smoke-1065487472-{a,b,c}/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Three independent implementations (no shared code) supporting parallel deployment testing.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite per endpoint (15 tests, 100% coverage each).

### 2026-07-12 — SPRINT-0064: Three independent variant endpoints (637917955)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-637917955-a` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "637917955" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-637917955-b` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "637917955" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-637917955-c` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "637917955" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include three new variant endpoints. Continues
  the established pattern for variant endpoints enabling monitoring systems to verify specific
  application variants are deployed and reachable.

**Implementation details:**
- All three endpoints follow the lightweight, dependency-free pattern established by previous
  variant endpoints.
- Implemented as three separate route files (`/api/healthz-smoke-637917955-{a,b,c}/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Three independent implementations (no shared code) supporting parallel deployment testing.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite per endpoint (15 tests, 100% coverage each).

### 2026-07-11 — SPRINT-0054: Variant smoke test endpoint (85511011)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-85511011` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "85511011" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-85511011/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite (14 tests per endpoint).

### 2026-07-11 — SPRINT-0053: Variant smoke test endpoint (28611693)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-28611693` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "28611693" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-28611693/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).
- Comprehensive test suite (15 tests per endpoint).

### 2026-07-10 — SPRINT-0052: Bugfix smoke test health check endpoints (432732268, 407985318)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-bugfix-432732268` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "432732268" }` with zero
  dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-bugfix2-407985318` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "407985318" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new bugfix variants. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.

**Implementation details:**
- Both endpoints follow the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route files (`/api/healthz-smoke-bugfix-432732268/route.ts` and
  `/api/healthz-smoke-bugfix2-407985318/route.ts`).
- Hardcoded variant identifiers enable deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).
- Each endpoint includes comprehensive test suite (14 tests per endpoint).

### 2026-07-10 — SPRINT-0051: Variant smoke test endpoint (453353908)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-453353908` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "453353908" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-453353908/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-09 — SPRINT-0050: Variant smoke test endpoint (992377535)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-992377535` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "992377535" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-992377535/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-09 — SPRINT-0048: Variant smoke test endpoint (96685)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-96685` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "96685" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-96685/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-09 — SPRINT-0045: Product documentation sprint

**Overview:** Sprint focused on establishing and maintaining holistic product documentation across PRODUCT.md, ARCHITECTURE.md, and DESIGN.md.

**Changes:**
- Refactored PRODUCT.md to be a true holistic, current target-state product specification (WHAT & WHY only)
- Removed sprint-specific implementation details from PRODUCT.md (those belong in ARCHITECTURE.md/DESIGN.md)
- Consolidated health check endpoints documentation in operations section as established capabilities
- Established clear documentation boundaries: PRODUCT.md focuses on product requirements and user value; ARCHITECTURE.md covers technical implementation; DESIGN.md covers visual design
- Updated changelogs across all three planning documents to reflect documentation normalization

**Scope:**
- Documentation rationalization only; no new product features
- Maintains all existing capabilities documented in previous sprints

### 2026-07-09 — SPRINT-0039: Variant smoke test endpoint (763023087)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-763023087` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "763023087" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-763023087/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-08 — SPRINT-0038: Variant smoke test endpoint (800427409)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-800427409` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "800427409" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-800427409/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-07 — SPRINT-0037: Variant smoke test endpoint (54367903)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-54367903` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "54367903" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-54367903/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-07 — SPRINT-0034: Variant smoke test endpoint (688707801)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-688707801` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "688707801" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-688707801/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-06 — SPRINT-0029: Variant smoke test endpoint (572185676)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-572185676` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "572185676" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-572185676/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-05 — SPRINT-0027: Variant smoke test endpoint (901947994)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-901947994` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "901947994" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-901947994/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-05 — SPRINT-0015: Variant smoke test endpoint (305070125)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-305070125` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "305070125" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-305070125/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-04 — SPRINT-0013: Variant smoke test endpoint (110428092)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-110428092` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "110428092" }` with zero
  dependencies (no database, auth, or external calls).
- Updated health check endpoints inventory to include new variant. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-110428092/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-04 — SPRINT-0009: Variant smoke test endpoint (48842051)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-48842051` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "48842051" }` with zero
  dependencies (no database, auth, or external calls).
- Documented new variant in health check endpoints inventory. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-48842051/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-03 — SPRINT-0007: Variant smoke test endpoint (963602537)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-963602537` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "963602537" }` with zero
  dependencies (no database, auth, or external calls).
- Documented new variant in health check endpoints inventory. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-963602537/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-03 — SPRINT-0006: Variant smoke test endpoint (423911289)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-423911289` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "423911289" }` with zero
  dependencies (no database, auth, or external calls).
- Documented variant endpoint pattern in health check section. Variant endpoints enable
  monitoring systems to verify specific application variants are deployed and reachable,
  supporting canary deployments and A/B testing scenarios.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Variant endpoints follow the lightweight, dependency-free pattern established by base
  `/api/healthz-smoke` endpoint.
- Each variant is implemented as a separate route file (`/api/healthz-smoke-{variant}/route.ts`).
- Hardcoded variant identifier enables deployment verification without dynamic configuration.
- Target response time < 100ms (typical < 10ms).

### 2026-07-03 — SPRINT-0005: Variant smoke test endpoint infrastructure

**Added:**
- Initial variant-specific health check endpoint pattern with `/api/healthz-smoke-547016860`.
- Foundation for deployment verification and A/B testing scenarios.
- Documented variant endpoints in operations section of PRODUCT.md.

### 2026-07-03 — SPRINT-0033: Base health endpoints

**Added:**
- Core health check endpoints: `/api/health` and `/api/healthz-smoke`.
- Lightweight smoke test endpoint for monitoring and load balancer integration.
- Health check documentation in operations section.
