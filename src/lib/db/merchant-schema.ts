/**
 * Per-merchant Drizzle schema factory.
 *
 * Each merchant gets a private PostgreSQL schema (`merchant_<32hexchars>`).
 * This factory creates a fully-typed set of Drizzle table definitions scoped
 * to that named schema.  Call `createMerchantSchema(schemaName)` once per
 * slug and cache the result.
 *
 * Tables (all within the merchant's private schema):
 *  - admin_users
 *  - staff + staff_availability + staff_blocked_dates
 *  - services
 *  - customers
 *  - bookings
 *  - merchant_settings
 *  - merchant_design
 *  - merchant_branding
 *  - discounts
 */
import {
  boolean,
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a fully-typed Drizzle schema for the given PostgreSQL schema name.
 *
 * @param schemaName  e.g. "merchant_a1b2c3d4e5f6..."
 */
export function createMerchantSchema(schemaName: string) {
  const s = pgSchema(schemaName);

  // -------------------------------------------------------------------------
  // admin_users — people who can log in to the admin panel
  // -------------------------------------------------------------------------
  const adminUsers = s.table('admin_users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role', { enum: ['owner', 'admin'] })
      .notNull()
      .default('admin'),
    /** Avatar URL/path (PROJ-42); null = no avatar (initials shown instead) */
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // staff
  // -------------------------------------------------------------------------
  const staff = s.table('staff', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    photoUrl: text('photo_url'),
    contactNumber: text('contact_number'),
    email: text('email'),
    /** Controls visibility on the public booking page */
    isVisible: boolean('is_visible').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // staff_availability — recurring weekly working hours
  // -------------------------------------------------------------------------
  const staffAvailability = s.table(
    'staff_availability',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      staffId: uuid('staff_id')
        .notNull()
        .references(() => staff.id, { onDelete: 'cascade' }),
      /** 0 = Sunday … 6 = Saturday */
      dayOfWeek: integer('day_of_week').notNull(),
      /** "09:00" (HH:MM, 24-hr) */
      startTime: text('start_time').notNull(),
      /** "18:00" */
      endTime: text('end_time').notNull(),
      /** How many bookings can overlap in the same slot */
      maxConcurrent: integer('max_concurrent').notNull().default(1),
    },
    (t) => ({
      staffDayUniq: unique().on(t.staffId, t.dayOfWeek),
    })
  );

  // -------------------------------------------------------------------------
  // staff_blocked_dates — date ranges when a staff member is unavailable
  // -------------------------------------------------------------------------
  const staffBlockedDates = s.table('staff_blocked_dates', {
    id: uuid('id').primaryKey().defaultRandom(),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    /** "2026-06-20" (YYYY-MM-DD, inclusive start) */
    startDate: text('start_date').notNull(),
    /** "2026-06-27" (YYYY-MM-DD, inclusive end) */
    endDate: text('end_date').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // services
  // -------------------------------------------------------------------------
  const services = s.table('services', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes').notNull(),
    /** null = price not shown on booking page */
    priceCents: integer('price_cents'),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // customers
  // -------------------------------------------------------------------------
  const customers = s.table('customers', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    firstName: text('first_name').notNull(),
    contactNumber: text('contact_number').notNull(),
    /** CRM-only tracking; does NOT gate booking */
    isVerified: boolean('is_verified').notNull().default(false),
    /** Cleared after verification completes */
    verificationToken: text('verification_token').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // bookings
  // -------------------------------------------------------------------------
  const bookings = s.table('bookings', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: text('status', {
      enum: ['confirmed', 'cancelled_customer', 'cancelled_admin', 'rescheduled'],
    })
      .notNull()
      .default('confirmed'),
    /** HMAC-signed token embedded in the cancel URL */
    cancelToken: text('cancel_token').notNull().unique(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    /** Points to the previous booking when admin reschedules */
    rescheduledFromId: uuid('rescheduled_from_id'),
    /** Human-readable reference, e.g. "BK-1042" */
    confirmationNumber: text('confirmation_number').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // merchant_settings
  // -------------------------------------------------------------------------
  const merchantSettings = s.table('merchant_settings', {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Slot duration shown to customers (15 | 30 | 60 minutes) */
    slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
    /** Window (minutes) for customer to complete booking form (5–60) */
    bookingExpiryMinutes: integer('booking_expiry_minutes').notNull().default(15),
    displayLanguage: text('display_language').notNull().default('en'),
  });

  // -------------------------------------------------------------------------
  // merchant_design — visual customisation for the public booking page
  // -------------------------------------------------------------------------
  const merchantDesign = s.table('merchant_design', {
    id: uuid('id').primaryKey().defaultRandom(),
    pageHeadline: text('page_headline').default('Book an appointment'),
    pageSubheadline: text('page_subheadline').default('Fast, easy, online booking'),
    slotAvailableBg: text('slot_available_bg').notNull().default('#ECFDF5'),
    slotAvailableText: text('slot_available_text').notNull().default('#065F46'),
    slotUnavailableBg: text('slot_unavailable_bg').notNull().default('#F1F5F9'),
    slotUnavailableText: text('slot_unavailable_text').notNull().default('#475569'),
    calendarBorderWidth: integer('calendar_border_width').notNull().default(1),
    calendarBorderColor: text('calendar_border_color').notNull().default('#E2E8F0'),
    calendarBorderRadius: integer('calendar_border_radius').notNull().default(8),
    calendarFontSize: integer('calendar_font_size').notNull().default(14),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // merchant_branding — merchant branding configuration (site name, avatar)
  // -------------------------------------------------------------------------
  const merchantBranding = s.table('merchant_branding', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteName: text('site_name'), // Optional merchant site name
    avatarUrl: text('avatar_url'), // Optional merchant avatar URL
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  });

  // -------------------------------------------------------------------------
  // discounts — discount codes for bookings
  // -------------------------------------------------------------------------
  const discounts = s.table(
    'discounts',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      code: text('code').notNull(),
      type: text('type', { enum: ['percentage', 'fixed_amount'] }).notNull(),
      value: numeric('value', { precision: 10, scale: 2 }).notNull(),
      description: text('description'),
      expirationDate: timestamp('expiration_date', { withTimezone: true }).notNull(),
      isActive: boolean('is_active').notNull().default(true),
      timesUsed: integer('times_used').notNull().default(0),
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
      codeUnique: unique().on(t.code),
    })
  );

  return {
    adminUsers,
    staff,
    staffAvailability,
    staffBlockedDates,
    services,
    customers,
    bookings,
    merchantSettings,
    merchantDesign,
    merchantBranding,
    discounts,
  } as const;
}

export type MerchantSchemaType = ReturnType<typeof createMerchantSchema>;

export type Discount = MerchantSchemaType['discounts']['$inferSelect'];
export type InsertDiscount = MerchantSchemaType['discounts']['$inferInsert'];
