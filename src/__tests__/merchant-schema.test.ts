/**
 * Unit tests for the per-merchant Drizzle schema factory.
 *
 * createMerchantSchema() is a pure function — it takes a schema name string
 * and returns a set of Drizzle table definitions scoped to that schema.
 * No database connection is required.
 */
import { describe, it, expect } from 'vitest';
import { createMerchantSchema } from '@/lib/db/merchant-schema';

describe('createMerchantSchema', () => {
  const SCHEMA = 'merchant_abc123';
  const schema = createMerchantSchema(SCHEMA);

  it('returns an object with all required table definitions', () => {
    expect(schema).toHaveProperty('adminUsers');
    expect(schema).toHaveProperty('staff');
    expect(schema).toHaveProperty('staffAvailability');
    expect(schema).toHaveProperty('staffBlockedDates');
    expect(schema).toHaveProperty('services');
    expect(schema).toHaveProperty('customers');
    expect(schema).toHaveProperty('bookings');
    expect(schema).toHaveProperty('merchantSettings');
    expect(schema).toHaveProperty('merchantDesign');
  });

  it('returns 9 table definitions', () => {
    expect(Object.keys(schema)).toHaveLength(9);
  });

  it('produces different instances for different schema names', () => {
    const a = createMerchantSchema('merchant_aaa');
    const b = createMerchantSchema('merchant_bbb');
    // The table objects should be distinct references
    expect(a.adminUsers).not.toBe(b.adminUsers);
  });

  it('each table definition is a non-null object', () => {
    for (const [key, table] of Object.entries(schema)) {
      expect(table, `table "${key}" should be defined`).toBeTruthy();
      expect(typeof table).toBe('object');
    }
  });
});
