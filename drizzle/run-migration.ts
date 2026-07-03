/**
 * Migration runner: Apply discounts table migration to all merchant databases
 *
 * Usage:
 *   npx ts-node drizzle/run-migration.ts [--dry-run]
 *
 * Flags:
 *   --dry-run    Print SQL that would be executed, don't actually run it
 *
 * This script:
 * 1. Connects to the platform database
 * 2. Gets list of all merchant schemas
 * 3. For each merchant schema:
 *    - Executes the discounts table migration
 *    - Verifies table was created
 *    - Logs results
 * 4. Reports success/failure for each merchant
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const dryRun = process.argv.includes('--dry-run')

/**
 * Read migration SQL from file
 */
function readMigrationSql(): string {
  const filePath = path.join(__dirname, '0001_add_discounts_to_existing_merchants.sql')
  let sql = fs.readFileSync(filePath, 'utf-8')

  // Extract only the SQL statements, skip comments
  const lines = sql
    .split('\n')
    .filter((line) => !line.startsWith('--') && line.trim())
    .join('\n')

  return lines
}

/**
 * Get all merchant schema names from platform.merchants
 */
async function getMerchantSchemas(): Promise<string[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT DISTINCT schemaName FROM platform.merchants WHERE status = 'active' ORDER BY schemaName`
    )
    return result.rows.map((row) => row.schemaName || `merchant_${row.id}`)
  } finally {
    client.release()
  }
}

/**
 * Apply migration to a single merchant schema
 */
async function applyMigrationToSchema(schemaName: string): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect()
  try {
    const migrationSql = readMigrationSql()

    if (dryRun) {
      console.log(`[DRY-RUN] ${schemaName}`)
      console.log(`  SQL: ${migrationSql.substring(0, 100)}...`)
      return { success: true, message: 'Dry run only' }
    }

    // Execute migration in merchant schema context
    await client.query(`SET search_path TO "${schemaName}", public`)
    await client.query(migrationSql)

    // Verify table was created
    const verifyResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = '${schemaName}'
        AND table_name = 'discounts'
      ) as table_exists
    `)

    const tableExists = verifyResult.rows[0]?.table_exists

    if (tableExists) {
      return { success: true, message: 'Discounts table created successfully' }
    } else {
      return { success: false, message: 'Failed to create discounts table' }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message }
  } finally {
    client.release()
  }
}

/**
 * Main migration runner
 */
async function runMigration() {
  console.log('🚀 Discount Table Migration Runner')
  console.log('=====================================\n')

  if (dryRun) {
    console.log('📋 DRY-RUN MODE: No changes will be made\n')
  }

  try {
    // Get all merchant schemas
    console.log('📡 Fetching list of merchant databases...')
    const schemas = await getMerchantSchemas()
    console.log(`✓ Found ${schemas.length} active merchant(s)\n`)

    if (schemas.length === 0) {
      console.log('⚠️  No active merchants found. Migration not needed.')
      return
    }

    // Apply migration to each schema
    const results: Array<{ schema: string; success: boolean; message: string }> = []

    for (const schema of schemas) {
      process.stdout.write(`  Migrating ${schema}... `)
      const result = await applyMigrationToSchema(schema)
      results.push({ schema, ...result })

      if (result.success) {
        console.log(`✓ ${result.message}`)
      } else {
        console.log(`✗ ${result.message}`)
      }
    }

    // Summary
    console.log('\n📊 Migration Summary')
    console.log('=====================')
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`✓ Successful: ${successful}/${results.length}`)
    if (failed > 0) {
      console.log(`✗ Failed: ${failed}/${results.length}`)
      console.log('\nFailed merchants:')
      results.filter((r) => !r.success).forEach((r) => {
        console.log(`  - ${r.schema}: ${r.message}`)
      })
    }

    if (failed === 0) {
      console.log('\n🎉 All merchants successfully migrated!')
    } else {
      console.log(`\n⚠️  Migration incomplete. ${failed} merchant(s) failed.`)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run migration
runMigration()
