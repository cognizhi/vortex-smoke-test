/**
 * Branding query functions for merchant branding management.
 *
 * Handles upsert operations with proper partial update support using
 * the conditional object building pattern (no undefined values to Drizzle).
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { MerchantSchemaType } from './merchant-schema';

export interface BrandingRow {
  id: string;
  siteName: string | null;
  avatarUrl: string | null;
  updatedAt: Date;
}

/**
 * Upsert branding record with conditional field updates.
 * Only includes fields that are actually provided (not undefined).
 *
 * @param db Merchant-scoped Drizzle instance
 * @param schema Merchant schema
 * @param siteName Optional site name to update
 * @param avatarUrl Optional avatar URL to update
 * @returns The upserted branding row
 */
export async function upsertBranding(
  db: NodePgDatabase<{ schema: MerchantSchemaType }>,
  schema: MerchantSchemaType,
  siteName?: string,
  avatarUrl?: string
): Promise<BrandingRow> {
  const now = new Date();

  // Get existing branding record
  const existing = await db.select().from(schema.merchantBranding).limit(1);
  const brandingId = existing[0]?.id;

  if (brandingId) {
    // Update existing record
    const updateSet: Record<string, unknown> = { updatedAt: now };
    if (siteName !== undefined) updateSet.siteName = siteName;
    if (avatarUrl !== undefined) updateSet.avatarUrl = avatarUrl;

    const [result] = await db
      .update(schema.merchantBranding)
      .set(updateSet)
      .returning();

    if (!result) {
      throw new Error('Failed to update branding');
    }

    return result as BrandingRow;
  } else {
    // Insert new record
    const [result] = await db
      .insert(schema.merchantBranding)
      .values({
        siteName: siteName || null,
        avatarUrl: avatarUrl || null,
        updatedAt: now,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to insert branding');
    }

    return result as BrandingRow;
  }
}

/**
 * Retrieve the branding record for the merchant.
 *
 * @param db Merchant-scoped Drizzle instance
 * @param schema Merchant schema
 * @returns The branding row, or null if not found
 */
export async function getBranding(
  db: NodePgDatabase<{ schema: MerchantSchemaType }>,
  schema: MerchantSchemaType
): Promise<BrandingRow | null> {
  const rows = await db.select().from(schema.merchantBranding).limit(1);
  return rows[0] ? (rows[0] as BrandingRow) : null;
}
