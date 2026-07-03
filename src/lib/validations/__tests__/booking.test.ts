/**
 * Unit tests for booking validation schemas.
 */
import { describe, it, expect } from 'vitest';
import {
  slotsQuerySchema,
  confirmBookingSchema,
  rescheduleBookingSchema,
  patchBookingSchema,
} from '../booking';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const ISO = '2026-06-15T10:00:00.000Z';

describe('slotsQuerySchema', () => {
  const valid = { staffId: UUID, serviceId: UUID, date: '2026-06-15', slug: 'my-shop' };

  it('accepts valid params', () => expect(slotsQuerySchema.safeParse(valid).success).toBe(true));
  it('rejects non-UUID staffId', () => expect(slotsQuerySchema.safeParse({ ...valid, staffId: 'not-uuid' }).success).toBe(false));
  it('rejects invalid date format', () => expect(slotsQuerySchema.safeParse({ ...valid, date: '15-06-2026' }).success).toBe(false));
  it('rejects slug shorter than 3 chars', () => expect(slotsQuerySchema.safeParse({ ...valid, slug: 'ab' }).success).toBe(false));
});

describe('confirmBookingSchema', () => {
  const valid = {
    staffId: UUID,
    serviceId: UUID,
    startTime: ISO,
    firstName: 'Jane',
    email: 'jane@example.com',
    contactNumber: '0400123456',
    slug: 'my-shop',
  };

  it('accepts valid booking payload', () => expect(confirmBookingSchema.safeParse(valid).success).toBe(true));
  it('rejects missing firstName', () => expect(confirmBookingSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false));
  it('rejects invalid email', () => expect(confirmBookingSchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false));
  it('rejects non-UUID serviceId', () => expect(confirmBookingSchema.safeParse({ ...valid, serviceId: 'bad' }).success).toBe(false));
  it('rejects invalid ISO datetime', () => expect(confirmBookingSchema.safeParse({ ...valid, startTime: '2026-06-15' }).success).toBe(false));
  it('rejects short phone number', () => expect(confirmBookingSchema.safeParse({ ...valid, contactNumber: '123' }).success).toBe(false));
});

describe('rescheduleBookingSchema', () => {
  it('accepts valid reschedule with startTime only', () =>
    expect(rescheduleBookingSchema.safeParse({ startTime: ISO }).success).toBe(true));
  it('accepts optional staffId override', () =>
    expect(rescheduleBookingSchema.safeParse({ startTime: ISO, staffId: UUID }).success).toBe(true));
  it('rejects invalid startTime', () =>
    expect(rescheduleBookingSchema.safeParse({ startTime: 'not-a-date' }).success).toBe(false));
  it('rejects non-UUID staffId', () =>
    expect(rescheduleBookingSchema.safeParse({ startTime: ISO, staffId: 'bad' }).success).toBe(false));
});

describe('patchBookingSchema', () => {
  it('accepts empty object', () => expect(patchBookingSchema.safeParse({}).success).toBe(true));
  it('accepts merchantNotes', () => expect(patchBookingSchema.safeParse({ merchantNotes: 'hello' }).success).toBe(true));
  it('rejects merchantNotes over 1000 chars', () =>
    expect(patchBookingSchema.safeParse({ merchantNotes: 'a'.repeat(1001) }).success).toBe(false));
});
