/**
 * Merchant provisioning — executed once during registration.
 *
 * Steps (all within a single transaction where possible):
 *  1. Insert `platform.merchants` record with status = 'provisioning'
 *  2. CREATE SCHEMA merchant_<id>
 *  3. CREATE TABLE … for every merchant table (DDL executed via raw SQL)
 *  4. Seed default `merchant_settings` and `merchant_design` rows
 *  5. Insert the owner `admin_users` record
 *  6. Flip merchant status to 'active'
 *
 * On any failure the merchant record is deleted (best-effort rollback) so
 * subsequent registration attempts with the same slug/email can succeed.
 */
import { Pool } from 'pg';
import { env } from '../env';
import { merchants } from './platform-schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip hyphens from a UUIDv4 string to produce a 32-char hex identifier */
export function slugifyUuid(id: string): string {
  return id.replace(/-/g, '');
}

/** Derive the PostgreSQL schema name from a merchant UUID */
export function schemaNameFromId(merchantId: string): string {
  return `merchant_${slugifyUuid(merchantId)}`;
}

/**
 * Validate a merchant slug:
 * - 3–30 chars
 * - Lowercase letters, digits, hyphens only
 * - Must start and end with a letter or digit
 * - Must not be a reserved slug
 *
 * Returns `true` if valid.
 */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  'www', 'api', 'admin', 'app', 'mail', 'static',
  'support', 'help', 'billing', 'status',
]);

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug) && !RESERVED_SLUGS.has(slug);
}

// ---------------------------------------------------------------------------
// DDL helpers — raw SQL to create all merchant tables in a given schema
// ---------------------------------------------------------------------------

/**
 * Return the CREATE TABLE … statements for all merchant tables, scoped to
 * `schemaName`.  Drizzle migrations aren't used here because each merchant
 * schema is created dynamically at runtime.
 */
function merchantDdl(schemaName: string): string {
  const q = (name: string) => `"${schemaName}"."${name}"`;

  return `
    CREATE TABLE IF NOT EXISTS ${q('admin_users')} (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'admin'
                      CHECK (role IN ('owner', 'admin')),
      avatar_url    TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${q('staff')} (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name           TEXT NOT NULL,
      photo_url      TEXT,
      contact_number TEXT,
      email          TEXT,
      is_visible     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${q('staff_availability')} (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id       UUID NOT NULL REFERENCES ${q('staff')}(id) ON DELETE CASCADE,
      day_of_week    INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_time     TEXT NOT NULL,
      end_time       TEXT NOT NULL,
      max_concurrent INTEGER NOT NULL DEFAULT 1,
      UNIQUE (staff_id, day_of_week)
    );

    CREATE INDEX IF NOT EXISTS idx_staff_avail_staff
      ON ${q('staff_availability')} (staff_id);

    CREATE TABLE IF NOT EXISTS ${q('staff_blocked_dates')} (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id   UUID NOT NULL REFERENCES ${q('staff')}(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date   TEXT NOT NULL,
      reason     TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_blocked_dates_staff
      ON ${q('staff_blocked_dates')} (staff_id, start_date, end_date);

    CREATE TABLE IF NOT EXISTS ${q('services')} (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name             TEXT NOT NULL,
      description      TEXT,
      duration_minutes INTEGER NOT NULL,
      price_cents      INTEGER,
      is_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${q('customers')} (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email              TEXT NOT NULL UNIQUE,
      first_name         TEXT NOT NULL,
      contact_number     TEXT NOT NULL,
      is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT UNIQUE,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_customers_email
      ON ${q('customers')} (email);

    CREATE SEQUENCE IF NOT EXISTS ${q('booking_number_seq')} START 1000;

    CREATE TABLE IF NOT EXISTS ${q('bookings')} (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id         UUID NOT NULL REFERENCES ${q('customers')}(id),
      staff_id            UUID NOT NULL REFERENCES ${q('staff')}(id),
      service_id          UUID NOT NULL REFERENCES ${q('services')}(id),
      start_time          TIMESTAMPTZ NOT NULL,
      end_time            TIMESTAMPTZ NOT NULL,
      status              TEXT NOT NULL DEFAULT 'confirmed'
                            CHECK (status IN (
                              'confirmed','cancelled_customer',
                              'cancelled_admin','rescheduled'
                            )),
      cancel_token        TEXT NOT NULL UNIQUE,
      cancelled_at        TIMESTAMPTZ,
      rescheduled_from_id UUID REFERENCES ${q('bookings')}(id),
      confirmation_number TEXT NOT NULL UNIQUE,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_staff_time
      ON ${q('bookings')} (staff_id, start_time, end_time)
      WHERE status = 'confirmed';

    CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token
      ON ${q('bookings')} (cancel_token);

    CREATE INDEX IF NOT EXISTS idx_bookings_customer
      ON ${q('bookings')} (customer_id);

    CREATE TABLE IF NOT EXISTS ${q('merchant_settings')} (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_duration_minutes  INTEGER NOT NULL DEFAULT 30,
      booking_expiry_minutes INTEGER NOT NULL DEFAULT 15,
      display_language       TEXT NOT NULL DEFAULT 'en'
    );

    CREATE TABLE IF NOT EXISTS ${q('merchant_design')} (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_headline          TEXT DEFAULT 'Book an appointment',
      page_subheadline       TEXT DEFAULT 'Fast, easy, online booking',
      slot_available_bg      TEXT NOT NULL DEFAULT '#ECFDF5',
      slot_available_text    TEXT NOT NULL DEFAULT '#065F46',
      slot_unavailable_bg    TEXT NOT NULL DEFAULT '#F1F5F9',
      slot_unavailable_text  TEXT NOT NULL DEFAULT '#475569',
      calendar_border_width  INTEGER NOT NULL DEFAULT 1,
      calendar_border_color  TEXT NOT NULL DEFAULT '#E2E8F0',
      calendar_border_radius INTEGER NOT NULL DEFAULT 8,
      calendar_font_size     INTEGER NOT NULL DEFAULT 14,
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ${q('discounts')} (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code            TEXT NOT NULL UNIQUE,
      type            TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
      value           NUMERIC(10, 2) NOT NULL,
      description     TEXT,
      starts_at       TIMESTAMPTZ NOT NULL,
      ends_at         TIMESTAMPTZ NOT NULL,
      is_active       BOOLEAN NOT NULL DEFAULT TRUE,
      times_used      INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_discounts_code
      ON ${q('discounts')} (code);

    CREATE INDEX IF NOT EXISTS idx_discounts_active
      ON ${q('discounts')} (is_active, expiration_date);
  `;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ProvisionMerchantParams {
  slug: string;
  businessName: string;
  ownerEmail: string;
  passwordHash: string;
  ownerName: string;
}

export interface ProvisionMerchantResult {
  merchantId: string;
  schemaName: string;
  bookingPageUrl: string;
  dashboardUrl: string;
}

/**
 * Provision a new merchant:
 *  - Creates the platform.merchants record
 *  - Creates the private PostgreSQL schema with all tables
 *  - Seeds default settings, design, and the owner admin_users record
 *  - Returns the merchant ID, schema name, and URLs
 *
 * This function is **not** idempotent — calling it twice with the same slug
 * will fail on the UNIQUE constraint for `slug`.
 *
 * @throws if provisioning fails (the partial merchant record is cleaned up)
 */
export async function provisionMerchant(
  params: ProvisionMerchantParams
): Promise<ProvisionMerchantResult> {
  const { slug, businessName, ownerEmail, passwordHash, ownerName } = params;

  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });

  // Use a dedicated client so we can execute DDL within a transaction
  const client = await pool.connect();

  let merchantId: string | null = null;

  try {
    await client.query('BEGIN');

    // 1. Ensure platform schema exists (idempotent)
    await client.query('CREATE SCHEMA IF NOT EXISTS platform');

    // 2. Ensure platform.merchants table exists (for initial bootstrap)
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform.merchants (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug          TEXT NOT NULL UNIQUE,
        business_name TEXT NOT NULL,
        owner_email   TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        schema_name   TEXT NOT NULL UNIQUE,
        status        TEXT NOT NULL DEFAULT 'provisioning',
        cancelled_at  TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_slug ON platform.merchants(slug)`
    );

    // 3. Insert merchant record with status = 'provisioning'
    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO platform.merchants
         (slug, business_name, owner_email, password_hash, schema_name, status)
       VALUES ($1, $2, $3, $4, '', 'provisioning')
       RETURNING id`,
      [slug, businessName, ownerEmail, passwordHash]
    );

    merchantId = insertResult.rows[0].id;
    const schemaName = schemaNameFromId(merchantId);

    // 4. Update the schema_name now that we have the ID
    await client.query(
      `UPDATE platform.merchants SET schema_name = $1 WHERE id = $2`,
      [schemaName, merchantId]
    );

    // 5. Create the private schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 6. Create all merchant tables
    await client.query(merchantDdl(schemaName));

    // 7. Seed default settings
    await client.query(
      `INSERT INTO "${schemaName}"."merchant_settings"
         (slot_duration_minutes, booking_expiry_minutes, display_language)
       VALUES (30, 15, 'en')`
    );

    // 8. Seed default design
    await client.query(
      `INSERT INTO "${schemaName}"."merchant_design" DEFAULT VALUES`
    );

    // 9. Insert owner admin_users record
    await client.query(
      `INSERT INTO "${schemaName}"."admin_users"
         (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'owner')`,
      [ownerEmail, passwordHash, ownerName]
    );

    // 10. Mark merchant as active
    await client.query(
      `UPDATE platform.merchants SET status = 'active' WHERE id = $1`,
      [merchantId]
    );

    await client.query('COMMIT');

    const platformDomain = env.PLATFORM_DOMAIN;

    return {
      merchantId,
      schemaName,
      bookingPageUrl: `https://${slug}.${platformDomain}`,
      dashboardUrl: `https://${slug}.${platformDomain}/admin`,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {/* ignore rollback errors */});

    // Best-effort cleanup: remove the partially-inserted merchant record
    if (merchantId) {
      await pool
        .query(`DELETE FROM platform.merchants WHERE id = $1`, [merchantId])
        .catch(() => {/* ignore */});
    }

    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Drop a merchant's private schema and all its data.
 * Intended for use after the grace period following account cancellation.
 *
 * @param schemaName  e.g. "merchant_a1b2c3d4..."
 */
export async function dropMerchantSchema(schemaName: string): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 2 });
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    await pool.end();
  }
}

// Re-export the platform schema Drizzle helper used by other modules
export { merchants };
