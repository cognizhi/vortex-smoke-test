/**
 * Zod schemas for auth-related API inputs.
 */
import { z } from 'zod';

/**
 * Reserved slugs that cannot be used as merchant subdomains.
 * Must stay in sync with the RESERVED_SLUGS set in middleware.ts and provision-merchant.ts.
 */
export const RESERVED_SLUGS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'static',
  'support',
  'help',
  'billing',
  'status',
]);

/**
 * Slug validation regex (OQ-04 from product brief):
 * - Lowercase letters, digits, hyphens only
 * - 3–30 characters
 * - Must start and end with a letter or digit
 */
export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export const slugSchema = z
  .string()
  .regex(SLUG_REGEX, {
    message:
      'Subdomain must be 3–30 characters, lowercase letters, digits and hyphens only, and must start and end with a letter or digit.',
  })
  .refine((s) => !RESERVED_SLUGS.has(s), {
    message: 'This subdomain is reserved and cannot be used.',
  });

export const registerSchema = z.object({
  /** Display name of the business */
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be 100 characters or fewer'),

  /** Desired subdomain slug */
  slug: slugSchema,

  /** Owner's email — used for login and alerts */
  ownerEmail: z.string().email('Please enter a valid email address'),

  /** Owner's full name (stored in admin_users) */
  ownerName: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),

  /** Plaintext password (hashed server-side; never stored plaintext) */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be 100 characters or fewer'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const checkSlugSchema = z.object({
  slug: slugSchema,
});

export type CheckSlugInput = z.infer<typeof checkSlugSchema>;
