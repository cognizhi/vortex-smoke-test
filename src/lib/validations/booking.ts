/**
 * Zod validation schemas for public booking API inputs.
 */
import { z } from 'zod';

/** ISO 8601 datetime string */
const isoDatetime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/,
    'Must be a valid ISO 8601 datetime string'
  );

/** YYYY-MM-DD date string */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format');

// ---------------------------------------------------------------------------
// GET /api/booking/slots
// ---------------------------------------------------------------------------

export const slotsQuerySchema = z.object({
  staffId: z.string().uuid('staffId must be a UUID'),
  serviceId: z.string().uuid('serviceId must be a UUID'),
  date: dateString,
  slug: z.string().min(3).max(30),
});

export type SlotsQuery = z.infer<typeof slotsQuerySchema>;

// ---------------------------------------------------------------------------
// POST /api/booking/confirm
// ---------------------------------------------------------------------------

export const confirmBookingSchema = z.object({
  staffId: z.string().uuid('staffId must be a UUID'),
  serviceId: z.string().uuid('serviceId must be a UUID'),
  /** ISO 8601 string for the requested slot start */
  startTime: isoDatetime,
  /** Customer details */
  firstName: z.string().min(1, 'First name is required').max(100),
  email: z.string().email('A valid email address is required'),
  contactNumber: z
    .string()
    .min(6, 'Phone number too short')
    .max(30, 'Phone number too long'),
  /** Merchant's booking page subdomain — used to resolve merchant context */
  slug: z.string().min(3).max(30),
});

export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;

// ---------------------------------------------------------------------------
// Admin booking reschedule
// ---------------------------------------------------------------------------

export const rescheduleBookingSchema = z.object({
  /** New slot start time (ISO 8601) */
  startTime: isoDatetime,
  /** Optional: reassign to a different staff member */
  staffId: z.string().uuid().optional(),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

// ---------------------------------------------------------------------------
// Admin booking notes patch
// ---------------------------------------------------------------------------

export const patchBookingSchema = z.object({
  merchantNotes: z.string().max(1000, 'Notes too long').optional(),
});

export type PatchBookingInput = z.infer<typeof patchBookingSchema>;
