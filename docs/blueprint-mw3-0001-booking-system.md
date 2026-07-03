# Technical Design Document — Self-Serve Booking System
**Task**: MW3-0001-blueprint  
**Stage**: Blueprint  
**Author**: Architect (SDLC Agent)  
**Date**: 2026-06-07  
**Status**: In Review

---

## Table of Contents
1. [Resolved Open Questions](#1-resolved-open-questions)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack Decisions](#3-technology-stack-decisions)
4. [Multi-Tenant Database Design](#4-multi-tenant-database-design)
5. [Data Model](#5-data-model)
6. [API Contracts](#6-api-contracts)
7. [Key Component Design](#7-key-component-design)
8. [Email Service Design](#8-email-service-design)
9. [Slot Availability Algorithm](#9-slot-availability-algorithm)
10. [Cancel Token Design](#10-cancel-token-design)
11. [Authentication & Session Management](#11-authentication--session-management)
12. [Infrastructure Requirements](#12-infrastructure-requirements)
13. [File Structure](#13-file-structure)
14. [Trade-offs & Alternatives Considered](#14-trade-offs--alternatives-considered)
15. [Implementation Sequence](#15-implementation-sequence)

---

## 1. Resolved Open Questions

All open questions from the product brief (OQ-01 through OQ-04) and design spec (TA-01 through TA-04, D-01 through D-06) are resolved here. **No open questions remain.**

### From Product Brief

| # | Question | Resolution |
|---|----------|------------|
| OQ-01 | Configurable range for expiry window | **5 minutes minimum, 60 minutes maximum.** Default 15 min. Stored per-merchant in `merchant_settings`. |
| OQ-02 | What happens to merchant DB on account cancellation? | **30-day grace period** (status = `cancelled`, data retained). After 30 days, drop the PostgreSQL schema. Export endpoint available in the Danger Zone tab before cancellation. |
| OQ-03 | Limit on merchants/databases per server? | **No hard limit at MVP.** Recommend soft-alert at 500 merchants per instance (operational monitoring, not a code gate). Architecture review required before 1,000 merchants. |
| OQ-04 | Slug validation format | **Regex**: `^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$` — lowercase letters, digits, hyphens; minimum 3 chars, maximum 30 chars; must begin and end with letter or digit. Reserved slugs (e.g. `www`, `api`, `admin`, `app`, `mail`, `static`) blocked at validation. |

### From Design Spec

| # | Question | Resolution |
|---|----------|------------|
| D-01 | "Any staff" option on booking page | **Post-MVP.** Not in scope for v1. Customer must select a specific staff member. |
| D-02 | Show staff capacity (e.g. "2 spots left") | **Hidden by default.** Not in v1 — avoids scarcity pressure. |
| D-03 | Single staff member behaviour | **Skip staff selection step.** If merchant has exactly one visible staff member, the booking page auto-selects them and goes directly to service selection. |
| D-04 | Sticky booking summary on desktop | **Yes.** A `position: sticky` summary panel at top of the booking form (step 4) on desktop (≥1024px). |
| D-05 | Cancel link in "you cancelled" email | **No cancel link** in the cancellation confirmation email. It is informational only. |
| D-06 | Empty state when merchant has no services | **"Coming soon" placeholder** on booking page: merchant name, tagline, and "We're getting set up — check back soon." |

### Technical Assumptions

| # | Assumption | Resolution |
|---|-----------|------------|
| TA-01 | Wildcard DNS `*.platform.com` | Configured at infrastructure level via DNS A record `*.platform.com → server IP`. Handled outside application code. |
| TA-02 | SSL provisioning | **Wildcard certificate** via Caddy (`tls { on_demand }`) or a pre-issued Let's Encrypt wildcard cert. Single cert covers all subdomains. No per-subdomain provisioning needed. |
| TA-03 | SendGrid API access | `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` env vars. Package: `@sendgrid/mail`. |
| TA-04 | Database per-merchant file I/O | **Resolved by architecture change.** SQLite dropped in favour of **PostgreSQL per-schema** (see §3). No file I/O concern. |

---

## 2. Architecture Overview

```
Internet
  │
  ├── platform.com/register       ──▶ Next.js App (registration, login)
  ├── platform.com/login
  │
  └── {slug}.platform.com/        ──▶ Next.js Middleware (subdomain routing)
       ├── /                           ▶ Customer booking page
       ├── /confirmed                  ▶ Booking confirmed
       ├── /cancel/{token}             ▶ Customer cancellation flow
       └── /admin/*                    ▶ Admin panel (authenticated)

Next.js Middleware
  └── Detects subdomain → sets x-merchant-slug header → routes to:
       ├── /site/[slug]/*   (customer-facing)
       └── /site/[slug]/admin/*  (admin panel)

API Routes (Next.js App Router)
  ├── /api/check-slug          (public — slug availability)
  ├── /api/register            (public — merchant signup)
  ├── /api/booking/*           (public — customer booking, via subdomain)
  ├── /api/cancel/*            (public — cancel link handler)
  ├── /api/verify/*            (public — email verification)
  └── /api/admin/*             (protected — admin operations)

Database Layer
  ├── Platform DB (PostgreSQL — schema: "platform")
  │    └── merchants, platform_sessions
  └── Per-Merchant Schema (PostgreSQL — schema: "merchant_{id}")
       └── admin_users, staff, staff_availability, staff_blocked_dates,
           services, customers, bookings, merchant_settings, merchant_design

External Services
  └── SendGrid (transactional email)
```

---

## 3. Technology Stack Decisions

### 3.1 Database Strategy: PostgreSQL Per-Schema (Override of Product Brief A-01)

**Decision**: Replace the product brief's SQLite recommendation with **PostgreSQL per-schema multi-tenancy**.

**Rationale**:
- The existing codebase uses PostgreSQL with `drizzle-orm/node-postgres`. Adding SQLite would require a second ORM driver (`better-sqlite3`), two migration pipelines, and dual test setups.
- SQLite is single-writer per file. Concurrent booking submissions to the same merchant DB would queue serially — a critical bottleneck for any busy merchant.
- Drizzle supports `pgSchema()` natively: `const schema = pgSchema('merchant_abc')`. Schema-prefixed tables are first-class in Drizzle.
- Backup, restore, and cleanup are as simple with PostgreSQL schema dumps (`pg_dump -n merchant_{id}`) as with SQLite file copy.
- **Trade-off accepted**: All merchant data lives in one PostgreSQL server. Mitigation: named schemas provide data isolation (cross-tenant queries require explicit schema prefix); `REVOKE` permissions can further isolate at DB user level if needed.

### 3.2 Additional Packages Required

| Package | Purpose |
|---------|---------|
| `@sendgrid/mail` | Transactional email via SendGrid API |
| `jose` | HMAC-SHA256 signing for cancel tokens + JWT admin sessions |
| `react-colorful` | Colour pickers in the Design module (lightweight, zero deps) |
| `@dnd-kit/core` | Drag-to-reschedule in admin calendar (optional, progressive enhancement) |
| `date-fns` | Date arithmetic (slot computation, timezone handling) |
| `sharp` | Staff photo resizing before storage |

### 3.3 Storage for Staff Photos

Staff photos stored on the local filesystem under `./uploads/` in development, and on an object store (S3-compatible or Vercel Blob) in production. The `PHOTO_STORAGE_URL` env var determines the base URL. Photos are resized to max 200×200px via `sharp` on upload.

### 3.4 Session / Auth

**Admin sessions**: JWT in an `httpOnly`, `Secure`, `SameSite=Strict` cookie. Signed with `AUTH_SECRET` env var via `jose`. 24-hour expiry, sliding renewal on activity.

**No customer auth**: Customers are identified by their cancel token only. No login or session.

---

## 4. Multi-Tenant Database Design

### 4.1 Schema Naming Convention

Each merchant gets a PostgreSQL schema named `merchant_<merchantId>` where `merchantId` is a UUIDv4 with hyphens removed (32 hex chars), e.g. `merchant_a1b2c3d4e5f6...`.

The platform registry lives in the `platform` schema.

### 4.2 Schema Provisioning Flow (on merchant registration)

```typescript
// Pseudo-code — executed in a DB transaction
async function provisionMerchant(slug: string, email: string, passwordHash: string) {
  // 1. Insert merchant record in platform schema
  const merchant = await platformDb.insert(merchants).values({
    slug, email, passwordHash,
    schemaName: `merchant_${generateId()}`,
    status: 'provisioning',
  }).returning();

  // 2. Create PostgreSQL schema
  await platformDb.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(merchant.schemaName)}`);

  // 3. Run DDL for all merchant tables within that schema
  await runMerchantMigrations(merchant.schemaName);

  // 4. Seed default settings
  await getMerchantDb(merchant.schemaName).insert(merchantSettings).values({
    slotDurationMinutes: 30,
    bookingExpiryMinutes: 15,
    displayLanguage: 'en',
  });

  // 5. Mark as active
  await platformDb.update(merchants).set({ status: 'active' }).where(eq(merchants.id, merchant.id));

  return merchant;
}
```

### 4.3 Drizzle Schema Factory

```typescript
// src/lib/db/merchant-schema.ts
import { pgSchema } from 'drizzle-orm/pg-core';

export function createMerchantSchema(schemaName: string) {
  const s = pgSchema(schemaName);
  return {
    adminUsers: s.table('admin_users', { /* see §5 */ }),
    staff: s.table('staff', { /* see §5 */ }),
    // ... all tables
  };
}
```

### 4.4 Per-Request DB Resolution

```typescript
// src/lib/db/get-merchant-db.ts
const dbCache = new Map<string, DrizzleDB>();

export async function getMerchantDb(slug: string): Promise<DrizzleDB> {
  if (dbCache.has(slug)) return dbCache.get(slug)!;

  const merchant = await platformDb.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
  });
  if (!merchant || merchant.status !== 'active') throw new MerchantNotFoundError(slug);

  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(pool, { schema });
  dbCache.set(slug, db);
  return db;
}
```

The cache is process-scoped (cleared on server restart). In production (multiple Next.js instances), each instance caches independently — safe because schema names don't change after provisioning.

---

## 5. Data Model

### 5.1 Platform Schema (`platform`)

#### `platform.merchants`

```sql
CREATE TABLE platform.merchants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,           -- e.g. "glamour-studio"
  business_name TEXT NOT NULL,
  owner_email   TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  schema_name   TEXT NOT NULL UNIQUE,           -- e.g. "merchant_a1b2..."
  status        TEXT NOT NULL DEFAULT 'active', -- active | cancelled | suspended
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchants_slug ON platform.merchants(slug);
CREATE INDEX idx_merchants_status ON platform.merchants(status);
```

**Drizzle definition**:
```typescript
export const merchants = platformSchema.table('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  businessName: text('business_name').notNull(),
  ownerEmail: text('owner_email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  schemaName: text('schema_name').notNull().unique(),
  status: text('status', { enum: ['active', 'cancelled', 'suspended'] }).notNull().default('active'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = typeof merchants.$inferInsert;
```

---

### 5.2 Merchant Schema (`merchant_{id}`)

All tables below are created within the merchant's private schema.

#### `admin_users`

```typescript
export const adminUsers = s.table('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['owner', 'admin'] }).notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `staff`

```typescript
export const staff = s.table('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  photoUrl: text('photo_url'),                   // null = no photo
  contactNumber: text('contact_number'),
  email: text('email'),
  isVisible: boolean('is_visible').notNull().default(true),  // shown on booking page
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `staff_availability`

Recurring weekly working hours per staff member.

```typescript
export const staffAvailability = s.table('staff_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),   // 0=Sunday, 1=Monday ... 6=Saturday
  startTime: text('start_time').notNull(),        // "09:00" (HH:MM, 24hr)
  endTime: text('end_time').notNull(),            // "18:00" (HH:MM, 24hr)
  maxConcurrent: integer('max_concurrent').notNull().default(1),
}, (t) => ({
  uniq: unique().on(t.staffId, t.dayOfWeek),
}));
```

#### `staff_blocked_dates`

```typescript
export const staffBlockedDates = s.table('staff_blocked_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  startDate: date('start_date').notNull(),   // "2026-06-20"
  endDate: date('end_date').notNull(),       // "2026-06-27" (inclusive)
  reason: text('reason'),                   // internal note (optional)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Index for efficient date-range queries
CREATE INDEX idx_blocked_dates_staff ON staff_blocked_dates(staff_id, start_date, end_date);
```

#### `services`

```typescript
export const services = s.table('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),  // e.g. 45
  priceCents: integer('price_cents'),                       // null = no price shown
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `customers`

```typescript
export const customers = s.table('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  contactNumber: text('contact_number').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationToken: text('verification_token').unique(),  // null after verified
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_verified ON customers(is_verified);
```

#### `bookings`

```typescript
export type BookingStatus =
  | 'confirmed'
  | 'cancelled_customer'
  | 'cancelled_admin'
  | 'rescheduled';  // the OLD booking after admin reschedule

export const bookings = s.table('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  staffId: uuid('staff_id').notNull().references(() => staff.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: text('status', {
    enum: ['confirmed', 'cancelled_customer', 'cancelled_admin', 'rescheduled'],
  }).notNull().default('confirmed'),
  cancelToken: text('cancel_token').notNull().unique(),  // opaque token stored for lookup
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  rescheduledFromId: uuid('rescheduled_from_id').references((): AnyPgColumn => bookings.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

CREATE INDEX idx_bookings_staff_time ON bookings(staff_id, start_time, end_time)
  WHERE status = 'confirmed';
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_cancel_token ON bookings(cancel_token);
```

**Note on `cancelToken`**: The token stored in the DB is the **booking UUID** (used for lookup). The URL token is a signed payload (see §10). The `cancel_token` column stores a UUID4 that is embedded in the signed URL. This allows token revocation (admin cancel → token becomes invalid because status check fails).

#### `merchant_settings`

```typescript
export const merchantSettings = s.table('merchant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
  bookingExpiryMinutes: integer('booking_expiry_minutes').notNull().default(15),
  displayLanguage: text('display_language').notNull().default('en'),
  // Expiry window: 5–60 min enforced at API validation layer
});
```

#### `merchant_design`

```typescript
export const merchantDesign = s.table('merchant_design', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageHeadline: text('page_headline').default('Book an appointment'),
  pageSubheadline: text('page_subheadline').default('Fast, easy, online booking'),
  // Slot colours (hex strings, 7 chars e.g. "#ECFDF5")
  slotAvailableBg: text('slot_available_bg').notNull().default('#ECFDF5'),
  slotAvailableText: text('slot_available_text').notNull().default('#065F46'),
  slotUnavailableBg: text('slot_unavailable_bg').notNull().default('#F1F5F9'),
  slotUnavailableText: text('slot_unavailable_text').notNull().default('#475569'),
  // Calendar style
  calendarBorderWidth: integer('calendar_border_width').notNull().default(1),   // px
  calendarBorderColor: text('calendar_border_color').notNull().default('#E2E8F0'),
  calendarBorderRadius: integer('calendar_border_radius').notNull().default(8), // px
  calendarFontSize: integer('calendar_font_size').notNull().default(14),        // px
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 6. API Contracts

All API routes live under `src/app/api/`. Public routes require no auth. Admin routes require a valid admin JWT cookie.

### TypeScript shared types

```typescript
// src/lib/types/api.ts

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Booking
export interface BookingSlot {
  startTime: string;  // ISO 8601, e.g. "2026-06-08T09:30:00+08:00"
  endTime: string;
  available: boolean;
}

export interface BookingSummary {
  id: string;
  customer: { id: string; firstName: string; email: string; contactNumber: string };
  staff: { id: string; name: string; photoUrl: string | null };
  service: { id: string; name: string; durationMinutes: number; priceCents: number | null };
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}
```

---

### 6.1 Public — Platform

#### `GET /api/check-slug`
Check slug availability during registration.

```
Query: ?slug=glamour-studio

Response 200:
{ "success": true, "data": { "available": true } }

Response 200 (taken):
{ "success": true, "data": { "available": false, "reason": "taken" } }

Response 200 (invalid format):
{ "success": true, "data": { "available": false, "reason": "invalid_format" } }

Response 200 (reserved):
{ "success": true, "data": { "available": false, "reason": "reserved" } }
```

Rate limit: 30 req/min per IP.

#### `POST /api/register`
Register a new merchant account.

```typescript
// Request body
interface RegisterRequest {
  slug: string;          // validated: /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/
  businessName: string;  // 1–100 chars
  email: string;         // valid email
  password: string;      // min 8 chars
}

// Response 201
interface RegisterResponse {
  merchantId: string;
  slug: string;
  bookingPageUrl: string;  // "https://glamour-studio.platform.com"
  dashboardUrl: string;    // "https://glamour-studio.platform.com/admin"
}

// Errors
// 409 — slug already taken
// 422 — validation failure (invalid slug format, weak password, etc.)
// 500 — DB provisioning failure (rolled back)
```

#### `POST /api/login`
Admin login.

```typescript
// Request body
interface LoginRequest {
  slug: string;
  email: string;
  password: string;
}

// Response 200 — sets httpOnly cookie "admin_session"
interface LoginResponse {
  adminId: string;
  name: string;
  role: 'owner' | 'admin';
}

// Errors
// 401 — invalid credentials
// 404 — merchant slug not found
```

---

### 6.2 Public — Customer Booking (served on `{slug}.platform.com`)

All routes in this section extract the merchant from the `x-merchant-slug` header set by middleware. They fail with `404` if the merchant is not found or not `active`.

#### `GET /api/booking/meta`
Returns merchant display config and staff visibility for the booking page.

```typescript
// Response 200
interface BookingMetaResponse {
  businessName: string;
  design: {
    pageHeadline: string;
    pageSubheadline: string;
    slotAvailableBg: string;
    slotAvailableText: string;
    slotUnavailableBg: string;
    slotUnavailableText: string;
    calendarBorderWidth: number;
    calendarBorderColor: string;
    calendarBorderRadius: number;
    calendarFontSize: number;
  };
  singleStaffMode: boolean;  // true if exactly one visible staff member
}
```

#### `GET /api/booking/staff`
List visible staff members.

```typescript
// Response 200
interface StaffListResponse {
  staff: Array<{
    id: string;
    name: string;
    photoUrl: string | null;
  }>;
}
```

#### `GET /api/booking/services`
List enabled services.

```typescript
// Response 200
interface ServicesListResponse {
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    priceCents: number | null;
  }>;
}
```

#### `GET /api/booking/slots`
Compute available time slots for a given staff + service + date combination.

```
Query: ?staffId={uuid}&serviceId={uuid}&date=2026-06-08
```

```typescript
// Response 200
interface SlotsResponse {
  date: string;            // "2026-06-08"
  slots: Array<{
    startTime: string;     // ISO 8601
    endTime: string;       // ISO 8601 (startTime + serviceDuration)
    available: boolean;
  }>;
}

// Response 404 — staff or service not found / not visible
// Response 400 — invalid date (past date, more than 90 days ahead)
```

Slots more than 90 days in the future are not shown. Past slots (before now) are returned with `available: false`.

#### `POST /api/booking`
Submit a booking. Booking is confirmed immediately on submission.

```typescript
// Request body
interface CreateBookingRequest {
  staffId: string;
  serviceId: string;
  startTime: string;   // ISO 8601
  customer: {
    firstName: string;  // 1–100 chars
    email: string;
    contactNumber: string;  // 1–30 chars
  };
}

// Response 201
interface CreateBookingResponse {
  bookingId: string;
  confirmationNumber: string;  // human-readable, e.g. "BK-1042"
  startTime: string;
  endTime: string;
  staff: { name: string };
  service: { name: string; durationMinutes: number; priceCents: number | null };
  customer: { firstName: string; email: string };
}

// Errors
// 409 — slot no longer available (race condition)
// 422 — validation failure
// 404 — staff or service not found
```

#### `GET /api/cancel/:token`
Validate a cancel token and return booking details (for the cancellation confirmation page).

```typescript
// Response 200 — valid token, booking not yet cancelled
interface CancelPreviewResponse {
  bookingId: string;
  confirmationNumber: string;
  staff: { name: string };
  service: { name: string };
  startTime: string;
  endTime: string;
  customerName: string;
  expired: false;
}

// Response 200 — token valid but appointment has passed
interface CancelExpiredResponse {
  expired: true;
  startTime: string;
  confirmationNumber: string;
}

// Response 404 — invalid token (tampered or nonexistent)
// Response 410 — booking already cancelled
```

#### `POST /api/cancel/:token`
Execute customer self-cancellation.

```typescript
// Response 200
interface CancelSuccessResponse {
  bookingId: string;
  confirmationNumber: string;
  cancelledAt: string;
}

// Response 409 — booking already cancelled
// Response 403 — appointment has already started (expired)
// Response 404 — invalid token
```

Rate limit: 10 req/min per token + 30 req/min per IP.

#### `GET /api/verify/:token`
Email verification link for customer records (CRM only — does not gate booking).

```typescript
// Response 200
interface VerifyResponse {
  success: true;
  customerName: string;
}

// Response 410 — token already used
// Response 404 — invalid token
```

---

### 6.3 Admin API (Protected — JWT cookie required)

All admin routes are served at `{slug}.platform.com/api/admin/*`. Middleware validates the JWT and injects `merchantSlug` and `adminId` into the request.

#### Auth

```
POST /api/admin/logout
→ 200, clears cookie

GET /api/admin/me
→ { adminId, name, email, role }
```

#### Dashboard / Bookings

```typescript
// GET /api/admin/bookings
// Query: ?view=calendar&month=2026-06 OR ?view=list&page=1&pageSize=25&status=confirmed&staffId=&search=

// Calendar view response
interface CalendarBookingsResponse {
  bookings: BookingSummary[];
  month: string;  // "2026-06"
}

// List view response
interface ListBookingsResponse {
  bookings: BookingSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// GET /api/admin/bookings/:id → BookingSummary

// POST /api/admin/bookings (admin creates booking directly)
interface AdminCreateBookingRequest {
  staffId: string;
  serviceId: string;
  startTime: string;
  customer: {
    firstName: string;
    email: string;
    contactNumber: string;
  };
}

// PUT /api/admin/bookings/:id (direct edit — updates fields, no email sent)
interface AdminEditBookingRequest {
  startTime?: string;
  endTime?: string;
  staffId?: string;
  serviceId?: string;
  // Note: customer fields edited via customer profile, not booking
}

// POST /api/admin/bookings/:id/reschedule
interface RescheduleRequest {
  newStartTime: string;   // ISO 8601
  // newEndTime computed from service duration
}
// → 200, sends rescheduling email to customer automatically

// POST /api/admin/bookings/:id/cancel
// → 200, releases slot, status = 'cancelled_admin'
```

#### Staff

```typescript
// GET /api/admin/staff → { staff: StaffWithAvailability[] }

// POST /api/admin/staff
interface CreateStaffRequest {
  name: string;
  contactNumber?: string;
  email?: string;
  isVisible?: boolean;  // default true
  // photo uploaded separately via POST /api/admin/staff/:id/photo (multipart/form-data)
}

// PUT /api/admin/staff/:id → same fields as CreateStaffRequest (all optional)
// DELETE /api/admin/staff/:id → soft-delete (isVisible=false) if has future bookings; hard-delete if none

// GET /api/admin/staff/:id/availability
interface AvailabilityResponse {
  availability: Array<{
    dayOfWeek: number;   // 0–6
    startTime: string;   // "09:00"
    endTime: string;     // "18:00"
    maxConcurrent: number;
    enabled: boolean;
  }>;
}

// PUT /api/admin/staff/:id/availability
interface SetAvailabilityRequest {
  availability: AvailabilityResponse['availability'];
}

// GET /api/admin/staff/:id/blocked-dates
interface BlockedDatesResponse {
  blockedDates: Array<{ id: string; startDate: string; endDate: string; reason: string | null }>;
}

// POST /api/admin/staff/:id/blocked-dates
interface AddBlockedDateRequest {
  startDate: string;  // "2026-06-20"
  endDate: string;    // "2026-06-27"
  reason?: string;
}

// DELETE /api/admin/staff/:id/blocked-dates/:blockId → 200
```

#### Services

```typescript
// GET /api/admin/services → { services: Service[] }

// POST /api/admin/services
interface CreateServiceRequest {
  name: string;
  description?: string;
  durationMinutes: number;  // must be a multiple of merchant's slotDuration (validated)
  priceCents?: number;
  isEnabled?: boolean;  // default true
}

// PUT /api/admin/services/:id → same fields (all optional)
// DELETE /api/admin/services/:id → only if no future confirmed bookings using this service (else 409)
```

#### Customers

```typescript
// GET /api/admin/customers
// Query: ?page=1&pageSize=25&search=sarah&isVerified=true

interface CustomerListResponse {
  customers: Array<{
    id: string;
    email: string;
    firstName: string;
    contactNumber: string;
    isVerified: boolean;
    bookingCount: number;
    lastBookingAt: string | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
}

// GET /api/admin/customers/:id
interface CustomerDetailResponse {
  customer: {
    id: string;
    email: string;
    firstName: string;
    contactNumber: string;
    isVerified: boolean;
    createdAt: string;
  };
  bookings: BookingSummary[];
}

// POST /api/admin/customers/:id/resend-confirmation
// → sends the latest confirmed booking's confirmation email again
// Response: 200 | 404 (no confirmed bookings)

// POST /api/admin/customers/send-offer
interface SendOfferRequest {
  to: 'single' | 'all' | 'verified';
  customerId?: string;  // required if to === 'single'
  subject: string;
  body: string;         // plain text with {first_name} merge tag support
}
// → queues emails; response: { queued: number }
```

#### Design

```typescript
// GET /api/admin/design → MerchantDesign object (all fields)

// PUT /api/admin/design
interface UpdateDesignRequest {
  pageHeadline?: string;
  pageSubheadline?: string;
  slotAvailableBg?: string;      // validated: valid hex colour
  slotAvailableText?: string;
  slotUnavailableBg?: string;
  slotUnavailableText?: string;
  calendarBorderWidth?: number;  // 0–8 px
  calendarBorderColor?: string;
  calendarBorderRadius?: number; // 0–24 px
  calendarFontSize?: number;     // 10–24 px
}
```

#### Settings

```typescript
// GET /api/admin/settings
interface SettingsResponse {
  slotDurationMinutes: number;
  bookingExpiryMinutes: number;
  displayLanguage: string;
}

// PUT /api/admin/settings
interface UpdateSettingsRequest {
  slotDurationMinutes?: 15 | 30 | 60;   // only these increments allowed
  bookingExpiryMinutes?: number;          // 5–60, validated
  displayLanguage?: string;              // "en" only for MVP
}

// GET /api/admin/settings/admins
interface AdminListResponse {
  admins: Array<{ id: string; email: string; name: string; role: 'owner' | 'admin' }>;
}

// POST /api/admin/settings/admins
interface AddAdminRequest {
  email: string;
  name: string;
  password: string;
  role: 'admin';  // cannot create owner via this endpoint
}

// DELETE /api/admin/settings/admins/:adminId
// → 409 if trying to delete the owner account
// → 403 if non-owner trying to delete another admin
```

---

## 7. Key Component Design

### 7.1 Next.js Middleware (Subdomain Routing)

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_HOSTS = ['platform.com', 'www.platform.com', 'localhost'];
const RESERVED_SLUGS = new Set(['www', 'api', 'admin', 'app', 'mail', 'static', 'support']);

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? '';
  const hostname = host.replace(':3000', '').replace(':443', '');
  const parts = hostname.split('.');

  // Detect subdomain (e.g. "glamour-studio" from "glamour-studio.platform.com")
  if (parts.length >= 3 && !PLATFORM_HOSTS.includes(hostname)) {
    const slug = parts[0];
    if (!RESERVED_SLUGS.has(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/site/${slug}${request.nextUrl.pathname}`;
      const response = NextResponse.rewrite(url);
      response.headers.set('x-merchant-slug', slug);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 7.2 File / Route Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Platform marketing/landing page
│   ├── register/page.tsx             # Merchant registration
│   ├── login/page.tsx                # (redirect to slug login — or universal login)
│   │
│   ├── site/[slug]/                  # Rewritten from subdomains by middleware
│   │   ├── page.tsx                  # Customer booking page (C01-C03)
│   │   ├── confirmed/page.tsx        # Booking confirmed (C04)
│   │   ├── cancel/[token]/page.tsx   # Cancel flow (C05-C07)
│   │   └── admin/                    # Admin panel
│   │       ├── layout.tsx            # Admin shell (sidebar, topbar)
│   │       ├── page.tsx              # Dashboard (A03/A04)
│   │       ├── staff/
│   │       │   ├── page.tsx          # Staff list (A06)
│   │       │   └── [id]/
│   │       │       ├── page.tsx      # Staff edit (A07)
│   │       │       └── availability/page.tsx  # Availability (A08)
│   │       ├── services/page.tsx     # Services (A09/A10)
│   │       ├── customers/
│   │       │   ├── page.tsx          # Customer list (A11)
│   │       │   └── [id]/page.tsx     # Customer detail (A12)
│   │       ├── design/page.tsx       # Design module (A13)
│   │       └── settings/page.tsx     # Settings (A14)
│   │
│   └── api/
│       ├── check-slug/route.ts
│       ├── register/route.ts
│       ├── login/route.ts
│       ├── booking/
│       │   ├── meta/route.ts
│       │   ├── staff/route.ts
│       │   ├── services/route.ts
│       │   ├── slots/route.ts
│       │   └── route.ts              # POST = create booking
│       ├── cancel/[token]/route.ts
│       ├── verify/[token]/route.ts
│       └── admin/
│           ├── me/route.ts
│           ├── logout/route.ts
│           ├── bookings/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       ├── reschedule/route.ts
│           │       └── cancel/route.ts
│           ├── staff/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       ├── availability/route.ts
│           │       ├── blocked-dates/route.ts
│           │       └── photo/route.ts
│           ├── services/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── customers/
│           │   ├── route.ts
│           │   ├── send-offer/route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       └── resend-confirmation/route.ts
│           ├── design/route.ts
│           └── settings/
│               ├── route.ts
│               └── admins/
│                   ├── route.ts
│                   └── [adminId]/route.ts
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (Button, Input, etc.)
│   ├── admin/                        # Admin-specific components
│   │   ├── BookingCalendar.tsx       # Calendar view (Client Component)
│   │   ├── BookingList.tsx           # List view (Client Component)
│   │   ├── BookingDetailModal.tsx    # Detail/edit/reschedule modal
│   │   ├── RescheduleModal.tsx
│   │   ├── StaffForm.tsx
│   │   ├── AvailabilityEditor.tsx
│   │   ├── ServiceForm.tsx
│   │   ├── DesignEditor.tsx          # Split-panel with live preview
│   │   ├── ColourPicker.tsx          # Wraps react-colorful
│   │   └── AdminSidebar.tsx
│   └── booking/                      # Customer booking page components
│       ├── StaffSelector.tsx         # Step 1 (Client Component)
│       ├── ServiceSelector.tsx       # Step 2 (Client Component)
│       ├── SlotPicker.tsx            # Step 3 with calendar (Client Component)
│       ├── BookingForm.tsx           # Step 4 with expiry countdown
│       └── ExpiryCountdown.tsx
│
├── lib/
│   ├── db/
│   │   ├── platform-schema.ts        # Platform schema (merchants table)
│   │   ├── merchant-schema.ts        # Factory for per-merchant schemas
│   │   ├── client.ts                 # Platform DB Drizzle instance
│   │   ├── get-merchant-db.ts        # Per-slug DB resolver (cached)
│   │   ├── provision-merchant.ts     # Merchant DB setup on registration
│   │   └── migrate.ts
│   ├── auth/
│   │   ├── hash-password.ts          # bcrypt wrapper
│   │   ├── verify-password.ts
│   │   ├── create-session.ts         # Signs JWT, sets cookie
│   │   ├── verify-session.ts         # Validates JWT from cookie
│   │   └── admin-guard.ts            # HOF for protecting API routes
│   ├── email/
│   │   ├── sendgrid.ts               # SendGrid client
│   │   ├── templates/
│   │   │   ├── booking-confirmation.ts
│   │   │   ├── rescheduling-notification.ts
│   │   │   ├── cancellation-customer.ts
│   │   │   ├── new-booking-merchant.ts
│   │   │   ├── cancellation-merchant.ts
│   │   │   └── offer-email.ts
│   │   └── email-service.ts          # High-level email functions
│   ├── booking/
│   │   ├── compute-slots.ts          # Slot availability algorithm
│   │   ├── cancel-token.ts           # HMAC token sign/verify
│   │   └── booking-service.ts        # Business logic (create, cancel, reschedule)
│   ├── utils.ts
│   └── env.ts                        # Extended with new env vars
```

### 7.3 Admin Authentication Guard

```typescript
// src/lib/auth/admin-guard.ts
import type { NextRequest } from 'next/server';
import { verifySession } from './verify-session';
import { getMerchantDb } from '../db/get-merchant-db';

export function withAdminAuth<T>(
  handler: (req: NextRequest, ctx: AdminContext) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const slug = req.headers.get('x-merchant-slug');
    if (!slug) return Response.json({ success: false, error: 'Not found' }, { status: 404 });

    const session = await verifySession(req);
    if (!session) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const db = await getMerchantDb(slug);
    return handler(req, { slug, session, db });
  };
}

interface AdminContext {
  slug: string;
  session: { adminId: string; role: 'owner' | 'admin' };
  db: MerchantDatabase;
}
```

### 7.4 Environment Variables (additions to `src/lib/env.ts`)

```typescript
// New required env vars
AUTH_SECRET: z.string().min(32)          // JWT signing secret (generate with: openssl rand -hex 32)
CANCEL_TOKEN_SECRET: z.string().min(32)  // HMAC secret for cancel tokens
SENDGRID_API_KEY: z.string().min(1)
SENDGRID_FROM_EMAIL: z.string().email()
PLATFORM_DOMAIN: z.string().default('platform.com')
PHOTO_STORAGE_PATH: z.string().default('./uploads')  // local dev; swap for S3 URL in prod
```

---

## 8. Email Service Design

All emails sent via SendGrid using `@sendgrid/mail`. Templates are TypeScript functions that return `MailDataRequired` objects. HTML is plain inline-CSS for mail client compatibility.

```typescript
// src/lib/email/email-service.ts

export async function sendBookingConfirmation(params: {
  booking: BookingSummary;
  customer: { email: string; firstName: string };
  cancelToken: string;
  merchant: { businessName: string; slug: string };
  cancelUrl: string;  // https://{slug}.platform.com/cancel/{token}
}): Promise<void>

export async function sendReschedulingNotification(params: {
  booking: BookingSummary;
  oldStartTime: string;
  customer: { email: string; firstName: string };
  merchant: { businessName: string };
}): Promise<void>

export async function sendCancellationToCustomer(params: {
  booking: BookingSummary;
  customer: { email: string; firstName: string };
  merchant: { businessName: string; slug: string };
}): Promise<void>

export async function sendNewBookingAlert(params: {
  booking: BookingSummary;
  merchant: { ownerEmail: string; businessName: string; slug: string };
}): Promise<void>

export async function sendCancellationAlertToMerchant(params: {
  booking: BookingSummary;
  merchant: { ownerEmail: string; businessName: string; slug: string };
}): Promise<void>

export async function sendOfferEmail(params: {
  to: string;
  firstName: string;
  subject: string;
  body: string;     // {first_name} merge tag replaced before sending
  merchant: { businessName: string; slug: string };
}): Promise<void>
```

**Error handling**: SendGrid failures log the error but do not throw to the customer — the booking is confirmed regardless. Failed emails are logged with sufficient context for retry. (A retry queue is post-MVP.)

---

## 9. Slot Availability Algorithm

```typescript
// src/lib/booking/compute-slots.ts

interface ComputeSlotsParams {
  date: Date;                        // local date to compute for
  staffId: string;
  serviceDurationMinutes: number;
  slotIncrementMinutes: number;      // from merchant settings (15/30/60)
  availability: StaffAvailabilityRow[];      // recurring weekly schedule
  blockedDates: StaffBlockedDateRow[];       // blocked date ranges
  existingBookings: { startTime: Date; endTime: Date; maxConcurrent: number }[];
}

interface SlotResult {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export function computeSlots(params: ComputeSlotsParams): SlotResult[] {
  const { date, serviceDurationMinutes, slotIncrementMinutes } = params;

  // Step 1: Get working hours for this day of week
  const dayOfWeek = date.getDay();
  const dayAvail = params.availability.find(a => a.dayOfWeek === dayOfWeek);
  if (!dayAvail) return [];  // staff not working this day

  // Step 2: Check if date is in any blocked range (inclusive)
  const dateStr = formatISO(date, { representation: 'date' });
  const isBlocked = params.blockedDates.some(
    b => b.startDate <= dateStr && dateStr <= b.endDate
  );
  if (isBlocked) return [];

  // Step 3: Generate all slot start times within working hours
  const workStart = parseTime(dayAvail.startTime, date);  // e.g. 09:00
  const workEnd = parseTime(dayAvail.endTime, date);       // e.g. 18:00
  const slots: SlotResult[] = [];

  let slotStart = workStart;
  while (addMinutes(slotStart, serviceDurationMinutes) <= workEnd) {
    const slotEnd = addMinutes(slotStart, serviceDurationMinutes);

    // Step 4: Check capacity — count confirmed bookings overlapping this slot window
    const overlapping = params.existingBookings.filter(b =>
      b.startTime < slotEnd && b.endTime > slotStart
    );
    const available = overlapping.length < dayAvail.maxConcurrent;

    // Step 5: Don't show past slots as available (but include them as unavailable)
    const isPast = slotStart <= new Date();

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: available && !isPast,
    });

    slotStart = addMinutes(slotStart, slotIncrementMinutes);
  }

  return slots;
}
```

**Performance notes**:
- Slot computation is done per-request in the API route handler
- For a typical day (9-hour workday, 30-min slots) this is ~18 iterations — trivial
- The booking query for a single staff on a single date uses the index `idx_bookings_staff_time`
- No caching needed at MVP scale; add Redis cache keyed on `{slug}:{staffId}:{date}` when needed

---

## 10. Cancel Token Design

### Token Structure

The cancel URL is: `https://{slug}.platform.com/cancel/{token}`

Where `token` is: `{bookingId}.{base64url(hmac)}`

- `bookingId` = UUID of the booking (used to look up the booking)
- `hmac` = HMAC-SHA256(`bookingId:startTimeISO`, `CANCEL_TOKEN_SECRET`) — binds the token to the specific booking and its start time

### Generation

```typescript
// src/lib/booking/cancel-token.ts
import { createHmac } from 'crypto';

export function generateCancelToken(bookingId: string, startTime: Date): string {
  const message = `${bookingId}:${startTime.toISOString()}`;
  const hmac = createHmac('sha256', env.CANCEL_TOKEN_SECRET)
    .update(message)
    .digest('base64url');
  return `${bookingId}.${hmac}`;
}
```

### Validation

```typescript
export async function validateCancelToken(
  token: string,
  db: MerchantDatabase
): Promise<CancelTokenResult> {
  // 1. Parse token
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return { valid: false, reason: 'malformed' };

  const bookingId = token.substring(0, dotIndex);
  const providedHmac = token.substring(dotIndex + 1);

  // 2. Look up booking
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { customer: true, staff: true, service: true },
  });
  if (!booking) return { valid: false, reason: 'not_found' };

  // 3. Verify HMAC
  const expectedHmac = createHmac('sha256', env.CANCEL_TOKEN_SECRET)
    .update(`${bookingId}:${booking.startTime.toISOString()}`)
    .digest('base64url');
  const hmacValid = timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac));
  if (!hmacValid) return { valid: false, reason: 'invalid_signature' };

  // 4. Check if booking is in a cancellable state
  if (booking.status !== 'confirmed') return { valid: false, reason: 'already_cancelled' };

  // 5. Check expiry: valid only if now < booking start time
  const now = new Date();
  if (now >= booking.startTime) return { valid: true, expired: true, booking };

  return { valid: true, expired: false, booking };
}
```

**Security properties**:
- HMAC is bound to `bookingId + startTime` — cannot forge a token for a different booking
- `timingSafeEqual` prevents timing attacks
- Token is invalidated implicitly when booking is admin-cancelled (status check in step 4)
- Rate limited at the API layer (10 req/min per IP via middleware)

---

## 11. Authentication & Session Management

### Admin JWT

```typescript
// Payload
interface AdminJwtPayload {
  sub: string;           // adminId (UUID)
  merchantSlug: string;  // e.g. "glamour-studio"
  role: 'owner' | 'admin';
  iat: number;
  exp: number;           // iat + 86400 (24 hours)
}

// Cookie: "admin_session"
// httpOnly: true
// Secure: true (production)
// SameSite: 'Strict'
// Path: /
// MaxAge: 86400
```

**Session refresh**: On each successful admin API request, if the session is within the last 2 hours of expiry, it is silently renewed (new cookie with fresh exp). This provides a sliding 24-hour window.

### Password Hashing

`bcrypt` with cost factor 12. Wrapped in async functions compatible with Next.js edge runtime constraints (bcrypt runs in Node.js runtime only — ensure all auth routes use `export const runtime = 'nodejs'`).

---

## 12. Infrastructure Requirements

### 12.1 Reverse Proxy (Caddy recommended)

```caddyfile
# Caddyfile
*.platform.com {
  tls {
    dns cloudflare {env.CF_API_TOKEN}  # or other ACME DNS challenge provider
  }
  reverse_proxy localhost:3000 {
    header_up Host {host}
  }
}

platform.com {
  reverse_proxy localhost:3000
}
```

This issues a single wildcard `*.platform.com` cert via Let's Encrypt DNS challenge. All subdomains route to the Next.js app on port 3000.

**Alternative**: Nginx with a pre-issued wildcard cert (manual renewal every 90 days or via `certbot renew` cron). Less recommended — Caddy's automatic TLS is simpler.

### 12.2 PostgreSQL

- Single PostgreSQL instance (v15+)
- One database: `bookingplatform`
- Platform schema: `platform` (merchants registry)
- One schema per merchant: `merchant_{32-char-hex-id}`
- Connection pool: `pg.Pool` with `max: 20` connections
- **DB user permissions**: The application user needs `CREATE SCHEMA` privilege (for provisioning), plus `ALL` on the `platform` schema and any `merchant_*` schemas it creates.

Provisioning SQL executed on merchant registration:
```sql
CREATE SCHEMA IF NOT EXISTS merchant_<id>;
GRANT ALL ON SCHEMA merchant_<id> TO app_user;
```

### 12.3 Environment Variables Summary

```env
# Existing
DATABASE_URL=postgresql://user:pass@localhost:5432/bookingplatform
NODE_ENV=production

# New (required)
AUTH_SECRET=<32+ random hex chars>
CANCEL_TOKEN_SECRET=<32+ random hex chars>
SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=noreply@platform.com
PLATFORM_DOMAIN=platform.com

# New (optional)
PHOTO_STORAGE_PATH=./uploads        # Local dev; use object store URL in prod
MAX_BOOKING_DAYS_AHEAD=90           # How far ahead customers can book (default: 90)
SLUG_EXPIRY_GRACE_DAYS=30           # Days before cancelled merchant schema is dropped
```

---

## 13. File Structure

**New files to create** (additions to existing codebase):

```
src/
├── lib/
│   ├── db/
│   │   ├── platform-schema.ts        ← NEW: platform.merchants table definition
│   │   ├── merchant-schema.ts        ← NEW: per-merchant schema factory
│   │   ├── get-merchant-db.ts        ← NEW: slug-to-db resolver
│   │   └── provision-merchant.ts     ← NEW: registration flow DB setup
│   ├── auth/
│   │   ├── hash-password.ts          ← NEW
│   │   ├── verify-password.ts        ← NEW
│   │   ├── create-session.ts         ← NEW
│   │   ├── verify-session.ts         ← NEW
│   │   └── admin-guard.ts            ← NEW
│   ├── email/
│   │   ├── sendgrid.ts               ← NEW
│   │   ├── email-service.ts          ← NEW
│   │   └── templates/ (6 files)      ← NEW
│   └── booking/
│       ├── compute-slots.ts          ← NEW
│       ├── cancel-token.ts           ← NEW
│       └── booking-service.ts        ← NEW
├── middleware.ts                      ← MODIFY: add subdomain routing
├── lib/env.ts                         ← MODIFY: add new env vars
└── app/
    ├── register/page.tsx             ← NEW
    ├── site/[slug]/
    │   ├── page.tsx                  ← NEW
    │   ├── confirmed/page.tsx        ← NEW
    │   ├── cancel/[token]/page.tsx   ← NEW
    │   └── admin/ (8 pages)          ← NEW
    └── api/ (~25 route files)        ← NEW
```

---

## 14. Trade-offs & Alternatives Considered

### 14.1 PostgreSQL Schemas vs. SQLite Files (Chosen: PostgreSQL schemas)

| | PostgreSQL Schemas | SQLite Files |
|---|---|---|
| **Isolation** | Schema-level (strong; no cross-tenant queries without explicit prefix) | File-level (strongest) |
| **Concurrency** | Full PostgreSQL MVCC | Single writer per file |
| **Existing stack fit** | ✅ Same driver, same ORM | ❌ New driver, dual ORM pipeline |
| **Backup** | `pg_dump -n merchant_<id>` | `cp merchant_<id>.db` |
| **Cleanup** | `DROP SCHEMA merchant_<id> CASCADE` | `rm merchant_<id>.db` |
| **Scale** | 1000s of schemas per PG instance (practical limit ~10k) | OS file limit / I/O |
| **Operational tooling** | Rich (psql, pgAdmin, CloudSQL, RDS) | Limited for production use |

**Decision**: PostgreSQL per-schema. The concurrent booking write requirement makes SQLite non-viable for busy merchants.

### 14.2 Cancel Token: HMAC vs. Database UUID

| | HMAC (Chosen) | Stored UUID |
|---|---|---|
| **Revocability** | Via status check (booking.status !== 'confirmed') | By deleting/nulling the token |
| **DB lookup needed** | Yes (to verify status + get start time) | Yes |
| **Forgery resistance** | HMAC with secret | UUID4 entropy (~122 bits) |
| **Complexity** | Moderate (HMAC computation) | Simple |

Both approaches require a DB lookup. HMAC adds cryptographic integrity on top of UUID lookup. **Decision**: HMAC because it provides tamper-evident binding of the token to the booking's start time, preventing token reuse across rescheduled bookings (old bookings get a different start time → HMAC doesn't verify for the new booking record).

### 14.3 Email Queuing: Synchronous vs. Queue

At MVP, emails are sent synchronously in the API handler (fire-and-forget with `await sendEmail().catch(logger.error)`). This keeps the stack simple — no additional infrastructure (BullMQ, Redis).

**Risk**: If SendGrid is slow, the API response is delayed. **Mitigation**: `Promise.race` with a 3-second timeout; log failure; don't block the customer response.

**Post-MVP**: Add BullMQ + Redis worker for reliable email delivery with retries.

### 14.4 Booking Confirmation Number

Human-readable booking references (`BK-1042`) generated as a per-merchant auto-incrementing integer stored in a `merchant_sequence` table (or using PostgreSQL sequences per schema). This avoids exposing UUIDs to customers while still being globally unique per merchant.

```sql
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1000;
-- booking.confirmationNumber = 'BK-' || nextval('booking_number_seq')
```

---

## 15. Implementation Sequence

Recommended build order to enable early integration testing:

### Phase 1 — Foundation (unblocks everything)
1. `src/lib/env.ts` — add new env vars
2. `src/lib/db/platform-schema.ts` — merchants table
3. `src/lib/db/merchant-schema.ts` — schema factory
4. `src/lib/db/provision-merchant.ts` — provisioning logic
5. `src/middleware.ts` — subdomain routing
6. `src/lib/auth/*` — JWT + password utils

### Phase 2 — Merchant Registration
7. `POST /api/register`, `GET /api/check-slug`
8. `src/app/register/page.tsx` — registration form with slug availability check

### Phase 3 — Admin Auth & Dashboard Shell
9. `POST /api/login`, `GET /api/admin/me`, `POST /api/admin/logout`
10. `src/app/site/[slug]/admin/layout.tsx` — sidebar, topbar
11. `GET/POST/PUT /api/admin/bookings` — dashboard data
12. `src/app/site/[slug]/admin/page.tsx` — calendar + list view

### Phase 4 — Staff & Services CRUD
13. Staff API routes + pages
14. Services API routes + pages

### Phase 5 — Customer Booking Flow
15. `src/lib/booking/compute-slots.ts`
16. `GET /api/booking/staff`, `/services`, `/slots`, `/meta`
17. `POST /api/booking` + `src/lib/email/email-service.ts`
18. `src/app/site/[slug]/page.tsx` — multi-step booking page

### Phase 6 — Cancel Flow
19. `src/lib/booking/cancel-token.ts`
20. `GET/POST /api/cancel/:token`
21. `src/app/site/[slug]/cancel/[token]/page.tsx`

### Phase 7 — Customer Management + Email Sending
22. Customer API routes + pages
23. Offer email endpoint

### Phase 8 — Design Module + Settings
24. Design API + editor page (with live preview iframe)
25. Settings API + pages (admin users, expiry window, etc.)

### Phase 9 — Polish + Tests
26. Vitest unit tests for `compute-slots`, `cancel-token`, `provision-merchant`
27. React Testing Library tests for booking flow, registration form
28. Edge case testing: concurrent slot booking, expired cancel links, duplicate slug race

---

## Gate Checklist

| Gate Requirement | Status |
|-----------------|--------|
| API contracts defined | ✅ §6 — all endpoints with request/response types |
| Data model defined | ✅ §5 — all tables with Drizzle schema + SQL DDL |
| No open questions | ✅ §1 — all OQ and design open questions resolved |
| Tech stack decisions documented | ✅ §3 — with rationale |
| Trade-offs documented | ✅ §14 |
| Implementation sequence provided | ✅ §15 |

---

*Blueprint produced by Architect for task MW3-0001-blueprint. All gate requirements met. Ready for engineering implementation.*
