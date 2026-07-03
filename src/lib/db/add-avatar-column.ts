/**
 * Backfill migration (PROJ-42): add `avatar_url` to every existing merchant's
 * `admin_users` table.
 *
 * Per-merchant schemas are created via raw DDL at provision time (see
 * `provision-merchant.ts`), so drizzle-kit migrations don't reach them. New
 * merchants already get the column from the updated `merchantDdl()`; this script
 * adds it to schemas that were provisioned before the column existed.
 *
 * Idempotent — safe to re-run. Run with:
 *   node --env-file=.env --import tsx/esm src/lib/db/add-avatar-column.ts
 */
import { Pool } from 'pg';
import { env } from '../env';

export async function addAvatarColumnToAllMerchants(pool: Pool): Promise<number> {
  const { rows } = await pool.query<{ schema_name: string }>(
    `SELECT schema_name FROM platform.merchants WHERE schema_name <> ''`,
  );

  let updated = 0;
  for (const { schema_name } of rows) {
    await pool.query(
      `ALTER TABLE "${schema_name}"."admin_users" ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    );
    updated += 1;
  }
  return updated;
}

// Allow running as a standalone script (skipped when imported by tests).
if (process.argv[1] && process.argv[1].endsWith('add-avatar-column.ts')) {
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 2 });
  addAvatarColumnToAllMerchants(pool)
    .then((n) => {
      console.log(`avatar_url ensured on ${n} merchant schema(s).`);
    })
    .catch((err) => {
      console.error('Failed to add avatar_url column:', err);
      process.exitCode = 1;
    })
    .finally(() => {
      void pool.end();
    });
}
