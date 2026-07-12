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

**Variant smoke test endpoints** — For distributed deployment and A/B testing scenarios, variant-specific health check endpoints allow monitoring systems to verify that specific application code paths are active. These endpoints follow the same lightweight, dependency-free pattern as `/api/healthz-smoke` but add a `variant` field to the response to identify the active build/configuration variant. Public endpoints, no authentication required. Current variants include:
- Standard variants: `778162394` (endpoints a/b/c), `85511011`, `28611693`, `453353908`, `992377535`, `96685`, and many others
- Bugfix test variants: `254027906`, `382671714`, `432732268`, `407985318`, and others

All health check endpoints are **public** (no authentication required) to ensure load balancers and external monitoring systems can reach them without credentials.

---

## Changelog

### 2026-07-12 — SPRINT-0059: Three independent variant health check endpoints (778162394)

**Added:**
- Three independent health check endpoints for variant 778162394:
  - `/api/healthz-smoke-778162394-a`
  - `/api/healthz-smoke-778162394-b`
  - `/api/healthz-smoke-778162394-c`
- Each endpoint returns `{ ok: true, variant: "778162394" }` with zero dependencies
- Lightweight, stateless health checks suitable for high-frequency polling (< 100ms response time)
- Public endpoints with no authentication required

**Product value:**
- Operations teams can verify variant 778162394 is deployed and reachable across multiple independent paths
- Supports distributed deployment scenarios and smoke test verification
- Enables comprehensive monitoring of variant-specific application builds
- Three independent endpoints allow redundancy and enable canary deployment verification strategies

**Technical scope:**
- Three new health check endpoints with full test coverage (100% coverage per endpoint)
- Zero breaking changes; all existing functionality unchanged
- Follows established pattern from existing 47+ variant endpoints

### 2026-07-11 — SPRINT-0055: Bugfix planning & health check endpoints (254027906, 382671714)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-bugfix-254027906` for deployment verification and monitoring. Returns `{ ok: true, variant: "254027906" }` with zero dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-bugfix2-382671714` for deployment verification and monitoring. Returns `{ ok: true, variant: "382671714" }` with zero dependencies (no database, auth, or external calls).
- Comprehensive bugfix planning and defect analysis documenting three critical issues:
  - P0 (High): Hardcoded session in branding reset endpoint (VRTX-0292)
  - P1 (Medium): Missing merchantNotes column in bookings table (VRTX-0293)
  - P2 (Low-Medium): Duplicated cancel route logic (VRTX-0294)

**Product value:**
- Operations teams can verify the bugfix variants (254027906, 382671714) are deployed and reachable in production
- Supports distributed deployment scenarios and smoke test verification
- Enables comprehensive monitoring of bugfix-specific application builds
- Establishes roadmap for fixing three identified defects in future sprints

**Technical scope:**
- Two new health check endpoints with full test coverage (14 tests each, 100% passing)
- Defect reproduction and root cause analysis with detailed fix plans
- Zero breaking changes; all existing functionality unchanged

### 2026-07-11 — SPRINT-0054: Variant smoke test endpoint (85511011)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-85511011` for deployment verification and monitoring. Returns `{ ok: true, variant: "85511011" }` with zero dependencies (no database, auth, or external calls).
- Extends deployment verification system enabling operations teams to monitor variant 85511011 in production.
- Continues the established pattern for variant endpoints supporting safe canary deployments and traffic management strategies.

**Product value:**
- Operations teams can verify the 85511011 variant is deployed and reachable in production
- Supports distributed deployment scenarios and smoke test verification
- Enables comprehensive monitoring of variant-specific application builds

### 2026-07-11 — SPRINT-0053: Variant smoke test endpoint (28611693)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-28611693` for deployment verification and monitoring. Returns `{ ok: true, variant: "28611693" }` with zero dependencies (no database, auth, or external calls).
- Extends deployment verification system enabling operations teams to monitor variant 28611693 in production.
- Continues the established pattern for variant endpoints supporting safe canary deployments and traffic management strategies.

**Product value:**
- Operations teams can verify the 28611693 variant is deployed and reachable in production
- Supports distributed deployment scenarios and smoke test verification
- Enables comprehensive monitoring of variant-specific application builds

### 2026-07-10 — SPRINT-0052: Bugfix smoke test health check endpoints (432732268, 407985318)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-bugfix-432732268` for deployment verification and monitoring. Returns `{ ok: true, variant: "432732268" }` with zero dependencies (no database, auth, or external calls).
- Variant-specific health check endpoint `/api/healthz-smoke-bugfix2-407985318` for deployment verification and monitoring. Returns `{ ok: true, variant: "407985318" }` with zero dependencies (no database, auth, or external calls).
- Extends deployment verification system enabling operations teams to monitor bugfix smoke test variants in production.
- Continues the established pattern for variant endpoints supporting safe canary deployments and traffic management strategies.

**Product value:**
- Operations teams can verify the bugfix variants (432732268, 407985318) are deployed and reachable in production
- Supports distributed deployment scenarios and smoke test verification
- Enables comprehensive monitoring of bugfix-specific application variants
- Provides rapid feedback on deployment success without external dependencies

### 2026-07-10 — SPRINT-0051: Variant smoke test endpoint (453353908)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-453353908` for deployment verification and monitoring. Returns `{ ok: true, variant: "453353908" }` with zero dependencies (no database, auth, or external calls).
- Extends deployment verification system enabling operations teams to monitor variant 453353908 in production.
- Continues the established pattern for variant endpoints supporting safe canary deployments and traffic management strategies.

**Product value:**
- Operations teams can verify the 453353908 variant is deployed and reachable in production
- Supports distributed deployment scenarios and A/B testing
- Enables comprehensive monitoring of variant-specific application builds

### 2026-07-09 — SPRINT-0050: Variant smoke test endpoint (992377535)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-992377535` for deployment verification and monitoring. Returns `{ ok: true, variant: "992377535" }` with zero dependencies (no database, auth, or external calls).
- Extends deployment verification system enabling operations teams to monitor variant 992377535 in production.
- Continues the established pattern for variant endpoints supporting safe canary deployments and traffic management strategies.

**Product value:**
- Operations teams can verify the 992377535 variant is deployed and reachable in production
- Supports distributed deployment scenarios and A/B testing
- Enables comprehensive monitoring of variant-specific application builds

### 2026-07-09 — SPRINT-0048: Variant smoke test endpoint (96685)

**Added:**
- Variant-specific health check endpoint `/api/healthz-smoke-96685` for deployment verification and monitoring. Returns `{ ok: true, variant: "96685" }` with zero dependencies (no database, auth, or external calls).
- Extends deployment verification system enabling operations teams to monitor specific application variants in production.
- Comprehensive test coverage for variant endpoint including response validation.

**Product value:**
- Operations teams can verify the 96685 variant is deployed and reachable in production
- Supports safe canary deployments and traffic management strategies
- Enables comprehensive monitoring across complex deployment topologies

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

### 2026-07-09 — SPRINT-0039 through SPRINT-0005: Variant deployment verification capabilities

**Overview:** Series of sprints extending deployment verification infrastructure to support monitoring of multiple application variants simultaneously.

**Added (product capability):**
- Extended deployment verification system enabling operations teams to monitor specific application variants in production
- Variant-specific monitoring endpoints for canary deployments and A/B testing scenarios
- Continuous enhancement of deployment monitoring infrastructure (15 variants deployed across SPRINT-0005 through SPRINT-0039)

**Product value:**
- Operations teams can verify specific application builds are deployed and reachable in production
- Supports safe canary deployments and traffic management strategies
- Enables comprehensive monitoring across complex deployment topologies

### 2026-07-03 — SPRINT-0033: Base health monitoring endpoints

**Added (product capability):**
- Core health monitoring endpoints for platform operations and infrastructure monitoring
- General system health status reporting
- Lightweight smoke test capability for load balancers and automated monitoring systems
- Zero-dependency health checks ensuring monitoring works even when other systems fail

**Product value:**
- Operations teams have reliable, dependency-free health checks for load balancers and monitoring systems
- Platform uptime and health visibility
- Fast response times enable frequent automated monitoring without performance impact
