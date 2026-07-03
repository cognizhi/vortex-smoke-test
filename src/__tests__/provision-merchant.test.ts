/**
 * Unit tests for merchant provisioning helpers.
 *
 * These tests cover the pure utility functions only.
 * The DB-touching `provisionMerchant()` function requires a live PostgreSQL
 * instance — it is integration-tested separately and excluded here.
 */
import { describe, it, expect } from 'vitest';

import { slugifyUuid, schemaNameFromId, isValidSlug } from '../lib/db/provision-merchant';

// ---------------------------------------------------------------------------
// slugifyUuid
// ---------------------------------------------------------------------------

describe('slugifyUuid', () => {
  it('strips hyphens from a standard UUID', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(slugifyUuid(uuid)).toBe('a1b2c3d4e5f67890abcdef1234567890');
  });

  it('returns the input unchanged when there are no hyphens', () => {
    const hex = 'a1b2c3d4e5f67890abcdef1234567890';
    expect(slugifyUuid(hex)).toBe(hex);
  });

  it('produces a 32-char string for a standard UUID', () => {
    const uuid = '00000000-0000-0000-0000-000000000000';
    expect(slugifyUuid(uuid)).toHaveLength(32);
  });
});

// ---------------------------------------------------------------------------
// schemaNameFromId
// ---------------------------------------------------------------------------

describe('schemaNameFromId', () => {
  it('produces a "merchant_" prefixed schema name', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(schemaNameFromId(id)).toBe('merchant_a1b2c3d4e5f67890abcdef1234567890');
  });

  it('is safe to use as a PostgreSQL identifier (no hyphens)', () => {
    const id = 'deadbeef-dead-dead-dead-deaddeaddead';
    const name = schemaNameFromId(id);
    expect(name).not.toContain('-');
    expect(name).toMatch(/^merchant_[a-f0-9]{32}$/);
  });
});

// ---------------------------------------------------------------------------
// isValidSlug
// ---------------------------------------------------------------------------

describe('isValidSlug', () => {
  // Valid slugs
  it('accepts a simple lowercase slug', () => {
    expect(isValidSlug('glamour-studio')).toBe(true);
  });

  it('accepts a slug with digits', () => {
    expect(isValidSlug('studio42')).toBe(true);
  });

  it('accepts minimum length (3 chars)', () => {
    expect(isValidSlug('abc')).toBe(true);
  });

  it('accepts maximum length (30 chars)', () => {
    expect(isValidSlug('a' + '-'.repeat(28) + 'z')).toBe(true);
  });

  it('accepts a slug with multiple hyphens', () => {
    expect(isValidSlug('my-awesome-booking-studio')).toBe(true);
  });

  // Invalid slugs
  it('rejects a slug that is too short (< 3 chars)', () => {
    expect(isValidSlug('ab')).toBe(false);
  });

  it('rejects a slug that is too long (> 30 chars)', () => {
    expect(isValidSlug('a'.repeat(31))).toBe(false);
  });

  it('rejects a slug with uppercase letters', () => {
    expect(isValidSlug('My-Salon')).toBe(false);
  });

  it('rejects a slug starting with a hyphen', () => {
    expect(isValidSlug('-bad-slug')).toBe(false);
  });

  it('rejects a slug ending with a hyphen', () => {
    expect(isValidSlug('bad-slug-')).toBe(false);
  });

  it('allows a slug with consecutive hyphens (spec does not restrict them)', () => {
    // Blueprint OQ-04 regex: ^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$
    // Consecutive hyphens are permitted by the character class [a-z0-9-]
    expect(isValidSlug('bad--slug')).toBe(true);
  });

  it('rejects reserved slug "www"', () => {
    expect(isValidSlug('www')).toBe(false);
  });

  it('rejects reserved slug "api"', () => {
    expect(isValidSlug('api')).toBe(false);
  });

  it('rejects reserved slug "admin"', () => {
    expect(isValidSlug('admin')).toBe(false);
  });

  it('rejects reserved slug "app"', () => {
    expect(isValidSlug('app')).toBe(false);
  });

  it('rejects reserved slug "mail"', () => {
    expect(isValidSlug('mail')).toBe(false);
  });

  it('rejects reserved slug "static"', () => {
    expect(isValidSlug('static')).toBe(false);
  });

  it('rejects reserved slug "support"', () => {
    expect(isValidSlug('support')).toBe(false);
  });

  it('rejects a slug with spaces', () => {
    expect(isValidSlug('my salon')).toBe(false);
  });

  it('rejects a slug with special characters', () => {
    expect(isValidSlug('my_salon')).toBe(false);
  });
});
