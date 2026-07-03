/**
 * Slot Availability Engine — core algorithm for computing bookable time slots.
 *
 * Input:
 *   staffId         — UUID of the staff member
 *   serviceId       — UUID of the service (to get durationMinutes)
 *   date            — "YYYY-MM-DD" string
 *   db              — Drizzle instance scoped to the merchant's private schema
 *   schema          — Table definitions from createMerchantSchema()
 *
 * Output:
 *   Array<{ startTime: Date; endTime: Date }> — bookable slots in UTC,
 *   sorted ascending, with past slots and over-capacity slots removed.
 *
 * Algorithm:
 *   1. Fetch staff availability for the day-of-week of `date`
 *   2. Fetch any blocked date ranges that overlap `date`
 *   3. Fetch existing CONFIRMED bookings for the staff on `date`
 *   4. Fetch merchant settings (slotDurationMinutes)
 *   5. Fetch service duration (durationMinutes)
 *   6. Generate candidate slots at slotDurationMinutes intervals
 *   7. Filter candidates: keep only slots where concurrent booking count < maxConcurrent
 *   8. Remove past slots (today: discard slots starting <= now + 30 min)
 */

import { and, eq, gt, gte, lt } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/node-postgres';
import type { MerchantSchemaType } from './db/merchant-schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

export interface SlotQueryParams {
  staffId: string;
  serviceId: string;
  /** YYYY-MM-DD in the merchant's local time (or UTC — caller decides) */
  date: string;
  db: ReturnType<typeof drizzle>;
  schema: MerchantSchemaType;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "HH:MM" into hours and minutes. */
export function parseTime(t: string): { h: number; m: number } {
  const [hStr, mStr] = t.split(':');
  return { h: parseInt(hStr, 10), m: parseInt(mStr, 10) };
}

/**
 * Build a UTC Date from a "YYYY-MM-DD" date string and a "HH:MM" time string.
 * Treats the date+time as UTC (no timezone conversion).
 */
export function buildUtcDate(date: string, time: string): Date {
  const { h, m } = parseTime(time);
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, h, m, 0, 0));
}

/** Day-of-week consistent with our schema: 0 = Sunday … 6 = Saturday */
export function dayOfWeekForDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** True if dateStr falls within [startDate, endDate] inclusive (all YYYY-MM-DD) */
export function dateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  return dateStr >= startDate && dateStr <= endDate;
}

/** True if two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Add `minutes` to a Date, returning a new Date */
export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Compute all available booking slots for a specific staff member, service,
 * and date within a merchant's context.
 */
export async function getAvailableSlots({
  staffId,
  serviceId,
  date,
  db,
  schema,
}: SlotQueryParams): Promise<TimeSlot[]> {
  const {
    staffAvailability,
    staffBlockedDates,
    services,
    bookings,
    merchantSettings,
  } = schema;

  // 1. Fetch staff availability for the requested day-of-week
  const dow = dayOfWeekForDate(date);
  const availability = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select()
    .from(staffAvailability)
    .where(
      and(
        eq(staffAvailability.staffId, staffId),
        eq(staffAvailability.dayOfWeek, dow)
      )
    );

  if (availability.length === 0) {
    // Staff not working on this day
    return [];
  }

  const avail = availability[0];
  const maxConcurrent = avail.maxConcurrent ?? 1;

  // 2. Fetch blocked dates — return early if date is blocked
  const blocked = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select()
    .from(staffBlockedDates)
    .where(eq(staffBlockedDates.staffId, staffId));

  const isBlocked = blocked.some((b) => dateInRange(date, b.startDate, b.endDate));
  if (isBlocked) {
    return [];
  }

  // 3. Fetch service duration
  const serviceRows = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select({ durationMinutes: services.durationMinutes })
    .from(services)
    .where(eq(services.id, serviceId));

  if (serviceRows.length === 0) {
    return [];
  }

  const serviceDuration = serviceRows[0].durationMinutes;

  // 4. Fetch merchant settings for slot step size
  const settingsRows = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select({ slotDurationMinutes: merchantSettings.slotDurationMinutes })
    .from(merchantSettings);

  const slotStep = settingsRows[0]?.slotDurationMinutes ?? 30;

  // 5. Fetch existing confirmed bookings for this staff member on this date
  const dayStart = buildUtcDate(date, '00:00');
  const dayEnd = buildUtcDate(date, '24:00'); // exclusive upper bound

  const existingBookings = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select({
      startTime: bookings.startTime,
      endTime: bookings.endTime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.staffId, staffId),
        eq(bookings.status, 'confirmed'),
        gte(bookings.startTime, dayStart),
        lt(bookings.startTime, dayEnd)
      )
    );

  // 6. Generate candidate slots
  const workStart = buildUtcDate(date, avail.startTime);
  const workEnd = buildUtcDate(date, avail.endTime);

  const candidates: TimeSlot[] = [];
  let cursor = new Date(workStart);

  while (true) {
    const slotEnd = addMinutes(cursor, serviceDuration);
    if (slotEnd > workEnd) break;
    candidates.push({ startTime: new Date(cursor), endTime: slotEnd });
    cursor = addMinutes(cursor, slotStep);
  }

  // 7. Filter candidates by concurrency: only keep slots where the count of
  //    confirmed bookings overlapping this slot is strictly less than maxConcurrent.
  const availableSlots = candidates.filter((slot) => {
    const concurrentCount = existingBookings.filter((b) =>
      intervalsOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)
    ).length;
    return concurrentCount < maxConcurrent;
  });

  // 8. Filter past slots: if the requested date is today, discard slots
  //    that start within the next 30 minutes (buffer for form fill time).
  const now = new Date();
  const todayStr = `${String(now.getUTCFullYear())}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  if (date === todayStr) {
    const cutoff = addMinutes(now, 30);
    return availableSlots.filter((s) => s.startTime > cutoff);
  }

  return availableSlots;
}

// ---------------------------------------------------------------------------
// Concurrency conflict check (used at booking creation time)
// ---------------------------------------------------------------------------

/**
 * Returns true if the requested slot is still available for booking,
 * i.e., the number of confirmed bookings that overlap it is < maxConcurrent.
 *
 * This is the authoritative check at write time (optimistic — no DB lock in MVP).
 */
export async function isSlotAvailable({
  staffId,
  startTime,
  endTime,
  db,
  schema,
}: {
  staffId: string;
  startTime: Date;
  endTime: Date;
  db: ReturnType<typeof drizzle>;
  schema: MerchantSchemaType;
}): Promise<boolean> {
  const { bookings, staffAvailability } = schema;

  // Get maxConcurrent for this staff on this day-of-week
  const dow = startTime.getUTCDay();
  const availRows = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select({ maxConcurrent: staffAvailability.maxConcurrent })
    .from(staffAvailability)
    .where(
      and(
        eq(staffAvailability.staffId, staffId),
        eq(staffAvailability.dayOfWeek, dow)
      )
    );

  const maxConcurrent = availRows[0]?.maxConcurrent ?? 1;

  // Count confirmed bookings overlapping the requested slot
  const overlapping = await (db as ReturnType<typeof drizzle<MerchantSchemaType>>)
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.staffId, staffId),
        eq(bookings.status, 'confirmed'),
        lt(bookings.startTime, endTime),
        gt(bookings.endTime, startTime)
      )
    );

  return overlapping.length < maxConcurrent;
}
