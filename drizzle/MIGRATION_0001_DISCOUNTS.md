# Migration 0001: Add Discounts Table to Existing Merchants

**Date**: 2026-06-28  
**Purpose**: Backfill discounts table for merchants provisioned before BKNG-0081  
**Status**: PENDING (awaiting execution)

## Migration SQL

Execute this SQL for EACH merchant database schema:

```sql
-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value           NUMERIC(10, 2) NOT NULL,
  description     TEXT,
  expiration_date TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  times_used      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_discounts_code
  ON discounts (code);

-- Create index for filtering by active/expiring discounts
CREATE INDEX IF NOT EXISTS idx_discounts_active
  ON discounts (is_active, expiration_date);
```

## Execution Instructions

### Using the Migration Runner

```bash
# Dry run (preview what will be executed)
npx ts-node drizzle/run-migration.ts --dry-run

# Actually run the migration
npx ts-node drizzle/run-migration.ts
```

### Manual Execution (for each merchant)

```bash
psql -U postgres -d merchant_db -c "SET search_path TO \"merchant_<id>\"; $(cat drizzle/MIGRATION_0001_DISCOUNTS.md | grep -A 20 'CREATE TABLE')"
```

## Verification

After migration, verify for each merchant:

```sql
-- Check table exists
SELECT COUNT(*) FROM discounts;
-- Expected: 0 (new table, empty)

-- Check table structure
\d discounts
-- Expected columns: id, code, type, value, description, expiration_date, 
--                   is_active, times_used, created_at, updated_at

-- Check indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'discounts';
-- Expected: idx_discounts_code, idx_discounts_active
```

## Rollback

If rollback is needed:

```sql
DROP TABLE IF EXISTS discounts CASCADE;
```

## Properties

- **Idempotent**: Yes (uses IF NOT EXISTS)
- **Reversible**: Yes (can drop table)
- **Data Loss**: None (additive only)
- **Breaking Changes**: None
- **Scope**: All existing merchant databases

## Status

- [ ] Migration execution planned
- [ ] Staging environment tested
- [ ] Production execution scheduled
- [ ] All merchants verified
- [ ] Migration documented
