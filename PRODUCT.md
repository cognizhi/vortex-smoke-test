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

- Full product brief: `docs/product-mw3-0001-booking-system.md`
- Architecture: `ARCHITECTURE.md`
- Design system: `DESIGN.md`

---

## 8. Operations & monitoring

### Health check endpoints

The platform provides health check endpoints for monitoring systems and load balancers:

**`/api/health`** — General health check returning `{ status, timestamp }`. Used for basic monitoring and deployment health probes. Suitable for non-critical health monitoring where minimal latency is acceptable.

**`/api/healthz-smoke`** — Lightweight, stateless smoke test for load balancers and monitoring systems. Returns `{ data: { ok: true }, error: null }` with zero dependencies (no database, auth, or external service calls). Designed for frequent polling with target response time < 100ms (typical < 10ms). Follows the platform's standard API envelope pattern.

**Variant smoke test endpoints** — For distributed deployment and A/B testing scenarios, variant-specific health check endpoints allow monitoring systems to verify that specific application code paths are active. These endpoints follow the same lightweight, dependency-free pattern as `/api/healthz-smoke` but add a `variant` field to the response to identify the active build/configuration variant. Public endpoints, no authentication required.

All health check endpoints are **public** (no authentication required) to ensure load balancers and external monitoring systems can reach them without credentials.

---

## Changelog

### 2026-07-09 — SPRINT-0045: Product documentation sprint

**Overview:** Sprint focused on establishing and maintaining holistic product documentation across PRODUCT.md, ARCHITECTURE.md, and DESIGN.md.

**Changes:**
- Refactored PRODUCT.md to be a true holistic, current target-state product specification (WHAT & WHY only)
- Removed sprint-specific implementation details from PRODUCT.md (those belong in ARCHITECTURE.md/DESIGN.md)
- Consolidated health check endpoints documentation: `/api/health`, `/api/healthz-smoke`, and variant endpoints now documented as established operational capabilities
- Established clear documentation boundaries: PRODUCT.md focuses on product requirements and user value; ARCHITECTURE.md covers technical implementation; DESIGN.md covers visual design
- Updated ARCHITECTURE.md and DESIGN.md changelogs to reflect documentation normalization

**Scope:**
- Documentation rationalization only; no new product features
- Maintains all existing capabilities documented in previous sprints (health check endpoints, health variants, core booking system)

### 2026-07-09 — SPRINT-0039: Variant smoke test endpoint (763023087)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-763023087` for deployment verification and monitoring. Returns `{ ok: true, variant: "763023087" }` with zero dependencies.

### 2026-07-08 — SPRINT-0038: Variant smoke test endpoint (800427409)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-800427409` for deployment verification and monitoring. Returns `{ ok: true, variant: "800427409" }` with zero dependencies.

### 2026-07-07 — SPRINT-0037: Variant smoke test endpoint (54367903)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-54367903` for deployment verification and monitoring. Returns `{ ok: true, variant: "54367903" }` with zero dependencies.

### 2026-07-07 — SPRINT-0034: Variant smoke test endpoint (688707801)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-688707801` for deployment verification and monitoring. Returns `{ ok: true, variant: "688707801" }` with zero dependencies.

### 2026-07-06 — SPRINT-0029: Variant smoke test endpoint (572185676)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-572185676` for deployment verification and monitoring. Returns `{ ok: true, variant: "572185676" }` with zero dependencies.

### 2026-07-05 — SPRINT-0027: Variant smoke test endpoint (901947994)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-901947994` for deployment verification and monitoring. Returns `{ ok: true, variant: "901947994" }` with zero dependencies.

### 2026-07-05 — SPRINT-0015: Variant smoke test endpoint (305070125)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-305070125` for deployment verification and monitoring. Returns `{ ok: true, variant: "305070125" }` with zero dependencies.

### 2026-07-04 — SPRINT-0013: Variant smoke test endpoint (110428092)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-110428092` for deployment verification and monitoring. Returns `{ ok: true, variant: "110428092" }` with zero dependencies.

### 2026-07-04 — SPRINT-0009: Variant smoke test endpoint (48842051)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-48842051` for deployment verification and monitoring. Returns `{ ok: true, variant: "48842051" }` with zero dependencies.

### 2026-07-03 — SPRINT-0007: Variant smoke test endpoint (963602537)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-963602537` for deployment verification and monitoring. Returns `{ ok: true, variant: "963602537" }` with zero dependencies.

### 2026-07-03 — SPRINT-0006: Variant smoke test endpoint (423911289)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-423911289` for deployment verification and monitoring. Returns `{ ok: true, variant: "423911289" }` with zero dependencies.

### 2026-07-03 — SPRINT-0005: Variant smoke test endpoint infrastructure

**Added:**
- Initial variant-specific health check endpoint pattern with `/api/healthz-smoke-547016860`.
- Foundation for deployment verification and A/B testing scenarios.

### 2026-07-03 — SPRINT-0033: Base health endpoints

**Added:**
- Core health check endpoints: `/api/health` and `/api/healthz-smoke`.
- Lightweight smoke test endpoint for monitoring and load balancer integration.
