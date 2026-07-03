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
transactional email, rate-limited auth, dark mode.

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

# SPRINT-0033: Healthz-smoke Endpoint

**Sprint Goal:** Add a lightweight health check endpoint for monitoring and load balancer integration.

## Feature: GET /api/healthz-smoke

### Problem & Motivation

Production deployments require fast, lightweight health check endpoints for:
- **Load balancers** — HTTP-level readiness probes
- **Monitoring systems** — Prometheus, Datadog, New Relic scraping
- **Orchestration** — Kubernetes liveness/readiness gates
- **Incident response** — Quick platform status verification

Current `/api/health` endpoint includes timestamps and additional metadata. We need a minimal **smoke test** endpoint that:
- Returns instantly (< 10ms)
- Requires zero dependencies (no database, auth, or external calls)
- Returns a single boolean: `ok: true`
- Supports integration with external monitoring without overhead

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/api/healthz-smoke` responds with HTTP 200
- Response body: `{ "data": { "ok": true }, "error": null }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (should work in any environment)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by load balancers

✅ **API consistency**
- Follows existing envelope pattern: `{ data: T, error: null | {code, message} }`
- Uses Next.js App Router convention: `src/app/api/healthz-smoke/route.ts`
- Includes JSDoc header documenting the endpoint

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Test successful 200 response with correct JSON shape
  - Test no authentication required
  - Test response time
- Manual verification: endpoint responds correctly when server is running

### What's In Scope

- Single GET endpoint only
- Minimal JSON response: `{ ok: true }`
- No database connection or schema checks
- No monitoring/alerting integration (just the endpoint)

### What's Out of Scope (Future Sprints)

- Extended health checks (database connectivity, schema version, queue depth)
- Metrics export (Prometheus format)
- Custom headers (X-Revision, X-Build-Date)
- Multi-probe support (readiness vs. liveness)
- Circuit breaker behavior (503 status on failure)
- Load balancer-specific formats (gRPC health checks, custom protocols)

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "data": { "ok": true },
    "error": null
  }
  ```

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke/route.ts`
- Use Next.js `NextResponse.json()` API
- Follow response envelope convention from existing endpoints
- Include JSDoc header with endpoint description and response codes

**Testing Coverage**
- Unit test: response status and JSON structure
- Unit test: no authentication required
- Unit test: response time validation
- Integration test: end-to-end with dev server
- Manual test: `curl http://localhost:3000/api/healthz-smoke`

---

## Decomposition: EPIC → STORY → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| BKNG-0141 | EPIC | Healthz-smoke endpoint | — | BA-0030 | Sprint container |
| BKNG-0142 | STORY | Implement GET /api/healthz-smoke endpoint | BKNG-0141 | — | Feature specification |
| BKNG-0143 | TASK | Implement healthz-smoke endpoint with tests | BKNG-0142 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.
