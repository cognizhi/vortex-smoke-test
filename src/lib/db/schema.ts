import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Users table — general platform-level users
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Merchant branding settings — customization of site name and avatar per merchant
 *
 * One record per merchant (merchant_id is unique).
 * Nullable fields indicate "use default" when NULL.
 *
 * Fields:
 *  - id: UUID primary key
 *  - merchantId: UUID, unique foreign key to platform.merchants.id
 *  - siteName: Custom site name (NULL = use default)
 *  - avatarUrl: URL to custom avatar image (NULL = use default)
 *  - createdAt: Record creation timestamp
 *  - updatedAt: Last modification timestamp
 */
export const merchantBranding = pgTable('merchant_branding', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().unique(),
  siteName: text('site_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Type for selecting merchant branding records from the database.
 * All fields are guaranteed to be present (except nullable ones).
 */
export type MerchantBranding = typeof merchantBranding.$inferSelect;

/**
 * Type for inserting merchant branding records.
 * Optional fields will use their defaults if omitted.
 */
export type InsertMerchantBranding = typeof merchantBranding.$inferInsert;
