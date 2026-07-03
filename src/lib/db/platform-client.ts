/**
 * Singleton Drizzle ORM client for the `platform` PostgreSQL schema.
 *
 * Use this for all queries against `platform.merchants`.
 * For per-merchant data, use `getMerchantDb(slug)` from `./get-merchant-db`.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env';
import * as platformSchemaExports from './platform-schema';

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

export const platformDb = drizzle(getPool(), { schema: platformSchemaExports });

export type PlatformDatabase = typeof platformDb;
