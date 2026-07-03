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
transactional email, rate-limited auth, dark mode, health check endpoints for
monitoring and load balancer integration.

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

## 8. Operations & Monitoring

### Health Check Endpoints

The platform provides minimal health check endpoints for production monitoring and load balancer integration.

**Purpose:** Fast, dependency-free endpoints for orchestration (Kubernetes), load balancers, and monitoring systems (Prometheus, Datadog, New Relic) to verify platform readiness without overhead.

**Available Endpoints:**

| Endpoint | Method | Response | Purpose | Dependencies |
|----------|--------|----------|---------|--------------|
| `/healthz-smoke-908186049` | GET | `{ ok: true, variant: "908186049" }` | Smoke test; variant testing | None |

**Characteristics:**
- Response time: < 10ms (typical)
- HTTP Status: 200 on success
- Content-Type: `application/json`
- Authentication: None required (public)
- Database queries: None
- External calls: None

---

# SPRINT-0002: Health Check Smoke Test Endpoint

**Sprint Goal:** Add a lightweight smoke test endpoint for variant testing and health verification.

**Idea:** VST-0002 — [smoke-178305538782864] /healthz-smoke-908186049 endpoint

## Feature: GET /healthz-smoke-908186049

### Problem & Motivation

Production deployments and testing frameworks require fast, minimal endpoints to verify platform availability with zero overhead. A smoke test endpoint serves as a quick health indicator suitable for:
- **Variant testing** — testing deployments with variant-specific identifiers
- **Load balancers** — minimal HTTP-level readiness probes
- **Integration tests** — quick verification that the platform is responding
- **Incident response** — immediate availability check without dependencies

The endpoint must be self-contained (no dependencies, no auth, no database) to ensure it can respond even under degraded conditions.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/healthz-smoke-908186049` responds with HTTP 200
- Response body: `{ "ok": true, "variant": "908186049" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (should work in any environment)

✅ **Performance**
- Response time < 10ms (typical case)
- No blocking operations
- Suitable for frequent polling

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Test successful 200 response with correct JSON shape
  - Test no authentication required
  - Test response time is minimal
  - Verify both `ok` and `variant` fields present
- Manual verification: endpoint responds correctly via curl

### What's In Scope

- Single GET endpoint only
- Minimal JSON response with both `ok` and `variant` fields
- No database connection or schema checks
- No monitoring/alerting integration (just the endpoint)

### What's Out of Scope (Future Sprints)

- Extended health checks (database connectivity, schema version, queue depth)
- Metrics export (Prometheus format)
- Custom headers (X-Revision, X-Build-Date)
- Multi-probe support (readiness vs. liveness variants)
- Circuit breaker behavior (503 status on failure)
- Variant-specific routing or branching logic

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /healthz-smoke-908186049`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "908186049"
  }
  ```

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-908186049/route.ts`
- Use Next.js `NextResponse.json()` API
- No middleware or auth checks
- Include JSDoc header documenting the endpoint

**Testing Coverage**
- Unit test: response status 200 and JSON structure
- Unit test: verify `ok` and `variant` fields present with correct values
- Unit test: no authentication required
- Unit test: response time validation
- Integration test: end-to-end with dev server
- Manual test: `curl http://localhost:3000/api/healthz-smoke-908186049`

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0008 | EPIC | [smoke-178305538782864] /healthz-smoke-908186049 endpoint | — | VST-0002 | Sprint container |
| VRTX-0009 | FEATURE | Implement GET /healthz-smoke-908186049 endpoint | VRTX-0008 | — | Feature specification |
| VRTX-0010 | TASK | Implement healthz-smoke-908186049 endpoint handler and tests | VRTX-0009 | — | Development work; assigned to engineer |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

## Changelog

### SPRINT-0002 (2026-07-03)
**Added:**
- New health check endpoint: `GET /healthz-smoke-908186049` for variant testing and smoke test verification
- Smoke test endpoint to Operations & Monitoring section (Section 8)
- Self-contained health check returning `{ ok: true, variant: "908186049" }`

**Changed:**
- Section 5 (Scope) updated to include health check endpoints for monitoring and load balancer integration

**Technical:**
- New endpoint file: `src/app/api/healthz-smoke-908186049/route.ts`
- No dependencies, no database, no auth required
- Target response time: < 10ms
- Full test coverage included
