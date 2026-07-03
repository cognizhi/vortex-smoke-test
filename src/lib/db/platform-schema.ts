/**
 * Platform-level schema (`platform` PostgreSQL schema).
 *
 * This is the registry that maps merchant slugs → their private PostgreSQL schemas.
 * All other per-merchant data lives in merchant_<id> schemas, NOT here.
 */
import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Named PostgreSQL schema for all platform-level tables */
export const platformSchema = pgSchema('platform');

// ---------------------------------------------------------------------------
// Merchants registry
// ---------------------------------------------------------------------------

export const merchants = platformSchema.table('merchants', {
  /** UUIDv4 primary key */
  id: uuid('id').primaryKey().defaultRandom(),

  /** URL-safe slug chosen by the merchant at registration (e.g. "glamour-studio") */
  slug: text('slug').notNull().unique(),

  /** Display name of the business */
  businessName: text('business_name').notNull(),

  /** Email of the account owner (used for login + alerts) */
  ownerEmail: text('owner_email').notNull().unique(),

  /** bcrypt-hashed owner password */
  passwordHash: text('password_hash').notNull(),

  /**
   * Name of the private PostgreSQL schema for this merchant's data.
   * Format: `merchant_<32-char-hex-uuid>` (hyphens stripped from UUIDv4)
   */
  schemaName: text('schema_name').notNull().unique(),

  /**
   * Lifecycle status:
   *  - `provisioning` — schema is being created (transient, <1 s normally)
   *  - `active`       — fully operational
   *  - `suspended`    — admin-suspended; cannot accept bookings
   *  - `cancelled`    — merchant self-cancelled; in grace period
   */
  status: text('status', {
    enum: ['provisioning', 'active', 'suspended', 'cancelled'],
  })
    .notNull()
    .default('provisioning'),

  /** Set when status transitions to 'cancelled'; used to schedule schema deletion */
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = typeof merchants.$inferInsert;
export type MerchantStatus = Merchant['status'];
