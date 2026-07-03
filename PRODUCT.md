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
SMS, waitlists, mandatory email verification, customer self-reschedule, extended
health probes (database connectivity, schema version, queue depth).

## 6. Success metrics

- **Launch:** 100% acceptance criteria pass; zero critical security findings;
  booking page loads < 2 s (p95); email delivery > 95%; health check endpoints
  respond < 100ms (typical < 10ms).
- **Adoption:** signup-to-live < 10 min; customer booking completion > 85%;
  admin modification rate < 15%.

## 7. Related docs

- Full product brief & acceptance criteria: `docs/product-mw3-0001-booking-system.md`
- Architecture: `ARCHITECTURE.md`
- Design system: `DESIGN.md`

---

## 8. Operations & Monitoring

### Health Check Endpoints

The platform provides lightweight health check endpoints for monitoring, load balancers,
and orchestration systems.

#### GET /api/healthz-smoke — Standard Health Check

**Purpose:** General platform health status for load balancers, monitoring systems
(Prometheus, Datadog, New Relic), and Kubernetes readiness probes.

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
- **Response Time:** < 100ms (typical < 10ms)

**Characteristics**
- Self-contained (no database, auth, or external calls)
- Follows standard API response envelope pattern
- No dependencies; works in any environment
- Suitable for frequent polling by load balancers

#### GET /api/healthz-smoke-{variant} — Variant Health Check

**Purpose:** Variant-specific health check endpoints for A/B testing, canary deployments,
and version-specific monitoring. Allows independent tracking of different deployment
variants.

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke-{variant}` (e.g., `/api/healthz-smoke-859005244`)
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "{variant}"
  }
  ```
  Example: `{ "ok": true, "variant": "859005244" }`
- **Response Time:** < 100ms (typical < 10ms)

**Characteristics**
- Self-contained (no database, auth, or external calls)
- Simple direct JSON response (not wrapped in envelope)
- No dependencies; works in any environment
- Variant ID is hardcoded in the response for identification
- Suitable for monitoring specific deployment versions independently

**Supported Variants (Current)**
- `/api/healthz-smoke-859005244` — Primary variant endpoint

---

## Decomposition: EPIC → FEATURE → TASK

Health check endpoints are decomposed as follows:

| Ticket | Type | Title | Parent | Sprint |
|--------|------|-------|--------|--------|
| VRTX-0013 | EPIC | Add /healthz-smoke-859005244 variant endpoint | — | SPRINT-0003 |
| VRTX-0014 | FEATURE | Implement /healthz-smoke-859005244 endpoint | VRTX-0013 | SPRINT-0003 |
| VRTX-0015 | TASK | Create /healthz-smoke-859005244 route handler | VRTX-0014 | SPRINT-0003 |

Each ticket's acceptance criteria are aligned with this PRODUCT.md specification.

---

## Changelog

### SPRINT-0003 (2026-07-03)

**Added:**
- New variant health check endpoint: `GET /api/healthz-smoke-{variant}`
  - Initial variant: `/api/healthz-smoke-859005244`
  - Returns: `{ ok: true, variant: "859005244" }`
  - Use case: Version-specific monitoring and canary deployment tracking
  - Complements existing `/api/healthz-smoke` standard health check endpoint

**Changed:**
- Updated "Scope" section to explicitly include health check endpoints in shipped features
- Enhanced success metrics to include health check response time requirement (< 100ms)

**Notes:**
- No breaking changes to existing endpoints
- Variant endpoints provide independent monitoring for deployment variants
- Supports A/B testing and progressive rollout strategies
