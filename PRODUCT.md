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

**Variant smoke test endpoints** — For distributed deployment and A/B testing scenarios, variant-specific health check endpoints allow monitoring systems to verify that specific application code paths are active. These endpoints follow the same lightweight, dependency-free pattern as `/api/healthz-smoke` but add a `variant` field to the response to identify the active build/configuration variant.

Current deployed variants:
- `/api/healthz-smoke-908186049` — Returns `{ ok: true, variant: "908186049" }` (SPRINT-0001)
- `/api/healthz-smoke-859005244` — Returns `{ ok: true, variant: "859005244" }` (SPRINT-0002)
- `/api/healthz-smoke-518124667` — Returns `{ ok: true, variant: "518124667" }` (SPRINT-0003)
- `/api/healthz-smoke-547016860` — Returns `{ ok: true, variant: "547016860" }` (SPRINT-0005)
- `/api/healthz-smoke-423911289` — Returns `{ ok: true, variant: "423911289" }` (SPRINT-0006)
- `/api/healthz-smoke-963602537` — Returns `{ ok: true, variant: "963602537" }` (SPRINT-0007)
- `/api/healthz-smoke-48842051` — Returns `{ ok: true, variant: "48842051" }` (SPRINT-0009)
- `/api/healthz-smoke-110428092` — Returns `{ ok: true, variant: "110428092" }` (SPRINT-0013)
- `/api/healthz-smoke-305070125` — Returns `{ ok: true, variant: "305070125" }` (SPRINT-0015)
- `/api/healthz-smoke-901947994` — Returns `{ ok: true, variant: "901947994" }` (SPRINT-0027)

All health check endpoints are **public** (no authentication required) to ensure load balancers and external monitoring systems can reach them without credentials.

---

# SPRINT-0015: Variant smoke test endpoint (305070125)

**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint for deployment verification.

## Feature: GET /healthz-smoke-305070125

### Problem & Motivation

Distributed deployments require the ability to verify that specific application variants are active and reachable. Variant-specific health check endpoints allow monitoring systems to:
- Verify specific code path deployments are live
- Support canary deployments and A/B testing scenarios
- Enable targeted load balancer routing based on variant
- Provide deployment confidence during progressive rollouts

This endpoint follows the established pattern from previous variant endpoints (SPRINT-0001 through SPRINT-0014) to maintain consistency and operational familiarity.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/healthz-smoke-305070125` responds with HTTP 200
- Response body: `{ ok: true, variant: "305070125" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (self-contained)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by monitoring systems

✅ **Consistency**
- Follows the same implementation pattern as other variant endpoints
- Uses Next.js App Router convention: `src/app/api/healthz-smoke-305070125/route.ts`
- Variant identifier "305070125" is hardcoded in the response
- Public endpoint, no authentication required

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Response status and JSON structure validation
  - Variant field correctness
  - No authentication requirement verification
  - Response time performance verification
  - Load testing (50 concurrent requests)
  - Consistency under repeated calls

### What's In Scope

- Single GET endpoint for variant "305070125"
- Response includes `ok: true` and variant identifier
- No dependencies on database, configuration, or external services
- Comprehensive unit tests with edge case coverage

### What's Out of Scope (Future Sprints)

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants returned in a single response
- Variant-specific feature detection

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /healthz-smoke-305070125`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "305070125"
  }
  ```
- **Content-Type:** `application/json`

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-305070125/route.ts`
- Export async `GET` handler function
- Use Next.js `NextResponse.json()` API
- Response structure: `{ ok: true, variant: "305070125" }`
- Include JSDoc header documenting the endpoint
- No guards, middleware, or conditional logic needed

**Test Coverage**
- Unit test file: `src/app/api/healthz-smoke-305070125/__tests__/route.test.ts`
- Tests should verify:
  - HTTP 200 status code
  - Exact response body: `{ ok: true, variant: "305070125" }`
  - Content-Type header is `application/json`
  - No authentication required
  - Response time < 100ms
  - Consistency under repeated calls
  - Performance under load (50+ concurrent requests)
  - Type safety (ok is boolean true, variant is string)
  - No extra fields in response

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0080 | EPIC | Add /healthz-smoke-305070125 endpoint | — | VST-0011 | Sprint container |
| VRTX-0081 | FEATURE | GET /healthz-smoke-305070125 endpoint | VRTX-0080 | — | Feature specification |
| VRTX-0082 | TASK | Implement /healthz-smoke-305070125 endpoint | VRTX-0081 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

# SPRINT-0013: Variant smoke test endpoint (110428092)

**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint for deployment verification.

## Feature: GET /api/healthz-smoke-110428092

### Problem & Motivation

Distributed deployments require the ability to verify that specific application variants are active and reachable. Variant-specific health check endpoints allow monitoring systems to:
- Verify specific code path deployments are live
- Support canary deployments and A/B testing scenarios
- Enable targeted load balancer routing based on variant
- Provide deployment confidence during progressive rollouts

This endpoint follows the established pattern from previous variant endpoints (SPRINT-0001 through SPRINT-0012) to maintain consistency and operational familiarity.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/api/healthz-smoke-110428092` responds with HTTP 200
- Response body: `{ ok: true, variant: "110428092" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (self-contained)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by monitoring systems

✅ **Consistency**
- Follows the same implementation pattern as other variant endpoints
- Uses Next.js App Router convention: `src/app/api/healthz-smoke-110428092/route.ts`
- Variant identifier "110428092" is hardcoded in the response
- Public endpoint, no authentication required

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Response status and JSON structure validation
  - Variant field correctness
  - No authentication requirement verification
  - Response time performance verification
  - Load testing (50 concurrent requests)
  - Consistency under repeated calls

### What's In Scope

- Single GET endpoint for variant "110428092"
- Response includes `ok: true` and variant identifier
- No dependencies on database, configuration, or external services
- Comprehensive unit tests with edge case coverage

### What's Out of Scope (Future Sprints)

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants returned in a single response
- Variant-specific feature detection

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke-110428092`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "110428092"
  }
  ```
- **Content-Type:** `application/json`

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-110428092/route.ts`
- Export async `GET` handler function
- Use Next.js `NextResponse.json()` API
- Response structure: `{ ok: true, variant: "110428092" }`
- Include JSDoc header documenting the endpoint
- No guards, middleware, or conditional logic needed

**Test Coverage**
- Unit test file: `src/app/api/healthz-smoke-110428092/__tests__/route.test.ts`
- Tests should verify:
  - HTTP 200 status code
  - Exact response body: `{ ok: true, variant: "110428092" }`
  - Content-Type header is `application/json`
  - No authentication required
  - Response time < 100ms
  - Consistency under repeated calls
  - Performance under load (50+ concurrent requests)
  - Type safety (ok is boolean true, variant is string)
  - No extra fields in response

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0067 | EPIC | Add /healthz-smoke-110428092 endpoint | — | VST-0010 | Sprint container |
| VRTX-0070 | FEATURE | Implement /healthz-smoke-110428092 GET endpoint | VRTX-0067 | — | Feature specification |
| VRTX-0071 | TASK | Implement and test /healthz-smoke-110428092 endpoint | VRTX-0070 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

# SPRINT-0009: Variant smoke test endpoint (48842051)

**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint for deployment verification.

## Feature: GET /api/healthz-smoke-48842051

### Problem & Motivation

Distributed deployments require the ability to verify that specific application variants are active and reachable. Variant-specific health check endpoints allow monitoring systems to:
- Verify specific code path deployments are live
- Support canary deployments and A/B testing scenarios
- Enable targeted load balancer routing based on variant
- Provide deployment confidence during progressive rollouts

This endpoint follows the established pattern from previous variant endpoints (SPRINT-0001 through SPRINT-0008) to maintain consistency and operational familiarity.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/api/healthz-smoke-48842051` responds with HTTP 200
- Response body: `{ ok: true, variant: "48842051" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (self-contained)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by monitoring systems

✅ **Consistency**
- Follows the same implementation pattern as other variant endpoints
- Uses Next.js App Router convention: `src/app/api/healthz-smoke-48842051/route.ts`
- Variant identifier "48842051" is hardcoded in the response
- Public endpoint, no authentication required

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Response status and JSON structure validation
  - Variant field correctness
  - No authentication requirement verification
  - Response time performance verification
  - Load testing (50 concurrent requests)
  - Consistency under repeated calls

### What's In Scope

- Single GET endpoint for variant "48842051"
- Response includes `ok: true` and variant identifier
- No dependencies on database, configuration, or external services
- Comprehensive unit tests with edge case coverage

### What's Out of Scope (Future Sprints)

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants returned in a single response
- Variant-specific feature detection

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke-48842051`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "48842051"
  }
  ```
- **Content-Type:** `application/json`

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-48842051/route.ts`
- Export async `GET` handler function
- Use Next.js `NextResponse.json()` API
- Response structure: `{ ok: true, variant: "48842051" }`
- Include JSDoc header documenting the endpoint
- No guards, middleware, or conditional logic needed

**Test Coverage**
- Unit test file: `src/app/api/healthz-smoke-48842051/__tests__/route.test.ts`
- Tests should verify:
  - HTTP 200 status code
  - Exact response body: `{ ok: true, variant: "48842051" }`
  - Content-Type header is `application/json`
  - No authentication required
  - Response time < 100ms
  - Consistency under repeated calls
  - Performance under load (50+ concurrent requests)
  - Type safety (ok is boolean true, variant is string)
  - No extra fields in response

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0054 | EPIC | Add /healthz-smoke-48842051 endpoint | — | VST-0009 | Sprint container |
| VRTX-0055 | FEATURE | Implement /healthz-smoke-48842051 GET endpoint | VRTX-0054 | — | Feature specification |
| VRTX-0056 | TASK | Implement and test /healthz-smoke-48842051 endpoint | VRTX-0055 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

# SPRINT-0007: Variant smoke test endpoint (963602537)

**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint for deployment verification.

## Feature: GET /api/healthz-smoke-963602537

### Problem & Motivation

Distributed deployments require the ability to verify that specific application variants are active and reachable. Variant-specific health check endpoints allow monitoring systems to:
- Verify specific code path deployments are live
- Support canary deployments and A/B testing scenarios
- Enable targeted load balancer routing based on variant
- Provide deployment confidence during progressive rollouts

This endpoint follows the established pattern from previous variant endpoints (SPRINT-0001 through SPRINT-0006) to maintain consistency and operational familiarity.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/api/healthz-smoke-963602537` responds with HTTP 200
- Response body: `{ ok: true, variant: "963602537" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (self-contained)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by monitoring systems

✅ **Consistency**
- Follows the same implementation pattern as other variant endpoints
- Uses Next.js App Router convention: `src/app/api/healthz-smoke-963602537/route.ts`
- Variant identifier "963602537" is hardcoded in the response
- Public endpoint, no authentication required

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Response status and JSON structure validation
  - Variant field correctness
  - No authentication requirement verification
  - Response time performance verification
  - Load testing (50 concurrent requests)
  - Consistency under repeated calls

### What's In Scope

- Single GET endpoint for variant "963602537"
- Response includes `ok: true` and variant identifier
- No dependencies on database, configuration, or external services
- Comprehensive unit tests with edge case coverage

### What's Out of Scope (Future Sprints)

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants returned in a single response
- Variant-specific feature detection

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke-963602537`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "963602537"
  }
  ```
- **Content-Type:** `application/json`

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-963602537/route.ts`
- Export async `GET` handler function
- Use Next.js `NextResponse.json()` API
- Response structure: `{ ok: true, variant: "963602537" }`
- Include JSDoc header documenting the endpoint
- No guards, middleware, or conditional logic needed

**Test Coverage**
- Unit test file: `src/app/api/healthz-smoke-963602537/__tests__/route.test.ts`
- Tests should verify:
  - HTTP 200 status code
  - Exact response body: `{ ok: true, variant: "963602537" }`
  - Content-Type header is `application/json`
  - No authentication required
  - Response time < 100ms
  - Consistency under repeated calls
  - Performance under load (50+ concurrent requests)
  - Type safety (ok is boolean true, variant is string)
  - No extra fields in response

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0033 | EPIC | Add /healthz-smoke-963602537 endpoint | — | VST-0007 | Sprint container |
| VRTX-0036 | FEATURE | Implement /healthz-smoke-963602537 GET endpoint | VRTX-0033 | — | Feature specification |
| VRTX-0037 | TASK | Implement and test /healthz-smoke-963602537 endpoint | VRTX-0036 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

# SPRINT-0006: Variant smoke test endpoint (423911289)

**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint for deployment verification.

## Feature: GET /api/healthz-smoke-423911289

### Problem & Motivation

Distributed deployments require the ability to verify that specific application variants are active and reachable. Variant-specific health check endpoints allow monitoring systems to:
- Verify specific code path deployments are live
- Support canary deployments and A/B testing scenarios
- Enable targeted load balancer routing based on variant
- Provide deployment confidence during progressive rollouts

This endpoint follows the established pattern from previous variant endpoints (SPRINT-0001 through SPRINT-0005) to maintain consistency and operational familiarity.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/api/healthz-smoke-423911289` responds with HTTP 200
- Response body: `{ ok: true, variant: "423911289" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (self-contained)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by monitoring systems

✅ **Consistency**
- Follows the same implementation pattern as other variant endpoints
- Uses Next.js App Router convention: `src/app/api/healthz-smoke-423911289/route.ts`
- Variant identifier "423911289" is hardcoded in the response
- Public endpoint, no authentication required

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Response status and JSON structure validation
  - Variant field correctness
  - No authentication requirement verification
  - Response time performance verification
  - Load testing (50 concurrent requests)
  - Consistency under repeated calls

### What's In Scope

- Single GET endpoint for variant "423911289"
- Response includes `ok: true` and variant identifier
- No dependencies on database, configuration, or external services
- Comprehensive unit tests with edge case coverage

### What's Out of Scope (Future Sprints)

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants returned in a single response
- Variant-specific feature detection

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke-423911289`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "423911289"
  }
  ```
- **Content-Type:** `application/json`

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-423911289/route.ts`
- Export async `GET` handler function
- Use Next.js `NextResponse.json()` API
- Response structure: `{ ok: true, variant: "423911289" }`
- Include JSDoc header documenting the endpoint
- No guards, middleware, or conditional logic needed

**Test Coverage**
- Unit test file: `src/app/api/healthz-smoke-423911289/__tests__/route.test.ts`
- Tests should verify:
  - HTTP 200 status code
  - Exact response body: `{ ok: true, variant: "423911289" }`
  - Content-Type header is `application/json`
  - No authentication required
  - Response time < 100ms
  - Consistency under repeated calls
  - Performance under load (50+ concurrent requests)
  - Type safety (ok is boolean true, variant is string)
  - No extra fields in response

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0028 | EPIC | Add /healthz-smoke-423911289 endpoint | — | VST-0006 | Sprint container |
| VRTX-0029 | FEATURE | Implement /healthz-smoke-423911289 GET endpoint | VRTX-0028 | — | Feature specification |
| VRTX-0030 | TASK | Implement and test /healthz-smoke-423911289 endpoint | VRTX-0029 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

# SPRINT-0027: Variant smoke test endpoint (901947994)

**Sprint Goal:** Add a lightweight variant-specific smoke test endpoint for deployment verification.

## Feature: GET /api/healthz-smoke-901947994

### Problem & Motivation

Distributed deployments require the ability to verify that specific application variants are active and reachable. Variant-specific health check endpoints allow monitoring systems to:
- Verify specific code path deployments are live
- Support canary deployments and A/B testing scenarios
- Enable targeted load balancer routing based on variant
- Provide deployment confidence during progressive rollouts

This endpoint follows the established pattern from previous variant endpoints (SPRINT-0001 through SPRINT-0026) to maintain consistency and operational familiarity.

### Acceptance Criteria

✅ **Endpoint exists and responds**
- GET `/api/healthz-smoke-901947994` responds with HTTP 200
- Response body: `{ ok: true, variant: "901947994" }`
- Content-Type: `application/json`

✅ **Self-contained (no dependencies)**
- No database queries
- No authentication/authorization checks
- No external service calls
- No environment variable lookups (self-contained)

✅ **Performance**
- Response time < 100ms (typical < 10ms)
- No blocking operations
- Suitable for frequent polling by monitoring systems

✅ **Consistency**
- Follows the same implementation pattern as other variant endpoints
- Uses Next.js App Router convention: `src/app/api/healthz-smoke-901947994/route.ts`
- Variant identifier "901947994" is hardcoded in the response
- Public endpoint, no authentication required

✅ **Code quality**
- TypeScript: strict type safety, zero implicit `any`
- Linting: `npm run lint` passes with zero warnings
- Type checking: `npm run typecheck` passes
- Testing: comprehensive test coverage with Vitest
  - Response status and JSON structure validation
  - Variant field correctness
  - No authentication requirement verification
  - Response time performance verification
  - Load testing (50 concurrent requests)
  - Consistency under repeated calls

### What's In Scope

- Single GET endpoint for variant "901947994"
- Response includes `ok: true` and variant identifier
- No dependencies on database, configuration, or external services
- Comprehensive unit tests with edge case coverage

### What's Out of Scope (Future Sprints)

- Dynamic variant detection from environment variables
- Variant registry or metadata endpoint
- Multiple variants returned in a single response
- Variant-specific feature detection

### Technical Requirements

**Endpoint Specification**
- **Path:** `GET /api/healthz-smoke-901947994`
- **Authentication:** None (public)
- **Response Status:** 200 on success
- **Response Body:**
  ```json
  {
    "ok": true,
    "variant": "901947994"
  }
  ```
- **Content-Type:** `application/json`

**Implementation Pattern**
- Location: `src/app/api/healthz-smoke-901947994/route.ts`
- Export async `GET` handler function
- Use Next.js `NextResponse.json()` API
- Response structure: `{ ok: true, variant: "901947994" }`
- Include JSDoc header documenting the endpoint
- No guards, middleware, or conditional logic needed

**Test Coverage**
- Unit test file: `src/app/api/healthz-smoke-901947994/__tests__/route.test.ts`
- Tests should verify:
  - HTTP 200 status code
  - Exact response body: `{ ok: true, variant: "901947994" }`
  - Content-Type header is `application/json`
  - No authentication required
  - Response time < 100ms
  - Consistency under repeated calls
  - Performance under load (50+ concurrent requests)
  - Type safety (ok is boolean true, variant is string)
  - No extra fields in response

### Decomposition: EPIC → FEATURE → TASK

| Ticket | Type | Title | Parent | Idea | Notes |
|--------|------|-------|--------|------|-------|
| VRTX-0130 | EPIC | Add /healthz-smoke-901947994 endpoint | — | VST-0019 | Sprint container |
| VRTX-0131 | FEATURE | Implement /healthz-smoke-901947994 GET endpoint | VRTX-0130 | — | Feature specification |
| VRTX-0132 | TASK | Implement and test /healthz-smoke-901947994 endpoint | VRTX-0131 | — | Development work |

Each ticket includes full acceptance criteria matching this PRODUCT.md.

---

## Changelog

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
