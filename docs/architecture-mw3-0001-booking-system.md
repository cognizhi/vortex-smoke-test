# Architecture Blueprint — Self-Serve Booking System
**Task**: MW3-0001-blueprint  
**Stage**: Blueprint → Architecture  
**Author**: Architect (SDLC Agent)  
**Date**: 2026-06-07  
**Status**: Ready for Engineering

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Multi-Tenant Routing](#2-multi-tenant-routing)
3. [Database Schema](#3-database-schema)
4. [API Surface](#4-api-surface)
5. [Authentication & Security](#5-authentication--security)
6. [Slot Availability Engine](#6-slot-availability-engine)
7. [Email Service (SendGrid)](#7-email-service-sendgrid)
8. [Cancel Token System](#8-cancel-token-system)
9. [File & Module Structure](#9-file--module-structure)
10. [Key Technology Decisions](#10-key-technology-decisions)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Open Architecture Decisions](#12-open-architecture-decisions)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                 │
└──────────────────────┬──────────────────┬───────────────────────┘
                       │                  │
           platform.com (admin)  {slug}.platform.com (customer)
                       │                  │
┌──────────────────────▼──────────────────▼───────────────────────┐
│               Next.js App (Vercel Edge / Docker)                │
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────────────────┐ │
│  │  Admin Panel     │          │  Customer Booking Page       │ │
│  │  (authenticated) │          │  (public, no auth)           │ │
│  │  /app/admin/     │          │  /app/[slug]/               │ │
│  └──────────────────┘          └──────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               API Routes  /app/api/                     │   │
│  │  auth/ │ admin/ │ booking/ │ cancel/ │ check-slug/      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Drizzle ORM     │  │  SendGrid Client │                    │
│  └─────────┬────────┘  └─────────┬────────┘                    │
└────────────┼──────────────────────┼─────────────────────────────┘
             │                      │
   ┌──────────▼──────────┐   ┌──────▼──────────┐
   │  PostgreSQL          │   │  SendGrid API   │
   │  (multi-tenant DB)  │   │  (email relay)  │
   └─────────────────────┘   └─────────────────┘
```

### 1.2 Deployment Targets

| Target | Config | Notes |
|--------|--------|-------|
| Vercel | Auto-deploy on `main` push | Wildcard domain `*.platform.com` needed in dashboard |
| Docker | `docker build -t app .` | `DATABASE_URL` + `SENDGRID_API_KEY` required |
| Local Dev | `npm run dev` | PostgreSQL via Docker (`make docker-up`) |

### 1.3 Core Tenets

- **Multi-tenancy via subdomain**: every merchant gets `{slug}.platform.com`; the slug is the primary isolation key
- **Server Components by default**: data fetching lives in Server Components or API routes; Client Components handle interactivity only
- **Schema-first database**: Drizzle ORM schema in `src/lib/db/schema.ts` drives migrations and type safety
- **No magic strings**: all environment variables are Zod-validated via `src/lib/env.ts`

---

## 2. Multi-Tenant Routing

### 2.1 Subdomain Detection via Middleware

```
src/middleware.ts
```

Next.js middleware runs at the edge on every request. It reads the `Host` header and rewrites:

```
Host: glamour-studio.platform.com → internal rewrite to /[slug]/* (slug = "glamour-studio")
Host: platform.com                → admin panel / marketing routes as normal
```

```typescript
// src/middleware.ts (pseudocode)
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN  // "platform.com"

  if (hostname.endsWith(`.${rootDomain}`)) {
    const slug = hostname.replace(`.${rootDomain}`, '')
    // Rewrite to customer booking pages, injecting slug
    return NextResponse.rewrite(
      new URL(`/${slug}${request.nextUrl.pathname}`, request.url)
    )
  }
  // Platform admin — continue as normal
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 2.2 Route Structure

```
src/app/
├── (admin)/                   # Route group: platform.com routes
│   ├── register/
│   │   └── page.tsx           # /register — merchant signup
│   ├── login/
│   │   └── page.tsx           # /login
│   └── admin/
│       ├── layout.tsx         # Auth guard + sidebar shell
│       ├── page.tsx           # /admin — dashboard calendar view
│       ├── staff/
│       │   ├── page.tsx       # /admin/staff — list
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── availability/page.tsx
│       ├── services/page.tsx
│       ├── customers/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── design/page.tsx
│       └── settings/page.tsx
│
├── [slug]/                    # Rewrite target for {slug}.platform.com
│   ├── page.tsx               # Booking home (steps 1-4)
│   ├── confirmed/page.tsx     # Booking receipt
│   └── cancel/
│       └── [token]/page.tsx   # Cancel link landing
│
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── check-slug/route.ts    # GET ?slug=xxx
    ├── admin/
    │   ├── bookings/route.ts
    │   ├── bookings/[id]/route.ts
    │   ├── staff/route.ts
    │   ├── services/route.ts
    │   ├── customers/route.ts
    │   ├── design/route.ts
    │   └── settings/route.ts
    └── booking/
        ├── slots/route.ts     # GET available slots
        └── confirm/route.ts   # POST new booking
```

---

## 3. Database Schema

### 3.1 Full Drizzle Schema (`src/lib/db/schema.ts`)

```typescript
// === MERCHANTS ===
export const merchants = pgTable('merchants', {
  id:           uuid('id').defaultRandom().primaryKey(),
  slug:         varchar('slug', { length: 30 }).notNull().unique(),
  businessName: varchar('business_name', { length: 100 }).notNull(),
  ownerEmail:   varchar('owner_email', { length: 255 }).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})

// === MERCHANT CONFIGURATION ===
export const merchantConfigs = pgTable('merchant_configs', {
  id:                 uuid('id').defaultRandom().primaryKey(),
  merchantId:         uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }).unique(),
  slotDurationMins:   integer('slot_duration_mins').notNull().default(30),
  bookingExpiryMins:  integer('booking_expiry_mins').notNull().default(15),
  language:           varchar('language', { length: 10 }).notNull().default('en'),
  updatedAt:          timestamp('updated_at').defaultNow().notNull(),
})

// === MERCHANT DESIGN ===
export const merchantDesign = pgTable('merchant_design', {
  id:                    uuid('id').defaultRandom().primaryKey(),
  merchantId:            uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }).unique(),
  pageHeadline:          varchar('page_headline', { length: 200 }).notNull().default('Book an appointment'),
  pageSubheadline:       varchar('page_subheadline', { length: 300 }).notNull().default('Fast, easy, online'),
  slotAvailableBg:       varchar('slot_available_bg', { length: 7 }).notNull().default('#ECFDF5'),
  slotAvailableText:     varchar('slot_available_text', { length: 7 }).notNull().default('#065F46'),
  slotUnavailableBg:     varchar('slot_unavailable_bg', { length: 7 }).notNull().default('#F1F5F9'),
  slotUnavailableText:   varchar('slot_unavailable_text', { length: 7 }).notNull().default('#475569'),  // Slate-600 (AA compliant)
  calendarBorderRadius:  integer('calendar_border_radius').notNull().default(8),
  calendarBorderWidth:   integer('calendar_border_width').notNull().default(1),
  calendarBorderColor:   varchar('calendar_border_color', { length: 7 }).notNull().default('#E2E8F0'),
  calendarFontSize:      integer('calendar_font_size').notNull().default(14),
  updatedAt:             timestamp('updated_at').defaultNow().notNull(),
})

// === ADMIN USERS ===
export const adminUsers = pgTable('admin_users', {
  id:           uuid('id').defaultRandom().primaryKey(),
  merchantId:   uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  email:        varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role:         pgEnum('admin_role', ['owner', 'admin'])('role').notNull().default('admin'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailMerchantUniq: unique().on(table.email, table.merchantId),
}))

// === STAFF ===
export const staff = pgTable('staff', {
  id:          uuid('id').defaultRandom().primaryKey(),
  merchantId:  uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  name:        varchar('name', { length: 100 }).notNull(),
  email:       varchar('email', { length: 255 }),
  phone:       varchar('phone', { length: 30 }),
  photoUrl:    varchar('photo_url', { length: 500 }),
  isVisible:   boolean('is_visible').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// === STAFF AVAILABILITY (weekly recurring schedule) ===
export const staffAvailability = pgTable('staff_availability', {
  id:         uuid('id').defaultRandom().primaryKey(),
  staffId:    uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dayOfWeek:  integer('day_of_week').notNull(),  // 0=Monday … 6=Sunday
  startTime:  time('start_time').notNull(),      // e.g. "09:00"
  endTime:    time('end_time').notNull(),         // e.g. "18:00"
  maxConcurrent: integer('max_concurrent').notNull().default(1),
}, (table) => ({
  staffDayUniq: unique().on(table.staffId, table.dayOfWeek),
}))

// === STAFF BLOCKED DATES ===
export const staffBlockedDates = pgTable('staff_blocked_dates', {
  id:         uuid('id').defaultRandom().primaryKey(),
  staffId:    uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  startDate:  date('start_date').notNull(),
  endDate:    date('end_date').notNull(),
  reason:     varchar('reason', { length: 200 }),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

// === SERVICES ===
export const services = pgTable('services', {
  id:              uuid('id').defaultRandom().primaryKey(),
  merchantId:      uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  name:            varchar('name', { length: 100 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents:      integer('price_cents'),      // null = price hidden from booking page
  description:     text('description'),
  isEnabled:       boolean('is_enabled').notNull().default(true),
  displayOrder:    integer('display_order').notNull().default(0),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

// === CUSTOMERS ===
export const customers = pgTable('customers', {
  id:          uuid('id').defaultRandom().primaryKey(),
  merchantId:  uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  firstName:   varchar('first_name', { length: 100 }).notNull(),
  email:       varchar('email', { length: 255 }).notNull(),
  phone:       varchar('phone', { length: 30 }).notNull(),
  isVerified:  boolean('is_verified').notNull().default(false),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailMerchantUniq: unique().on(table.email, table.merchantId),
}))

// === BOOKINGS ===
export const bookingStatus = pgEnum('booking_status', [
  'confirmed', 'cancelled_by_customer', 'cancelled_by_admin', 'rescheduled', 'completed'
])

export const bookings = pgTable('bookings', {
  id:            uuid('id').defaultRandom().primaryKey(),
  merchantId:    uuid('merchant_id').notNull().references(() => merchants.id),
  customerId:    uuid('customer_id').notNull().references(() => customers.id),
  staffId:       uuid('staff_id').notNull().references(() => staff.id),
  serviceId:     uuid('service_id').notNull().references(() => services.id),
  startTime:     timestamp('start_time', { withTimezone: true }).notNull(),
  endTime:       timestamp('end_time', { withTimezone: true }).notNull(),
  status:        bookingStatus('status').notNull().default('confirmed'),
  cancelToken:   uuid('cancel_token').defaultRandom().notNull().unique(),
  merchantNotes: text('merchant_notes'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
})

// === BOOKING EVENTS (audit trail) ===
export const bookingEvents = pgTable('booking_events', {
  id:          uuid('id').defaultRandom().primaryKey(),
  bookingId:   uuid('booking_id').notNull().references(() => bookings.id),
  eventType:   varchar('event_type', { length: 50 }).notNull(),  // 'created' | 'rescheduled' | 'cancelled' | 'email_sent'
  payload:     jsonb('payload'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})
```

### 3.2 Entity Relationship Summary

```
merchants
  ├── merchantConfigs (1:1)
  ├── merchantDesign (1:1)
  ├── adminUsers (1:N)
  ├── staff (1:N)
  │     ├── staffAvailability (1:7 max, one per day)
  │     └── staffBlockedDates (1:N)
  ├── services (1:N)
  ├── customers (1:N)
  └── bookings (1:N)
        ├── → customers (N:1)
        ├── → staff (N:1)
        ├── → services (N:1)
        └── bookingEvents (1:N)
```

### 3.3 Key Indexes

```sql
-- Slug lookup (hot path — every customer page load)
CREATE UNIQUE INDEX idx_merchants_slug ON merchants(slug);

-- Booking availability queries (hot path — slot computation)
CREATE INDEX idx_bookings_staff_time ON bookings(staff_id, start_time, end_time) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_merchant ON bookings(merchant_id, start_time);

-- Customer dedup
CREATE UNIQUE INDEX idx_customers_email_merchant ON customers(email, merchant_id);

-- Cancel token lookup
CREATE UNIQUE INDEX idx_bookings_cancel_token ON bookings(cancel_token);
```

---

## 4. API Surface

### 4.1 Public APIs (no auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/check-slug?slug=xxx` | Slug availability check |
| GET | `/api/booking/slots?staffId=&serviceId=&date=` | Available time slots |
| POST | `/api/booking/confirm` | Create booking (guest checkout) |
| GET | `/api/cancel/:token` | Validate cancel token (returns booking info) |
| POST | `/api/cancel/:token` | Execute cancellation |

### 4.2 Admin APIs (JWT auth required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Merchant registration |
| POST | `/api/auth/login` | Admin login → JWT |
| GET | `/api/admin/bookings` | List bookings (with filters) |
| GET | `/api/admin/bookings/:id` | Single booking detail |
| PATCH | `/api/admin/bookings/:id` | Edit booking (notes, staff reassign) |
| POST | `/api/admin/bookings/:id/reschedule` | Reschedule + send email |
| POST | `/api/admin/bookings/:id/cancel` | Admin cancel booking |
| POST | `/api/admin/bookings/:id/resend-confirmation` | Resend confirmation email |
| GET | `/api/admin/staff` | List staff |
| POST | `/api/admin/staff` | Create staff |
| PATCH | `/api/admin/staff/:id` | Update staff |
| DELETE | `/api/admin/staff/:id` | Remove staff |
| PUT | `/api/admin/staff/:id/availability` | Set availability schedule |
| POST | `/api/admin/staff/:id/blocked-dates` | Add blocked date range |
| DELETE | `/api/admin/staff/:id/blocked-dates/:bdId` | Remove blocked dates |
| GET | `/api/admin/services` | List services |
| POST | `/api/admin/services` | Create service |
| PATCH | `/api/admin/services/:id` | Update service |
| DELETE | `/api/admin/services/:id` | Delete service |
| GET | `/api/admin/customers` | List customers (paginated) |
| GET | `/api/admin/customers/:id` | Customer detail + history |
| POST | `/api/admin/customers/:id/send-offer` | Send offer email |
| GET | `/api/admin/design` | Get design settings |
| PUT | `/api/admin/design` | Save design settings |
| GET | `/api/admin/settings` | Get all settings |
| PUT | `/api/admin/settings/config` | Save booking config |
| PUT | `/api/admin/settings/display` | Save display settings |
| POST | `/api/admin/settings/admins` | Add admin user |
| DELETE | `/api/admin/settings/admins/:id` | Remove admin user |
| GET | `/api/admin/export` | Export all data as JSON |

### 4.3 Response Envelope

All API responses follow a consistent envelope:

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string, details?: unknown } }
```

---

## 5. Authentication & Security

### 5.1 Admin Auth Strategy

Use **NextAuth.js v5** (Auth.js) with credentials provider:

```
src/lib/auth/
├── config.ts          # NextAuth config (credentials provider, callbacks)
├── session.ts         # Session type extension
└── middleware.ts      # Route protection helper
```

- JWT session stored in httpOnly cookie (`sameSite: strict`)
- Session payload: `{ userId, merchantId, role }`
- Admin layout (`src/app/(admin)/admin/layout.tsx`) checks session server-side; redirects to `/login` if unauthenticated
- All `/api/admin/*` routes validate session via `getServerSession()` and assert `session.merchantId` matches the resource's `merchantId`

### 5.2 Password Storage

- `bcrypt` with cost factor 12
- No password recovery in MVP (out of scope); merchant can contact support

### 5.3 Merchant Data Isolation

Every Drizzle query against tenant data **must** include `merchantId` in the WHERE clause. Pattern:

```typescript
// Always scope to the authenticated merchant — never trust client-supplied merchantId
const { merchantId } = await getAdminSession()  // throws if unauthenticated
const bookings = await db.query.bookings.findMany({
  where: eq(bookings.merchantId, merchantId),
  ...
})
```

### 5.4 Input Validation

All API route inputs validated with **Zod** before touching the database:

```typescript
// src/lib/validations/booking.ts
export const confirmBookingSchema = z.object({
  staffId:   z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  firstName: z.string().min(1).max(100),
  email:     z.string().email(),
  phone:     z.string().min(6).max(30),
})
```

### 5.5 Rate Limiting

Apply at edge middleware for sensitive routes:

| Route | Limit |
|-------|-------|
| `/api/check-slug` | 30 req/min per IP |
| `/api/booking/confirm` | 10 req/min per IP |
| `/api/cancel/:token` | 10 req/hour per token |
| `/api/auth/login` | 5 req/min per IP |

Use `@upstash/ratelimit` with Redis (or Vercel KV) for distributed rate limiting.

---

## 6. Slot Availability Engine

### 6.1 Core Logic (`src/lib/slots.ts`)

```
Input:
  staffId:         UUID
  serviceId:       UUID (to get durationMinutes)
  date:            string (YYYY-MM-DD)
  merchantConfig:  { slotDurationMins: number }

Output:
  availableSlots:  Array<{ startTime: Date; endTime: Date }>
```

**Algorithm:**

```
1. Fetch staff availability for day-of-week(date)
   → If staff not working that day → return []
   
2. Fetch all blocked date ranges for staffId overlapping date
   → If date is blocked → return []

3. Fetch existing confirmed bookings for staffId on date
   → occupiedIntervals: Array<{ start: Date, end: Date }>

4. Generate candidate slots:
   start = workStart, step = slotDurationMins
   while start + serviceDuration <= workEnd:
     candidates.push({ start, end: start + serviceDuration })
     start += slotDurationMins

5. Filter candidates:
   keep slot if NOT overlaps any occupiedInterval
   (overlap = slot.start < occ.end && slot.end > occ.start)

6. Filter past slots:
   if date == today: remove slots where start <= now + 30min buffer

7. Return surviving slots
```

### 6.2 Concurrency Safety

Bookings are created with an **optimistic conflict check** — not a database lock (MVP approach):

```typescript
// In /api/booking/confirm route handler:
const existing = await db.query.bookings.findFirst({
  where: and(
    eq(bookings.staffId, staffId),
    eq(bookings.status, 'confirmed'),
    lt(bookings.startTime, requestedEndTime),
    gt(bookings.endTime, requestedStartTime),
  )
})
if (existing) {
  return error(409, 'SLOT_TAKEN', 'This slot was just booked. Please choose another time.')
}
// then insert booking
```

*Post-MVP: upgrade to `SELECT FOR UPDATE` or advisory locks for high-traffic scenarios.*

### 6.3 API Route: `GET /api/booking/slots`

```typescript
// Query params: staffId, serviceId, date (YYYY-MM-DD), slug (merchant context)
// Returns: { slots: Array<{ startTime: string, endTime: string }> }
// Cache: no-store (always fresh)
```

---

## 7. Email Service (SendGrid)

### 7.1 Module Structure

```
src/lib/email/
├── client.ts           # SendGrid client init (from env.ts)
├── send.ts             # Generic send function with error handling + logging
└── templates/
    ├── booking-confirmation.ts       # To customer
    ├── booking-rescheduled.ts        # To customer (admin-initiated)
    ├── booking-cancelled-customer.ts # To customer (customer-initiated)
    ├── merchant-new-booking.ts       # To merchant
    └── merchant-booking-cancelled.ts # To merchant
```

### 7.2 Template Interface

```typescript
interface EmailTemplate {
  to:      string
  subject: string
  html:    string
  text:    string  // Plain text fallback — required for deliverability
}

type BookingConfirmationData = {
  customerName:   string
  businessName:   string
  staffName:      string
  serviceName:    string
  durationMins:   number
  startTime:      Date
  endTime:        Date
  cancelUrl:      string  // https://{slug}.platform.com/cancel/{token}
}
```

### 7.3 Trigger Points

| Event | Emails Sent |
|-------|-------------|
| Booking confirmed | → customer confirmation + cancel link; → merchant new-booking alert |
| Admin reschedules booking | → customer reschedule notification (no cancel link) |
| Customer cancels (cancel link) | → customer cancellation receipt; → merchant cancellation alert |
| Admin cancels booking | → customer cancellation receipt; → merchant cancellation alert |
| Admin resends confirmation | → customer confirmation (same template) |
| Admin sends offer email | → targeted customer(s) via offer template |

### 7.4 Environment Variables Required

```
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@platform.com
SENDGRID_FROM_NAME=BookFlow
NEXT_PUBLIC_ROOT_DOMAIN=platform.com
```

---

## 8. Cancel Token System

### 8.1 Token Design

- **Format**: UUID v4 (`crypto.randomUUID()`) stored as a column on the `bookings` table (`cancel_token`)
- **Generated**: at booking creation, never changes
- **URL**: `https://{slug}.platform.com/cancel/{token}`
- **No separate table**: the token is just a column; validation is a DB lookup

### 8.2 Validation Logic

```typescript
// GET /api/cancel/:token — returns booking info for display
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.cancelToken, params.token),
    with: { staff: true, service: true, customer: true }
  })

  if (!booking) return error(404, 'NOT_FOUND')
  if (booking.status !== 'confirmed') return error(409, 'ALREADY_CANCELLED')
  
  const now = new Date()
  const isExpired = now >= booking.startTime  // strictly: current time >= appointment start
  
  return json({ booking: sanitize(booking), isExpired })
}

// POST /api/cancel/:token — execute the cancellation
export async function POST(req: Request, { params }: { params: { token: string } }) {
  // Re-fetch with same validation
  // Update status → 'cancelled_by_customer'
  // Send emails (customer receipt + merchant alert)
  // Return success
}
```

### 8.3 Edge Cases

| Case | Behaviour |
|------|-----------|
| Token not found | 404 — "Link not found or invalid." |
| Already cancelled | 409 — "This booking has already been cancelled." |
| Token valid, time is `now >= startTime` | 410 — Expired page (C07) |
| Token valid, time is `now < startTime` | 200 — Cancel confirmation page (C05) |
| Customer cancels at exactly `startTime` | Expired (boundary: `>=`) |
| Admin already cancelled the booking | 409 — "This booking has already been cancelled." |

---

## 9. File & Module Structure

### 9.1 Additions to Existing Project

```
src/
├── app/
│   ├── (admin)/                   # new route group
│   │   ├── register/
│   │   ├── login/
│   │   └── admin/
│   │       ├── layout.tsx         # sidebar shell + auth guard
│   │       ├── page.tsx           # dashboard
│   │       ├── staff/
│   │       ├── services/
│   │       ├── customers/
│   │       ├── design/
│   │       └── settings/
│   ├── [slug]/                    # new — customer booking
│   │   ├── page.tsx
│   │   ├── confirmed/
│   │   └── cancel/[token]/
│   └── api/
│       ├── check-slug/route.ts    # new
│       ├── booking/               # new
│       └── cancel/[token]/        # new
│
├── components/
│   ├── ui/                        # existing shadcn/ui
│   ├── admin/                     # new — admin-specific components
│   │   ├── BookingCalendar.tsx
│   │   ├── BookingListTable.tsx
│   │   ├── BookingDetailModal.tsx
│   │   ├── RescheduleModal.tsx
│   │   ├── StaffCard.tsx
│   │   ├── ServiceCard.tsx
│   │   └── DesignPanel.tsx
│   └── booking/                   # new — customer booking components
│       ├── StaffSelector.tsx
│       ├── ServiceSelector.tsx
│       ├── SlotPicker.tsx
│       ├── BookingForm.tsx
│       ├── ExpiryCountdown.tsx
│       └── BookingSummary.tsx
│
├── lib/
│   ├── db/
│   │   ├── schema.ts              # updated — full schema
│   │   └── index.ts               # existing db client
│   ├── auth/
│   │   ├── config.ts              # new — NextAuth config
│   │   └── session.ts             # new — session helpers
│   ├── email/
│   │   ├── client.ts              # new
│   │   ├── send.ts                # new
│   │   └── templates/             # new (5 templates)
│   ├── slots.ts                   # new — availability engine
│   ├── validations/               # new — Zod schemas
│   │   ├── booking.ts
│   │   ├── staff.ts
│   │   └── services.ts
│   ├── env.ts                     # updated — new env vars
│   └── utils.ts                   # existing
│
└── middleware.ts                  # updated — subdomain routing
```

### 9.2 New Environment Variables

Add to `src/lib/env.ts`:

```typescript
export const env = createEnv({
  server: {
    DATABASE_URL:          z.string().url(),
    SENDGRID_API_KEY:      z.string().min(1),
    SENDGRID_FROM_EMAIL:   z.string().email(),
    SENDGRID_FROM_NAME:    z.string().default('BookFlow'),
    NEXTAUTH_SECRET:       z.string().min(32),
    NEXTAUTH_URL:          z.string().url(),
    NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
  },
  runtimeEnv: { ... }
})
```

---

## 10. Key Technology Decisions

### 10.1 Authentication: NextAuth.js v5

**Chosen over**: custom JWT implementation, Lucia, Clerk  
**Rationale**: minimal new dependencies, integrates cleanly with Next.js App Router, credentials provider sufficient for email+password, no third-party SaaS dependency.

### 10.2 Calendar UI: React-Day-Picker v9

**Chosen over**: FullCalendar, custom implementation  
**Rationale**: lightweight, headless-friendly, integrates with Tailwind, handles month/week navigation, accessible. Admin calendar dot-indicators implemented as custom cell rendering.

### 10.3 Slug Real-Time Check: `useDebouncedValue` + `useEffect` fetch

**Chosen over**: TanStack Query, SWR  
**Rationale**: single endpoint, simple use case; introducing a full data-fetching library for one check adds unnecessary weight. Re-evaluate if more admin client-side fetching emerges.

### 10.4 Colour Picker: `react-colorful`

**Chosen over**: custom implementation, `@radix-ui/colors`  
**Rationale**: 2.8kB, tree-shakeable, no extra dependencies, supports hex/RGB/HSL, accessible. Pair with a hex input for keyboard users.

### 10.5 Rate Limiting: Upstash Ratelimit + Vercel KV

**Chosen over**: in-memory rate limiting, custom Redis  
**Rationale**: stateless edge-compatible, no persistent server state, free tier sufficient for MVP. Falls back to no rate limiting in Docker/local dev if `UPSTASH_REDIS_REST_URL` is not set.

### 10.6 Form Handling: React Hook Form + Zod resolvers

**Chosen over**: Formik, native `<form>` with server actions  
**Rationale**: Consistent pattern already implied by the stack. Server Actions are an alternative for admin forms but add complexity for the booking flow's progressive multi-step UX.

### 10.7 Single-Staff Skip (UX Decision D-03)

The design flagged this as an open question. **Architectural answer**: computed at page load in the `[slug]/page.tsx` Server Component — if only one visible staff member exists, skip step 1 and pre-select them. No URL param needed; client receives `preselectedStaff` prop.

---

## 11. Data Flow Diagrams

### 11.1 Customer Booking Flow

```
Customer visits {slug}.platform.com
         │
         ▼
[Server Component: /app/[slug]/page.tsx]
  - Resolve merchant by slug (DB lookup, cached 60s)
  - Fetch staff list (visible only)
  - Fetch services list (enabled only)
  - Fetch merchant design tokens
  - Return: <BookingPage> with initial data as props
         │
         ▼
[Client: StaffSelector]
  user selects staff
         │
         ▼
[Client: ServiceSelector]
  user selects service
         │
         ▼
[Client: SlotPicker]
  user picks date → GET /api/booking/slots?staffId=&serviceId=&date=
  server returns available slots
  user selects slot
         │
         ▼
[Client: BookingForm]
  user enters name, email, phone
  countdown timer starts (UX only — no hard server-side hold in MVP)
         │
         ▼
POST /api/booking/confirm
  - Validate input (Zod)
  - Upsert customer record (by email+merchantId)
  - Optimistic conflict check on slot
  - Insert booking + generate cancelToken
  - Send emails (confirmation → customer, new-booking → merchant)
  - Return booking ID
         │
         ▼
Redirect to /confirmed?bookingId=...
```

### 11.2 Admin Reschedule Flow

```
Admin opens booking detail modal
Admin selects new date → client fetches /api/booking/slots
Admin selects slot → clicks "Confirm reschedule"
         │
         ▼
POST /api/admin/bookings/:id/reschedule
  - Auth check (session.merchantId == booking.merchantId)
  - Optimistic conflict check on new slot
  - Update booking: startTime, endTime, status='rescheduled' (or keep 'confirmed')
  - Insert bookingEvent: { type: 'rescheduled', payload: { oldStart, newStart } }
  - Send rescheduling email to customer (no cancel link)
  - Return updated booking
         │
         ▼
Modal closes, dashboard re-fetches (or optimistic update via mutate)
```

### 11.3 Registration Flow

```
Merchant visits /register
  - Types business name → auto-suggests slug (client-side: kebab-case transform)
  - Types slug → debounce 400ms → GET /api/check-slug?slug=xxx
  - Fills email + password
  - Submits
         │
         ▼
POST /api/auth/register
  - Validate input (Zod)
  - Check slug uniqueness again (authoritative)
  - Hash password (bcrypt 12)
  - Insert merchant + merchantConfigs (defaults) + merchantDesign (defaults) + adminUser (owner)
  - Create session (NextAuth signIn)
  - Return redirect to /admin
```

---

## 12. Open Architecture Decisions

| # | Question | Recommendation | Priority |
|---|----------|----------------|----------|
| A-01 | Timezone handling: should `startTime` be stored in UTC or merchant local time? | Store UTC always; derive display timezone from merchant settings (add `timezone` column to `merchantConfigs`). Display in local time using `Intl.DateTimeFormat`. | **Must resolve before schema migration** |
| A-02 | Should slot holds be implemented as a DB reservation (prevents double-booking during form fill)? | MVP: optimistic check on submit only (simpler, lower infra). Post-MVP: add a `slot_holds` table with TTL + cron cleanup if double-booking complaints arise. | Post-MVP |
| A-03 | Image upload for staff photos: where stored? | Vercel Blob or Cloudflare R2 (add `BLOB_READ_WRITE_TOKEN` env var). Avoid storing in PostgreSQL. Use presigned upload URL pattern. | Needed before staff photo feature |
| A-04 | Design module live preview: iframe vs CSS var injection? | CSS custom properties (`--slot-available-bg` etc.) injected into the booking page; admin Design page reads from the current draft state and injects into an iframe pointing at `?preview=1`. Simpler than postMessage. | Needed before Design module |
| A-05 | "Any staff" option (D-01 from design): skip or implement in MVP? | Implement as a pseudo-staff option server-side: when customer selects "No preference," run slot computation for ALL visible staff and merge/deduplicate time windows, then assign staff randomly at confirmation time. | Post-MVP by default; flag for PM |
| A-06 | Offer email: send via queue or synchronously? | Synchronous in MVP (SendGrid API call in route handler). If batch sending (all 47 customers) times out on Vercel's 10s limit, move to a background job (Vercel Cron + queue table) post-MVP. | Monitor in production |

---

*Architecture blueprint produced by Architect for task MW3-0001-blueprint. Schema defined, API surface specified, core algorithms documented, key technology decisions justified. Ready for engineering sprint planning.*
