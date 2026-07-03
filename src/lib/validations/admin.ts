/**
 * Zod validation schemas for admin API request bodies.
 *
 * Each schema matches the API contract in the architecture blueprint (§6.3).
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validate a CSS hex colour string: "#RRGGBB" (7 chars) */
const hexColour = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex colour, e.g. "#ECFDF5"');

/** "HH:MM" 24-hour time string */
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a valid time in HH:MM format');

/** "YYYY-MM-DD" date string */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format');

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  contactNumber: z.string().max(30, 'Contact number too long').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  isVisible: z.boolean().default(true),
});

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ---------------------------------------------------------------------------
// Staff Availability
// ---------------------------------------------------------------------------

const availabilityDaySchema = z.object({
  dayOfWeek: z
    .number()
    .int()
    .min(0, 'Day of week must be 0–6')
    .max(6, 'Day of week must be 0–6'),
  startTime: timeString,
  endTime: timeString,
  maxConcurrent: z
    .number()
    .int()
    .min(1, 'maxConcurrent must be at least 1')
    .max(50, 'maxConcurrent too high')
    .default(1),
  enabled: z.boolean().default(true),
});

export const setAvailabilitySchema = z.object({
  availability: z.array(availabilityDaySchema).min(0).max(7),
});

export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;

// ---------------------------------------------------------------------------
// Staff Blocked Dates
// ---------------------------------------------------------------------------

export const addBlockedDateSchema = z
  .object({
    startDate: dateString,
    endDate: dateString,
    reason: z.string().max(200, 'Reason too long').optional(),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['endDate'],
  });

export type AddBlockedDateInput = z.infer<typeof addBlockedDateSchema>;

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  priceCents: z
    .number()
    .int()
    .min(0, 'Price cannot be negative')
    .max(10_000_00, 'Price too high')
    .optional(),
  isEnabled: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ---------------------------------------------------------------------------
// Design
// ---------------------------------------------------------------------------

export const updateDesignSchema = z.object({
  pageHeadline: z.string().max(200, 'Headline too long').optional(),
  pageSubheadline: z.string().max(300, 'Subheadline too long').optional(),
  slotAvailableBg: hexColour.optional(),
  slotAvailableText: hexColour.optional(),
  slotUnavailableBg: hexColour.optional(),
  slotUnavailableText: hexColour.optional(),
  calendarBorderWidth: z.number().int().min(0).max(8).optional(),
  calendarBorderColor: hexColour.optional(),
  calendarBorderRadius: z.number().int().min(0).max(24).optional(),
  calendarFontSize: z.number().int().min(10).max(24).optional(),
});

export type UpdateDesignInput = z.infer<typeof updateDesignSchema>;

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

export const updateBrandingSchema = z
  .object({
    siteName: z
      .string()
      .trim()
      .min(1, 'Site name cannot be empty')
      .max(100, 'Site name must be 100 characters or fewer')
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(500, 'Avatar URL is too long. Maximum 500 characters.')
      .refine(
        (url) => {
          try {
            // Accept both full URLs and relative paths (from photo storage)
            if (url.startsWith('/')) return true;
            return new URL(url).protocol.startsWith('http');
          } catch {
            return false;
          }
        },
        'Avatar URL must be a valid URL (e.g., https://example.com/avatar.png or /api/avatars/filename)'
      )
      .optional(),
  })
  .refine((data) => data.siteName !== undefined || data.avatarUrl !== undefined, {
    message: 'At least one field (siteName or avatarUrl) must be provided',
  });

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const updateSettingsSchema = z.object({
  slotDurationMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]).optional(),
  bookingExpiryMinutes: z
    .number()
    .int()
    .min(5, 'Expiry must be at least 5 minutes')
    .max(60, 'Expiry must be at most 60 minutes')
    .optional(),
  displayLanguage: z.literal('en').optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ---------------------------------------------------------------------------
// Admin Users (within settings)
// ---------------------------------------------------------------------------

export const addAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  role: z.literal('admin', { errorMap: () => ({ message: 'Only "admin" role allowed' }) }),
});

export type AddAdminUserInput = z.infer<typeof addAdminUserSchema>;

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

const discountCodeSchema = z
  .string()
  .min(3, 'Code must be at least 3 characters')
  .max(50, 'Code must be 50 characters or fewer')
  .regex(/^[A-Z0-9-]+$/i, 'Code must contain only letters, numbers, and hyphens')
  .transform((v) => v.toUpperCase());

/** Transform datetime-local input (YYYY-MM-DDTHH:MM) to ISO 8601 with Z suffix */
const datetimeLocalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid datetime format (expected YYYY-MM-DDTHH:MM)')
  .transform((v) => `${v}:00Z`)
  .pipe(z.string().datetime({ message: 'Invalid datetime value' }))
  .refine((d) => new Date(d) > new Date(Date.now() + 86400000), {
    message: 'Date must be at least 1 day in the future',
  });

export const createDiscountSchema = z
  .object({
    code: discountCodeSchema,
    discountPercentage: z
      .number()
      .min(0.01, 'Discount must be at least 0.01%')
      .max(100, 'Discount cannot exceed 100%'),
    startsAt: datetimeLocalSchema,
    endsAt: datetimeLocalSchema,
    description: z.string().max(255, 'Description must be 255 characters or fewer').optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'End date must be after start date',
    path: ['endsAt'],
  });

export const updateDiscountSchema = z
  .object({
    code: discountCodeSchema.optional(),
    discountPercentage: z
      .number()
      .min(0.01, 'Discount must be at least 0.01%')
      .max(100, 'Discount cannot exceed 100%')
      .optional(),
    startsAt: datetimeLocalSchema.optional(),
    endsAt: datetimeLocalSchema.optional(),
    description: z.string().max(255, 'Description must be 255 characters or fewer').optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => {
    // If both dates are provided, ensure end > start
    if (data.startsAt !== undefined && data.endsAt !== undefined) {
      return new Date(data.endsAt) > new Date(data.startsAt);
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endsAt'],
  });

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
