/**
 * Password hashing and verification using bcryptjs.
 *
 * Cost factor 12 as specified in the architecture blueprint.
 * bcryptjs is a pure-JS implementation — no native bindings needed.
 */
import { hash, compare } from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt (cost factor 12).
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password to a stored bcrypt hash.
 * Returns `true` if the password matches.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  return compare(password, storedHash);
}
