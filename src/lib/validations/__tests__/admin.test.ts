/**
 * Unit tests for admin Zod validation schemas.
 */
import { describe, it, expect } from 'vitest';
import {
  createStaffSchema,
  updateStaffSchema,
  setAvailabilitySchema,
  addBlockedDateSchema,
  createServiceSchema,
  updateServiceSchema,
  updateDesignSchema,
  updateSettingsSchema,
  addAdminUserSchema,
} from '../admin';

// ---------------------------------------------------------------------------
// createStaffSchema
// ---------------------------------------------------------------------------

describe('createStaffSchema', () => {
  const valid = {
    name: 'Alice Johnson',
    contactNumber: '555-123-4567',
    email: 'alice@example.com',
    isVisible: true,
  };

  it('accepts a fully populated valid payload', () => {
    expect(createStaffSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a payload with only required name', () => {
    expect(createStaffSchema.safeParse({ name: 'Bob' }).success).toBe(true);
  });

  it('defaults isVisible to true when omitted', () => {
    const result = createStaffSchema.safeParse({ name: 'Carol' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isVisible).toBe(true);
    }
  });

  it('accepts an empty string for email', () => {
    expect(createStaffSchema.safeParse({ name: 'Dave', email: '' }).success).toBe(true);
  });

  it('accepts omitted optional fields', () => {
    const result = createStaffSchema.safeParse({ name: 'Eve' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactNumber).toBeUndefined();
      expect(result.data.email).toBeUndefined();
    }
  });

  it('rejects an empty name', () => {
    expect(createStaffSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    expect(
      createStaffSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success,
    ).toBe(false);
  });

  it('accepts a name exactly 100 characters long', () => {
    expect(
      createStaffSchema.safeParse({ ...valid, name: 'a'.repeat(100) }).success,
    ).toBe(true);
  });

  it('rejects an invalid email format', () => {
    expect(
      createStaffSchema.safeParse({ ...valid, email: 'not-an-email' }).success,
    ).toBe(false);
  });

  it('rejects an email missing the domain part', () => {
    expect(
      createStaffSchema.safeParse({ ...valid, email: 'user@' }).success,
    ).toBe(false);
  });

  it('rejects a contactNumber longer than 30 characters', () => {
    expect(
      createStaffSchema.safeParse({ ...valid, contactNumber: '1'.repeat(31) }).success,
    ).toBe(false);
  });

  it('accepts a contactNumber exactly 30 characters long', () => {
    expect(
      createStaffSchema.safeParse({ ...valid, contactNumber: '1'.repeat(30) }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateStaffSchema
// ---------------------------------------------------------------------------

describe('updateStaffSchema', () => {
  it('accepts an empty object (all fields partial)', () => {
    expect(updateStaffSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update with only name', () => {
    expect(updateStaffSchema.safeParse({ name: 'Updated Name' }).success).toBe(true);
  });

  it('accepts a partial update with only email', () => {
    expect(updateStaffSchema.safeParse({ email: 'new@example.com' }).success).toBe(true);
  });

  it('still rejects a name exceeding 100 characters', () => {
    expect(
      updateStaffSchema.safeParse({ name: 'a'.repeat(101) }).success,
    ).toBe(false);
  });

  it('still rejects an invalid email format', () => {
    expect(
      updateStaffSchema.safeParse({ email: 'bad-email' }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setAvailabilitySchema
// ---------------------------------------------------------------------------

describe('setAvailabilitySchema', () => {
  const validDay = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    maxConcurrent: 2,
    enabled: true,
  };

  it('accepts a valid single-day availability', () => {
    expect(setAvailabilitySchema.safeParse({ availability: [validDay] }).success).toBe(true);
  });

  it('accepts an empty availability array', () => {
    expect(setAvailabilitySchema.safeParse({ availability: [] }).success).toBe(true);
  });

  it('accepts all 7 days of the week', () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      ...validDay,
      dayOfWeek,
    }));
    expect(setAvailabilitySchema.safeParse({ availability: allDays }).success).toBe(true);
  });

  it('defaults maxConcurrent to 1 when omitted', () => {
    const { maxConcurrent: _mc, ...dayWithoutConcurrent } = validDay;
    const result = setAvailabilitySchema.safeParse({
      availability: [dayWithoutConcurrent],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.availability[0].maxConcurrent).toBe(1);
    }
  });

  it('defaults enabled to true when omitted', () => {
    const { enabled: _e, ...dayWithoutEnabled } = validDay;
    const result = setAvailabilitySchema.safeParse({
      availability: [dayWithoutEnabled],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.availability[0].enabled).toBe(true);
    }
  });

  it('rejects dayOfWeek of 7 (out of range)', () => {
    const result = setAvailabilitySchema.safeParse({
      availability: [{ ...validDay, dayOfWeek: 7 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects dayOfWeek of -1 (negative)', () => {
    const result = setAvailabilitySchema.safeParse({
      availability: [{ ...validDay, dayOfWeek: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts dayOfWeek boundary values 0 and 6', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, dayOfWeek: 0 }] }).success,
    ).toBe(true);
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, dayOfWeek: 6 }] }).success,
    ).toBe(true);
  });

  it('rejects an invalid startTime format (missing colon)', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, startTime: '0900' }] }).success,
    ).toBe(false);
  });

  it('rejects an invalid startTime format (hour 24)', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, startTime: '24:00' }] }).success,
    ).toBe(false);
  });

  it('rejects an invalid endTime format (letters)', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, endTime: 'ab:cd' }] }).success,
    ).toBe(false);
  });

  it('rejects an invalid time with invalid minutes (60)', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, startTime: '09:60' }] }).success,
    ).toBe(false);
  });

  it('accepts boundary time values 00:00 and 23:59', () => {
    expect(
      setAvailabilitySchema.safeParse({
        availability: [{ ...validDay, startTime: '00:00', endTime: '23:59' }],
      }).success,
    ).toBe(true);
  });

  it('rejects 8 items in availability array (exceeds max 7)', () => {
    const eightDays = Array.from({ length: 8 }, (_, i) => ({
      ...validDay,
      dayOfWeek: i % 7,
    }));
    expect(setAvailabilitySchema.safeParse({ availability: eightDays }).success).toBe(false);
  });

  it('rejects maxConcurrent of 0 (below minimum)', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, maxConcurrent: 0 }] }).success,
    ).toBe(false);
  });

  it('rejects maxConcurrent of 51 (above maximum)', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, maxConcurrent: 51 }] }).success,
    ).toBe(false);
  });

  it('accepts maxConcurrent boundary values 1 and 50', () => {
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, maxConcurrent: 1 }] }).success,
    ).toBe(true);
    expect(
      setAvailabilitySchema.safeParse({ availability: [{ ...validDay, maxConcurrent: 50 }] }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addBlockedDateSchema
// ---------------------------------------------------------------------------

describe('addBlockedDateSchema', () => {
  const valid = {
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    reason: 'Summer holiday',
  };

  it('accepts a valid blocked date range with reason', () => {
    expect(addBlockedDateSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a same-day blocked date (startDate === endDate)', () => {
    expect(
      addBlockedDateSchema.safeParse({ startDate: '2026-07-10', endDate: '2026-07-10' }).success,
    ).toBe(true);
  });

  it('accepts without the optional reason field', () => {
    const { reason: _r, ...withoutReason } = valid;
    expect(addBlockedDateSchema.safeParse(withoutReason).success).toBe(true);
  });

  it('rejects when startDate is after endDate', () => {
    const result = addBlockedDateSchema.safeParse({
      startDate: '2026-07-10',
      endDate: '2026-07-05',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('endDate');
    }
  });

  it('rejects an invalid startDate format (MM/DD/YYYY)', () => {
    expect(
      addBlockedDateSchema.safeParse({ ...valid, startDate: '07/01/2026' }).success,
    ).toBe(false);
  });

  it('rejects an invalid endDate format (missing dashes)', () => {
    expect(
      addBlockedDateSchema.safeParse({ ...valid, endDate: '20260705' }).success,
    ).toBe(false);
  });

  it('rejects a date with letters', () => {
    expect(
      addBlockedDateSchema.safeParse({ ...valid, startDate: 'not-a-date' }).success,
    ).toBe(false);
  });

  it('rejects a reason longer than 200 characters', () => {
    expect(
      addBlockedDateSchema.safeParse({ ...valid, reason: 'r'.repeat(201) }).success,
    ).toBe(false);
  });

  it('accepts a reason exactly 200 characters long', () => {
    expect(
      addBlockedDateSchema.safeParse({ ...valid, reason: 'r'.repeat(200) }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createServiceSchema
// ---------------------------------------------------------------------------

describe('createServiceSchema', () => {
  const valid = {
    name: 'Haircut',
    description: 'Classic haircut service',
    durationMinutes: 30,
    priceCents: 2500,
    isEnabled: true,
  };

  it('accepts a fully populated valid payload', () => {
    expect(createServiceSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts minimal required fields only', () => {
    expect(createServiceSchema.safeParse({ name: 'Quick Trim', durationMinutes: 15 }).success).toBe(
      true,
    );
  });

  it('defaults isEnabled to true when omitted', () => {
    const result = createServiceSchema.safeParse({ name: 'Trim', durationMinutes: 20 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isEnabled).toBe(true);
    }
  });

  it('rejects an empty name', () => {
    expect(createServiceSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    expect(
      createServiceSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success,
    ).toBe(false);
  });

  it('rejects a description longer than 500 characters', () => {
    expect(
      createServiceSchema.safeParse({ ...valid, description: 'd'.repeat(501) }).success,
    ).toBe(false);
  });

  it('rejects durationMinutes below 5', () => {
    expect(createServiceSchema.safeParse({ ...valid, durationMinutes: 4 }).success).toBe(false);
  });

  it('rejects durationMinutes of 0', () => {
    expect(createServiceSchema.safeParse({ ...valid, durationMinutes: 0 }).success).toBe(false);
  });

  it('rejects durationMinutes above 480', () => {
    expect(createServiceSchema.safeParse({ ...valid, durationMinutes: 481 }).success).toBe(false);
  });

  it('accepts durationMinutes boundary values 5 and 480', () => {
    expect(createServiceSchema.safeParse({ ...valid, durationMinutes: 5 }).success).toBe(true);
    expect(createServiceSchema.safeParse({ ...valid, durationMinutes: 480 }).success).toBe(true);
  });

  it('rejects a negative priceCents', () => {
    expect(createServiceSchema.safeParse({ ...valid, priceCents: -1 }).success).toBe(false);
  });

  it('accepts priceCents of 0 (free service)', () => {
    expect(createServiceSchema.safeParse({ ...valid, priceCents: 0 }).success).toBe(true);
  });

  it('accepts priceCents at the maximum (1000000)', () => {
    expect(createServiceSchema.safeParse({ ...valid, priceCents: 1000000 }).success).toBe(true);
  });

  it('rejects priceCents above 1000000', () => {
    expect(createServiceSchema.safeParse({ ...valid, priceCents: 1000001 }).success).toBe(false);
  });

  it('rejects a non-integer durationMinutes', () => {
    expect(createServiceSchema.safeParse({ ...valid, durationMinutes: 30.5 }).success).toBe(false);
  });

  it('rejects a non-integer priceCents', () => {
    expect(createServiceSchema.safeParse({ ...valid, priceCents: 25.99 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateServiceSchema
// ---------------------------------------------------------------------------

describe('updateServiceSchema', () => {
  it('accepts an empty object (all fields partial)', () => {
    expect(updateServiceSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update with only durationMinutes', () => {
    expect(updateServiceSchema.safeParse({ durationMinutes: 60 }).success).toBe(true);
  });

  it('still rejects an invalid durationMinutes value', () => {
    expect(updateServiceSchema.safeParse({ durationMinutes: 3 }).success).toBe(false);
  });

  it('still rejects a name exceeding 100 characters', () => {
    expect(updateServiceSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateDesignSchema
// ---------------------------------------------------------------------------

describe('updateDesignSchema', () => {
  const valid = {
    pageHeadline: 'Book Your Appointment',
    pageSubheadline: 'Easy and fast online booking',
    slotAvailableBg: '#ECFDF5',
    slotAvailableText: '#065F46',
    slotUnavailableBg: '#F3F4F6',
    slotUnavailableText: '#9CA3AF',
    calendarBorderWidth: 2,
    calendarBorderColor: '#D1D5DB',
    calendarBorderRadius: 8,
    calendarFontSize: 14,
  };

  it('accepts a fully populated valid design payload', () => {
    expect(updateDesignSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    expect(updateDesignSchema.safeParse({}).success).toBe(true);
  });

  it('accepts lowercase hex colours', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: '#aabbcc' }).success,
    ).toBe(true);
  });

  it('accepts uppercase hex colours', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: '#AABBCC' }).success,
    ).toBe(true);
  });

  it('accepts mixed-case hex colours', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: '#aAbBcC' }).success,
    ).toBe(true);
  });

  it('rejects a hex colour with only 5 hex digits', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: '#ABCDE' }).success,
    ).toBe(false);
  });

  it('rejects a hex colour with 7 hex digits', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: '#AABBCC0' }).success,
    ).toBe(false);
  });

  it('rejects a hex colour missing the # prefix', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: 'AABBCC' }).success,
    ).toBe(false);
  });

  it('rejects a hex colour with an invalid character (X)', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: '#XXYYZZ' }).success,
    ).toBe(false);
  });

  it('rejects a named colour string', () => {
    expect(
      updateDesignSchema.safeParse({ slotAvailableBg: 'red' }).success,
    ).toBe(false);
  });

  it('rejects calendarBorderWidth greater than 8', () => {
    expect(
      updateDesignSchema.safeParse({ calendarBorderWidth: 9 }).success,
    ).toBe(false);
  });

  it('accepts calendarBorderWidth boundary values 0 and 8', () => {
    expect(updateDesignSchema.safeParse({ calendarBorderWidth: 0 }).success).toBe(true);
    expect(updateDesignSchema.safeParse({ calendarBorderWidth: 8 }).success).toBe(true);
  });

  it('rejects calendarBorderRadius greater than 24', () => {
    expect(
      updateDesignSchema.safeParse({ calendarBorderRadius: 25 }).success,
    ).toBe(false);
  });

  it('accepts calendarBorderRadius boundary values 0 and 24', () => {
    expect(updateDesignSchema.safeParse({ calendarBorderRadius: 0 }).success).toBe(true);
    expect(updateDesignSchema.safeParse({ calendarBorderRadius: 24 }).success).toBe(true);
  });

  it('rejects calendarFontSize below 10', () => {
    expect(
      updateDesignSchema.safeParse({ calendarFontSize: 9 }).success,
    ).toBe(false);
  });

  it('rejects calendarFontSize above 24', () => {
    expect(
      updateDesignSchema.safeParse({ calendarFontSize: 25 }).success,
    ).toBe(false);
  });

  it('accepts calendarFontSize boundary values 10 and 24', () => {
    expect(updateDesignSchema.safeParse({ calendarFontSize: 10 }).success).toBe(true);
    expect(updateDesignSchema.safeParse({ calendarFontSize: 24 }).success).toBe(true);
  });

  it('rejects a non-integer calendarBorderWidth', () => {
    expect(updateDesignSchema.safeParse({ calendarBorderWidth: 2.5 }).success).toBe(false);
  });

  it('rejects a pageHeadline longer than 200 characters', () => {
    expect(
      updateDesignSchema.safeParse({ pageHeadline: 'h'.repeat(201) }).success,
    ).toBe(false);
  });

  it('rejects a pageSubheadline longer than 300 characters', () => {
    expect(
      updateDesignSchema.safeParse({ pageSubheadline: 's'.repeat(301) }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateSettingsSchema
// ---------------------------------------------------------------------------

describe('updateSettingsSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts slotDurationMinutes of 15', () => {
    expect(updateSettingsSchema.safeParse({ slotDurationMinutes: 15 }).success).toBe(true);
  });

  it('accepts slotDurationMinutes of 30', () => {
    expect(updateSettingsSchema.safeParse({ slotDurationMinutes: 30 }).success).toBe(true);
  });

  it('accepts slotDurationMinutes of 60', () => {
    expect(updateSettingsSchema.safeParse({ slotDurationMinutes: 60 }).success).toBe(true);
  });

  it('rejects slotDurationMinutes of 45 (not a valid literal)', () => {
    expect(updateSettingsSchema.safeParse({ slotDurationMinutes: 45 }).success).toBe(false);
  });

  it('rejects slotDurationMinutes of 0', () => {
    expect(updateSettingsSchema.safeParse({ slotDurationMinutes: 0 }).success).toBe(false);
  });

  it('rejects slotDurationMinutes of 120', () => {
    expect(updateSettingsSchema.safeParse({ slotDurationMinutes: 120 }).success).toBe(false);
  });

  it('accepts bookingExpiryMinutes of 5 (minimum)', () => {
    expect(updateSettingsSchema.safeParse({ bookingExpiryMinutes: 5 }).success).toBe(true);
  });

  it('accepts bookingExpiryMinutes of 60 (maximum)', () => {
    expect(updateSettingsSchema.safeParse({ bookingExpiryMinutes: 60 }).success).toBe(true);
  });

  it('rejects bookingExpiryMinutes of 4 (below minimum)', () => {
    expect(updateSettingsSchema.safeParse({ bookingExpiryMinutes: 4 }).success).toBe(false);
  });

  it('rejects bookingExpiryMinutes of 61 (above maximum)', () => {
    expect(updateSettingsSchema.safeParse({ bookingExpiryMinutes: 61 }).success).toBe(false);
  });

  it('rejects a non-integer bookingExpiryMinutes', () => {
    expect(updateSettingsSchema.safeParse({ bookingExpiryMinutes: 10.5 }).success).toBe(false);
  });

  it('accepts displayLanguage of "en"', () => {
    expect(updateSettingsSchema.safeParse({ displayLanguage: 'en' }).success).toBe(true);
  });

  it('rejects displayLanguage of "fr" (not a valid literal)', () => {
    expect(updateSettingsSchema.safeParse({ displayLanguage: 'fr' }).success).toBe(false);
  });

  it('accepts a fully populated valid settings payload', () => {
    expect(
      updateSettingsSchema.safeParse({
        slotDurationMinutes: 30,
        bookingExpiryMinutes: 15,
        displayLanguage: 'en',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addAdminUserSchema
// ---------------------------------------------------------------------------

describe('addAdminUserSchema', () => {
  const valid = {
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'securepassword123',
    role: 'admin' as const,
  };

  it('accepts a valid admin user payload', () => {
    expect(addAdminUserSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid email format', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an email missing TLD', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, email: 'admin@example' }).success).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts a name exactly 100 characters long', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, name: 'a'.repeat(100) }).success).toBe(true);
  });

  it('rejects a password shorter than 8 characters (7 chars)', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, password: 'short12' }).success).toBe(false);
  });

  it('accepts a password exactly 8 characters long', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, password: '12345678' }).success).toBe(true);
  });

  it('rejects a password longer than 100 characters', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, password: 'a'.repeat(101) }).success).toBe(
      false,
    );
  });

  it('accepts a password exactly 100 characters long', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, password: 'a'.repeat(100) }).success).toBe(
      true,
    );
  });

  it('rejects role "owner"', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, role: 'owner' }).success).toBe(false);
  });

  it('rejects role "superadmin"', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, role: 'superadmin' }).success).toBe(false);
  });

  it('rejects role "user"', () => {
    expect(addAdminUserSchema.safeParse({ ...valid, role: 'user' }).success).toBe(false);
  });

  it('rejects a missing role field', () => {
    const { role: _r, ...withoutRole } = valid;
    expect(addAdminUserSchema.safeParse(withoutRole).success).toBe(false);
  });

  it('rejects missing required fields entirely', () => {
    expect(addAdminUserSchema.safeParse({}).success).toBe(false);
  });
});
