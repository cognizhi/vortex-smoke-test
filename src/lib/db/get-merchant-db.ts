/**
 * Per-slug database resolver.
 *
 * Looks up the merchant's private PostgreSQL schema name from the platform
 * registry, then returns a scoped Drizzle ORM instance for that schema.
 *
 * The result is cached in-process so repeated calls within the same Next.js
 * server instance (warm lambda / long-lived Docker container) skip the extra
 * SELECT.  The cache is safe to use indefinitely because schema names are
 * immutable once provisioned.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { env } from '../env';
import { merchants } from './platform-schema';
import { createMerchantSchema } from './merchant-schema';

// ---------------------------------------------------------------------------
// Shared connection pool (re-used across all merchant DB lookups)
// ---------------------------------------------------------------------------
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
    });
  }
  return _pool;
}

// ---------------------------------------------------------------------------
// Platform DB (for slug → schemaName lookup)
// ---------------------------------------------------------------------------
import * as platformSchemaExports from './platform-schema';

function getPlatformDb() {
  return drizzle(getPool(), { schema: platformSchemaExports });
}

// ---------------------------------------------------------------------------
// In-process cache: slug → Drizzle instance scoped to that merchant's schema
// ---------------------------------------------------------------------------
type MerchantDb = ReturnType<typeof drizzle>;

const dbCache = new Map<string, MerchantDb>();

/** Thrown when a slug has no corresponding active merchant record */
export class MerchantNotFoundError extends Error {
  constructor(slug: string) {
    super(`Merchant not found or not active: ${slug}`);
    this.name = 'MerchantNotFoundError';
  }
}

/**
 * Resolve a merchant slug to a Drizzle instance scoped to that merchant's
 * private PostgreSQL schema.
 *
 * @throws {MerchantNotFoundError} if the slug doesn't exist or merchant status
 *   is not `active`.
 */
export async function getMerchantDb(slug: string): Promise<MerchantDb> {
  const cached = dbCache.get(slug);
  if (cached) return cached;

  const platformDb = getPlatformDb();

  const merchant = await platformDb.query.merchants.findFirst({
    where: eq(merchants.slug, slug),
  });

  if (!merchant || merchant.status !== 'active') {
    throw new MerchantNotFoundError(slug);
  }

  const schema = createMerchantSchema(merchant.schemaName);
  const db = drizzle(getPool(), { schema });

  dbCache.set(slug, db);
  return db;
}

/**
 * Evict a slug from the in-process cache.
 * Useful in tests and after status changes (e.g. merchant suspended).
 */
export function evictMerchantDbCache(slug: string): void {
  dbCache.delete(slug);
}

/**
 * Clear the entire in-process cache.
 * Useful in tests to prevent state leakage between test cases.
 */
export function clearMerchantDbCache(): void {
  dbCache.clear();
}
