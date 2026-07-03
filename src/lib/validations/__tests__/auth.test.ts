/**
 * Unit tests for auth Zod validation schemas.
 */
import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, checkSlugSchema } from '../auth';

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------

describe('registerSchema', () => {
  const valid = {
    businessName: 'Glamour Studio',
    slug: 'glamour-studio',
    ownerEmail: 'owner@example.com',
    ownerName: 'Jane Smith',
    password: 'securepass123',
  };

  it('accepts a valid registration payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing businessName', () => {
    const result = registerSchema.safeParse({ ...valid, businessName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects businessName longer than 100 chars', () => {
    const result = registerSchema.safeParse({ ...valid, businessName: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid slug (uppercase)', () => {
    const result = registerSchema.safeParse({ ...valid, slug: 'Glamour-Studio' });
    expect(result.success).toBe(false);
  });

  it('rejects a reserved slug', () => {
    const result = registerSchema.safeParse({ ...valid, slug: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rejects a slug shorter than 3 chars', () => {
    const result = registerSchema.safeParse({ ...valid, slug: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, ownerEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 chars', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 100 chars', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects a missing ownerName', () => {
    const result = registerSchema.safeParse({ ...valid, ownerName: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------

describe('loginSchema', () => {
  const valid = { email: 'admin@example.com', password: 'mypassword' };

  it('accepts a valid login payload', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ ...valid, email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ ...valid, password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: valid.email }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkSlugSchema
// ---------------------------------------------------------------------------

describe('checkSlugSchema', () => {
  it('accepts a valid slug', () => {
    expect(checkSlugSchema.safeParse({ slug: 'my-shop' }).success).toBe(true);
  });

  it('accepts a slug with digits', () => {
    expect(checkSlugSchema.safeParse({ slug: 'studio42' }).success).toBe(true);
  });

  it('rejects a slug with uppercase', () => {
    expect(checkSlugSchema.safeParse({ slug: 'My-Shop' }).success).toBe(false);
  });

  it('rejects a slug starting with a hyphen', () => {
    expect(checkSlugSchema.safeParse({ slug: '-shop' }).success).toBe(false);
  });

  it('rejects a slug ending with a hyphen', () => {
    expect(checkSlugSchema.safeParse({ slug: 'shop-' }).success).toBe(false);
  });

  it('rejects reserved slugs', () => {
    for (const reserved of ['www', 'api', 'admin', 'app', 'mail', 'static', 'support', 'help', 'billing', 'status']) {
      expect(checkSlugSchema.safeParse({ slug: reserved }).success).toBe(false);
    }
  });

  it('rejects a slug shorter than 3 chars', () => {
    expect(checkSlugSchema.safeParse({ slug: 'ab' }).success).toBe(false);
  });

  it('rejects a slug longer than 30 chars', () => {
    expect(checkSlugSchema.safeParse({ slug: 'a'.repeat(31) }).success).toBe(false);
  });
});
