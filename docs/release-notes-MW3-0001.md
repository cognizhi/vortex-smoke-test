# Release Notes — MW3-0001: Self-Serve Booking System

**Release branch**: `fix/crit02-auth-secret-required`  
**Merge target**: `main`  
**Date**: 2026-06-08  
**Stage**: Release Candidate

---

## What This Release Does

This release ships the complete self-serve booking system for small service businesses. Merchants can register in minutes, configure their staff and services, and go live with a fully branded booking page. Customers self-serve end-to-end with no friction — booking is instant on form submission, with a signed cancel link in every confirmation email.

---

## New Features

### Merchant Onboarding
- Merchant registration with real-time subdomain slug availability check
- Dedicated PostgreSQL schema provisioned automatically on successful signup
- Booking page immediately live at `<slug>.platform.com` via wildcard DNS + Caddy SSL

### Admin Dashboard
- Calendar view and list view for all bookings
- Create, edit, cancel, and reschedule bookings directly from the dashboard
- Admin reschedule: releases the original slot, confirms the new slot, and emails the customer automatically — no customer re-confirmation needed

### Staff Management
- Full CRUD for employee profiles (name, photo, contact)
- Weekly availability schedules (per day, configurable start/end time and max concurrent bookings)
- Block out leave, sick days, and off days with date-range blocks

### Services Management
- Full CRUD for services with price and duration fields
- Services with future confirmed bookings are protected from deletion

### Customer Management
- Customer list with full booking history
- Email verification status tracking (verified vs. unverified/guest)
- Admin can resend confirmation or send offer emails via SendGrid

### Design Customisation
- Colour pickers for available/unavailable time slots
- Calendar controls: border, border-radius, font size

### Settings
- Multiple admin users per merchant account
- Configurable booking expiry window (default: 15 minutes)
- Display language setting

### Customer-Facing Booking Page (`<slug>.platform.com`)
- Multi-step flow: select staff → select service → pick time slot → fill form
- Time slots filter by staff availability AND service duration
- Guest checkout — booking confirmed immediately on form submission (no email verification gate)
- Confirmation email with unique HMAC-signed cancel link (SendGrid)
- Merchant notified by email on every new booking (SendGrid)

### Booking Lifecycle & Cancellation
- **Customer self-cancel**: Signed link in confirmation email, valid up to the appointment start time; expired after the appointment begins (clear "booking already passed" message shown)
- **Admin cancel**: Slot released immediately
- **Admin reschedule**: Original slot released, new slot confirmed, rescheduling email sent to customer
- Cancellation success page confirms only — no "Book again" prompt
- Merchant receives cancellation notification email on every customer-initiated cancel

---

## Security Fixes (from QA gate)

| ID | Severity | Summary |
|----|----------|---------|
| CRIT-01 | Critical | Cancellation emails now fire correctly on every customer cancel |
| CRIT-02 | Critical | `AUTH_SECRET` is required at startup; server exits with `[FATAL]` if absent in production (prevents silent JWT 500 errors and JWT forgery) |
| HIGH-01 | High | Merchant and customer data HTML-escaped in all email templates (XSS prevention) |
| HIGH-02 | High | Caddy strips forged `X-Merchant-Slug` headers on all inbound requests (tenant impersonation prevention) |

---

## Bug Fixes (from QA gate)

| ID | Summary |
|----|---------|
| MED-01 | Booking reschedule now records `rescheduledFromId` audit trail |
| MED-02 | `bookingExpiryMinutes` now correctly reads from merchant settings |
| LOW-01 | Slot availability calculation fixed for edge cases |

---

## Build Fixes (Release Candidate)

- Updated 7 dynamic API route handlers to use `Promise<{id}>` params (Next.js 15 breaking change)
- Wrapped login page `useSearchParams()` in `<Suspense>` boundary (Next.js 15 requirement)
- `env.ts` startup guard now uses `NEXT_PHASE` to avoid aborting `next build` when runtime secrets are not present in the build environment; the fail-fast production guard is preserved at actual server startup

---

## CI Gate Results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint . --max-warnings 0` | ✅ 0 warnings |
| `vitest run` | ✅ 535/535 tests passed (37 test files) |
| `next build` | ✅ Build succeeded |

---

## Deployment Notes

### Required Environment Variables (set in deployment platform before `next start`)

```bash
DATABASE_URL=postgresql://user:password@host:5432/bookingplatform
NEXT_PUBLIC_APP_URL=https://platform.com
AUTH_SECRET=<min 32 hex chars — generate: openssl rand -hex 32>
CANCEL_TOKEN_SECRET=<min 32 hex chars — generate: openssl rand -hex 32>
SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=noreply@platform.com
PLATFORM_DOMAIN=platform.com
```

### Infrastructure

- **Reverse proxy**: Caddy with wildcard `*.platform.com` — see `Caddyfile`
- **DNS**: Wildcard A record `*.platform.com → <server IP>` — see `docs/infrastructure-dns-ssl.md`
- **Database**: PostgreSQL — the platform schema (merchants table) is created on first `db:migrate`. Each merchant gets their own schema provisioned on registration.

### Database Migration

```bash
npm run db:generate  # if schema changed
npm run db:migrate   # apply migrations
```

---

## Out of Scope (not in this release)

- Payment processing at booking time
- Two-way calendar sync (Google Calendar, Outlook)
- Native mobile apps
- SMS notifications
- Custom merchant domains
- Embeddable widget
- Customer self-service reschedule (cancel + rebook instead)
- Waitlist / queue management

---

## Smoke Tests (post-deploy)

1. `GET /api/health` → `200 OK`
2. Register a merchant at `platform.com/register` — verify slug uniqueness check works in real-time
3. Log in to the admin dashboard at `platform.com/login`
4. Create a staff member, set availability, create a service
5. Visit `<slug>.platform.com` — verify booking flow renders and completes
6. Confirm SendGrid delivers booking confirmation email with cancel link
7. Click cancel link — verify slot is released and merchant receives cancellation email
8. Click cancel link again after appointment time — verify "booking already passed" message
9. From admin: reschedule a booking — verify rescheduling email delivered to customer
10. Start server with `AUTH_SECRET` unset — verify `[FATAL]` log and process exit
