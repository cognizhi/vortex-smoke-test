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
  variants: `1009679915` (SPRINT-0008), `963602537` (SPRINT-0007), `423911289` (SPRINT-0006),
  `547016860` (SPRINT-0005), `518124667` (SPRINT-0003), `859005244` (SPRINT-0002),
  `908186049` (SPRINT-0001).

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

## 9. Key decisions & trade-offs

- **Schema-per-tenant over row-level tenancy** — strong isolation, simple
  per-merchant backup/teardown, at the cost of runtime DDL and many schemas.
  (An early brief proposed per-merchant SQLite files; the implementation uses
  PostgreSQL schemas instead.)
- **Stateless HMAC cancel tokens** — no session store for the cancel flow; the
  token itself proves authorization and encodes expiry.
- **Optimistic concurrency for bookings** — availability is re-checked at write
  time without row locks; acceptable for MVP volumes.
- **In-process tenant-DB cache** — fast slug resolution; must be evicted on
  status change (`evictMerchantDbCache`).
- **Server Components by default** — minimal client JS; Client Components are
  small and marked `"use client"`.

---

## Changelog

### 2026-07-03 — SPRINT-0008: Variant smoke test endpoint (1009679915)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-1009679915` for deployment
  verification and monitoring. Returns `{ ok: true, variant: "1009679915" }` with zero
  dependencies (no database, auth, or external calls).
- Documented new variant in health check endpoints inventory. Continues the established
  pattern for variant endpoints enabling monitoring systems to verify specific application
  variants are deployed and reachable.
- Comprehensive test coverage for variant endpoint including response validation,
  performance metrics, and load testing.

**Implementation details:**
- Follows the lightweight, dependency-free pattern established by previous variant endpoints.
- Implemented as separate route file (`/api/healthz-smoke-1009679915/route.ts`).
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
