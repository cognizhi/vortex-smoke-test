/**
 * Unit tests for password hashing and verification utilities.
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('hashPassword', () => {
  it('returns a non-empty string', async () => {
    const hash = await hashPassword('mysecretpassword');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces a bcrypt hash (starts with $2b$ or $2a$)', async () => {
    const hash = await hashPassword('test1234');
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('produces a different hash for the same password (salt is random)', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
  });

  it('handles long passwords', async () => {
    const longPw = 'a'.repeat(100);
    const hash = await hashPassword(longPw);
    expect(hash).toBeTruthy();
  });
});

describe('verifyPassword', () => {
  it('returns true for a correct password', async () => {
    const password = 'correcthorsebatterystaple';
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('returns false for an incorrect password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for an empty string against a hashed password', async () => {
    const hash = await hashPassword('nonempty');
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('is case-sensitive', async () => {
    const hash = await hashPassword('Password123');
    expect(await verifyPassword('password123', hash)).toBe(false);
    expect(await verifyPassword('PASSWORD123', hash)).toBe(false);
    expect(await verifyPassword('Password123', hash)).toBe(true);
  });
});
