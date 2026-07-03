# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **multi-tenant booking SaaS** for small service businesses (salons, clinics,
studios). Each merchant signs up, gets a subdomain (`{slug}.<domain>`), and runs
a branded public booking page plus an admin dashboard. Tenants are isolated in
**their own private PostgreSQL schema**.

Read `PRODUCT.md`, `ARCHITECTURE.md`, and `DESIGN.md` at the repo root for the
full picture — they are kept current with the implementation.

> Note: some older docs (`docs/architecture.md`, and prose in this file's history)
> say "Next.js 16" and describe a generic web app or per-merchant SQLite files.
> The real stack is **Next.js 15 / React 19** with **PostgreSQL schema-per-tenant**.
> Trust `package.json` and the source over legacy docs.

## Commands

```bash
npm run dev            # Dev server (localhost:3000)
npm run build          # Production build
npm run start          # Serve the production build
npm run lint           # ESLint — 0 warnings allowed (--max-warnings 0)
npm run typecheck      # tsc --noEmit (strict)
npm run format         # Prettier write
npm run test           # Vitest (watch by default; CI uses run)
npm run test:coverage  # Vitest with v8 coverage
npm run db:generate    # Drizzle: generate migration from schema.ts
npm run db:migrate     # Drizzle: apply migrations to DATABASE_URL
npm run db:studio      # Drizzle Studio

# Makefile wraps the above plus Docker/Postgres:
make setup             # npm ci + copy .env.example → .env
make docker-up         # Start Postgres (5432) + pgAdmin (5050) via docker-compose
make all               # clean, install, lint, typecheck, test, build
```

### Running a single test

```bash
npx vitest run src/lib/slots.test.ts          # one file, single run
npx vitest run -t "returns available slots"    # by test name
npx vitest src/lib/auth/__tests__/session.test.ts  # watch one file
```

Vitest specifics (`vitest.config.ts`): jsdom by default, but files matching
`*session*` and `api/auth/**` run in the **node** environment (jose/JWT needs a
single realm for `Uint8Array`). Uses the **forks** pool for Bun compatibility.
The `@` alias maps to `src/`. Env is loaded from `.env.test`.

## Architecture essentials

The parts you must understand before touching tenant data, routing, or auth —
these span multiple files:

### Multi-tenancy: schema-per-merchant
- **`src/lib/db/platform-schema.ts`** — the only shared table,
  `platform.merchants`, maps a `slug` → private `schema_name` (`merchant_<uuid>`)
  and holds `status` (`provisioning|active|suspended|cancelled`) + owner creds.
- **`src/lib/db/merchant-schema.ts`** — `createMerchantSchema(schemaName)` is a
  **factory** returning Drizzle tables bound to one tenant's schema (admin_users,
  staff, staff_availability, staff_blocked_dates, services, customers, bookings,
  merchant_settings, merchant_design, merchant_branding, discounts).
- **`src/lib/db/get-merchant-db.ts`** — `getMerchantDb(slug)` resolves the tenant
  DB: looks up `schema_name` (only for `active` merchants, else
  `MerchantNotFoundError`), builds a scoped Drizzle instance over the shared `pg`
  pool, and **caches it in-process keyed by slug**. Call `evictMerchantDbCache`
  after a status change.
- **`src/lib/db/provision-merchant.ts`** — `provisionMerchant()` runs at signup:
  in one transaction it inserts the merchant row, `CREATE SCHEMA`, runs **raw DDL**
  for all tenant tables, seeds settings/design, inserts the owner, flips status to
  `active`. Per-merchant tables are created by this DDL at runtime — **not** by
  Drizzle migrations. `dropMerchantSchema()` tears a tenant down.

### Request routing → tenant
- **`src/middleware.ts`** turns hostname into tenant. `extractMerchantSlug()`
  parses `{slug}.<PLATFORM_DOMAIN>` (and `{slug}.localhost` in dev). Page routes
  are rewritten to `/site/{slug}/...`; API + admin paths (`/admin`, `/login`,
  `/register`) are not rewritten and instead receive an `x-merchant-slug` header.
  Reserved slugs and a slug regex (3–30 chars, lowercase/digits/hyphens,
  alphanumeric ends) are enforced here and in `provision-merchant.ts`.

### Booking engine
- **`src/lib/slots.ts`** — `getAvailableSlots()` computes bookable slots from
  staff weekly availability, blocked dates, service duration, slot step, and
  overlapping **confirmed** bookings vs `maxConcurrent`; drops past slots (today:
  now + 30 min buffer). **All time math is UTC.** `isSlotAvailable()` re-checks at
  write time — optimistic, no row lock.

### Auth & tokens
- **`src/lib/auth/session.ts`** — HS256 JWT (`jose`) signed with `AUTH_SECRET`,
  payload `{userId, merchantId, slug, role}`, 7-day httpOnly `SameSite=Strict`
  cookie (`admin_session`). `password.ts` = bcrypt; `admin-guard.ts` guards
  handlers. Admins are per-tenant with roles `owner|admin`.
- **`src/lib/booking/cancel-token.ts`** — stateless HMAC cancel tokens
  (`CANCEL_TOKEN_SECRET`), valid until the appointment start, verified without a
  DB lookup.

### Config
- **`src/lib/env.ts`** — Zod-validated env. Required in prod: `DATABASE_URL`,
  `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET` (≥32 chars; a pre-parse guard `process.exit`s
  if missing in prod), `CANCEL_TOKEN_SECRET`. `next build` tolerates missing
  runtime-only secrets. Import config via `import { env } from '@/lib/env'`.

## Conventions

- **Type safety is strict** — no `any` without justification; complete type
  annotations. `npm run typecheck` and `npm run lint` must both be clean (0
  warnings).
- **Server Components by default**; mark Client Components with `"use client"`
  and keep them small. Zustand only for truly global state; prefer prop drilling
  and the existing React contexts (`lib/{auth,theme,sidebar}-context.tsx`).
- **Validation** — request bodies are validated with Zod schemas in
  `src/lib/validations/`.
- **Styling** — Tailwind + HSL CSS-variable tokens in `src/globals.css`
  (`tailwind.config.ts`), shadcn/ui-style primitives in `components/ui/` using
  `cn()` and `class-variance-authority`. See `DESIGN.md`. Note the public booking
  page is themed per-merchant from the `merchant_design` table, separate from the
  platform token system.
- **DB changes** — edit `src/lib/db/schema.ts` (base/platform), then
  `db:generate` + `db:migrate`. Remember tenant tables also live in
  `merchant-schema.ts` **and** the raw DDL in `provision-merchant.ts` — keep the
  three in sync when changing per-merchant tables.
- **Email** — `src/lib/email/` (SendGrid); sends are a no-op when SendGrid env
  vars are unset, so local dev works without credentials.
