# Product

**Multi-tenant, self-serve booking platform for small service businesses.**

Salons, clinics, fitness studios, and consultants sign up, pick a subdomain, add
their staff and services, and get a live branded booking page in minutes — with
full ownership of their customer data and no platform commission.

---

## 1. Problem

Small service businesses need online scheduling but find existing tools
platform-locked, over-priced (commissions + fees), under-customizable, and too
technical to set up. They also lose control of their customer data to the
platform.

## 2. Users

| Tier | Who | Needs |
|------|-----|-------|
| **Merchants** (primary) | Business owners | Manage appointments, staff schedules, pricing; own their data; low technical effort |
| **Staff** (secondary) | Service providers | Individual schedules, capacity limits, leave/off days |
| **Customers** (tertiary) | End bookers | Frictionless booking, self-cancel without calling, instant confirmation |

## 3. Value propositions

1. **Instant setup** — choose a subdomain slug, add services + staff, go live.
2. **Full data isolation** — each merchant gets a dedicated, private database
   schema; customer data is never shared across tenants.
3. **Flexible scheduling** — admins keep full control to handle real-world
   exceptions (reschedule, cancel, block dates, cap concurrency).
4. **Frictionless booking** — guest checkout, no customer registration required.
5. **Automated communication** — transactional email via SendGrid.

## 4. How it works

### Merchant onboarding
- Register with a URL-safe **slug** (e.g. `glamour-studio`), business name,
  owner email, and password.
- Slug uniqueness is checked in real time (`/api/check-slug`); reserved slugs
  (`www`, `api`, `admin`, …) are rejected. Rules: 3–30 chars, lowercase letters,
  digits and hyphens, must start/end alphanumeric.
- On signup the platform **provisions a private PostgreSQL schema**
  (`merchant_<uuid>`) with all tables, seeds default settings/design, and creates
  the owner admin account. Merchant status flips `provisioning → active`.
- The booking page goes live at `{slug}.<platform-domain>`; the admin dashboard
  at `{slug}.<platform-domain>/admin`.

### Public booking page — `{slug}.<domain>`
1. Customer selects a **service** and **staff member**.
2. Available **time slots** are computed from staff weekly availability, blocked
   dates, service duration, slot step, and existing confirmed bookings
   (respecting per-slot max concurrency).
3. Customer fills a short form: email, first name, contact number.
4. Booking is **confirmed immediately** — no email-verification gate (guest
   checkout). A confirmation email is sent with a signed one-click cancel link.

### Booking lifecycle
| State | Trigger | Effect |
|-------|---------|--------|
| **Confirmed** | Customer submits | Slot held, confirmation email sent |
| **Customer-verified** | Customer clicks verify link | CRM flag only — does not gate booking |
| **Customer-cancelled** | Cancel link before start time | Slot released, merchant notified |
| **Admin-rescheduled** | Admin moves booking | Old slot released, new slot confirmed, customer notified |
| **Admin-cancelled** | Admin cancels | Slot released, customer notified |

The cancel link carries an **HMAC-signed token** valid until the appointment
start time; at/after start time it returns "expired." No database lookup is
needed to validate the token.

### Admin dashboard — `{slug}.<domain>/admin`
- **Bookings** — list/detail views; create, cancel, reschedule; changes email
  the customer automatically.
- **Staff** — CRUD profiles (name, photo, contact, visibility); per-staff weekly
  availability; per-slot max concurrent bookings; blocked date ranges (leave/MC).
- **Services** — CRUD with duration and optional price; enable/disable.
- **Customers** — list with booking history and verified/guest status.
- **Discounts** — percentage or fixed-amount codes with expiry, active toggle,
  and usage tracking.
- **Branding** — custom site name and logo/avatar (uploaded via FormData).
- **Design** — customize the public page: headline/subheadline, slot colors
  (available/unavailable, text + background), calendar border width/color/radius,
  and font size.
- **Settings** — slot duration, booking-expiry window (default 15 min),
  display language, and multiple admin users per merchant.
- **Profile** — admin's own name and avatar.

## 5. Scope

**In scope (shipped):** merchant onboarding + schema provisioning, subdomain
routing, admin panel (bookings, staff, services, customers, discounts, branding,
design, settings, profile), public booking flow, signed cancel links,
transactional email, rate-limited auth, dark mode, health check endpoints.

**Out of scope (post-MVP):** embeddable widgets, custom domains, payment
capture at booking, two-way calendar sync (Google/Outlook), native mobile apps,
SMS, waitlists, mandatory email verification, customer self-reschedule.

## 6. Success metrics

- **Launch:** 100% acceptance criteria pass; zero critical security findings;
  booking page loads < 2 s (p95); email delivery > 95%.
- **Adoption:** signup-to-live < 10 min; customer booking completion > 85%;
  admin modification rate < 15%.

## 7. Related docs

- Full product brief & acceptance criteria: `docs/product-mw3-0001-booking-system.md`
- Architecture: `ARCHITECTURE.md`
- Design system: `DESIGN.md`

---

## 8. Operations & monitoring

### Health check endpoints

The platform provides dedicated health check endpoints for monitoring systems and load balancers:

**`/api/health`** — General health check returning `{ status, timestamp }`. Used for basic monitoring and deployment health probes. Suitable for non-critical health monitoring where minimal latency is acceptable.

**`/api/healthz-smoke`** — Lightweight, stateless smoke test for load balancers and monitoring systems. Returns `{ data: { ok: true }, error: null }` with zero dependencies (no database, auth, or external service calls). Designed for frequent polling with target response time < 100ms (typical < 10ms). Follows the platform's standard API envelope pattern.

**Variant smoke test endpoints** — For distributed deployment and A/B testing scenarios, variant-specific health check endpoints allow monitoring systems to verify that specific application code paths are active. These endpoints follow the same lightweight, dependency-free pattern as `/api/healthz-smoke` but add a `variant` field to the response to identify the active build/configuration variant. All variant endpoints return `{ ok: true, variant: "{id}" }` and are public (no authentication required).

**Current deployed variant endpoints:**
- `/healthz-smoke-670096092` — variant "670096092" (SPRINT-0043)
- `/api/healthz-smoke-763023087` — variant "763023087" (SPRINT-0039)
- `/api/healthz-smoke-800427409` — variant "800427409" (SPRINT-0038)
- `/api/healthz-smoke-54367903` — variant "54367903" (SPRINT-0037)
- `/api/healthz-smoke-688707801` — variant "688707801" (SPRINT-0034)
- `/api/healthz-smoke-572185676` — variant "572185676" (SPRINT-0029)
- `/api/healthz-smoke-901947994` — variant "901947994" (SPRINT-0027)
- `/api/healthz-smoke-305070125` — variant "305070125" (SPRINT-0015)
- `/api/healthz-smoke-110428092` — variant "110428092" (SPRINT-0013)
- `/api/healthz-smoke-48842051` — variant "48842051" (SPRINT-0009)
- `/api/healthz-smoke-963602537` — variant "963602537" (SPRINT-0007)
- `/api/healthz-smoke-423911289` — variant "423911289" (SPRINT-0006)
- `/api/healthz-smoke-547016860` — variant "547016860" (SPRINT-0005)
- `/api/healthz-smoke-518124667` — variant "518124667" (SPRINT-0003)
- `/api/healthz-smoke-859005244` — variant "859005244" (SPRINT-0002)
- `/api/healthz-smoke-908186049` — variant "908186049" (SPRINT-0001)

All health check endpoints are **public** (no authentication required) to ensure load balancers and external monitoring systems can reach them without credentials.

---

## Changelog

### 2026-07-09 — SPRINT-0043: Variant smoke test endpoint (670096092)

**Added:**
- New variant-specific health check endpoint `/healthz-smoke-670096092`
- Returns `{ ok: true, variant: "670096092" }` with zero dependencies (no database, auth, or external calls)
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering response structure, performance, and authentication requirements
- Hardcoded variant identifier for deployment verification in smoke testing scenarios

**Implementation pattern:**
- Lightweight, self-contained route handler with target response time < 100ms
- Follows established variant endpoint model from previous sprints
- No external dependencies, environment variable lookups, or conditional logic
- Full TypeScript type safety with strict mode

### 2026-07-09 — SPRINT-0039: Variant smoke test endpoint (763023087)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-763023087`
- Returns `{ ok: true, variant: "763023087" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0038
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-08 — SPRINT-0038: Variant smoke test endpoint (800427409)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-800427409`
- Returns `{ ok: true, variant: "800427409" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0037
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-07 — SPRINT-0037: Variant smoke test endpoint (54367903)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-54367903`
- Returns `{ ok: true, variant: "54367903" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0036
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-07 — SPRINT-0034: Variant smoke test endpoint (688707801)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-688707801`
- Returns `{ ok: true, variant: "688707801" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0033
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-06 — SPRINT-0029: Variant smoke test endpoint (572185676)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-572185676`
- Returns `{ ok: true, variant: "572185676" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0028
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-05 — SPRINT-0027: Variant smoke test endpoint (901947994)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-901947994`
- Returns `{ ok: true, variant: "901947994" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0026
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-05 — SPRINT-0015: Variant smoke test endpoint (305070125)

**Added:**
- New variant-specific health check endpoint `/healthz-smoke-305070125`
- Returns `{ ok: true, variant: "305070125" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0014
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-04 — SPRINT-0013: Variant smoke test endpoint (110428092)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-110428092`
- Returns `{ ok: true, variant: "110428092" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0012
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-04 — SPRINT-0009: Variant smoke test endpoint (48842051)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-48842051`
- Returns `{ ok: true, variant: "48842051" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0008
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-03 — SPRINT-0007: Variant smoke test endpoint (963602537)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-963602537`
- Returns `{ ok: true, variant: "963602537" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0006
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-03 — SPRINT-0006: Variant smoke test endpoint (423911289)

**Added:**
- New variant-specific health check endpoint `/api/healthz-smoke-423911289`
- Returns `{ ok: true, variant: "423911289" }` with zero dependencies
- Public endpoint accessible for monitoring and load balancer integration
- Comprehensive unit tests covering status, response shape, performance, and load scenarios
- Listed in health check endpoints inventory

**Implementation details:**
- Pattern follows established variant endpoint model from SPRINT-0001 through SPRINT-0005
- Lightweight, dependency-free response (no database, auth, or external calls)
- Target response time < 100ms (typical < 10ms)
- Hardcoded variant identifier for deployment verification

### 2026-07-03 — SPRINT-0005: Variant smoke test endpoint (547016860)

**Added:**
- Variant-specific health check endpoints for deployment verification and A/B testing
- `/api/healthz-smoke-{variant}` endpoint pattern supporting variant identification
- First multi-variant implementation: `/api/healthz-smoke-547016860` returning `{ ok: true, variant: "547016860" }`
- Documented variant endpoints in operations section

**Design decisions:**
- Variant endpoints follow the same lightweight, dependency-free pattern as base `/api/healthz-smoke`
- Variant identifier is hardcoded per endpoint (not dynamic)
- Response structure: `{ ok: true, variant: "547016860" }` (no error envelope for smoke tests)
- Each variant is a separate route file enabling independent deployment and updates

### 2026-07-03 — SPRINT-0033: Healthz-smoke endpoint

**Added:**
- Lightweight smoke test endpoint `/api/healthz-smoke` for monitoring and load balancer integration
- Minimal health check returning `{ data: { ok: true }, error: null }` with zero dependencies
- Public endpoint with target response time < 100ms (typical < 10ms)
- Documented in operations and architecture sections
