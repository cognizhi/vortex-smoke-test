/**
 * Unit tests for the slot availability engine (src/lib/slots.ts).
 *
 * All DB calls are mocked. We test:
 *   - parseTime / buildUtcDate / dayOfWeekForDate helpers
 *   - dateInRange, intervalsOverlap, addMinutes
 *   - getAvailableSlots — main algorithm scenarios
 *   - isSlotAvailable — concurrency check
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseTime,
  buildUtcDate,
  dayOfWeekForDate,
  dateInRange,
  intervalsOverlap,
  addMinutes,
  getAvailableSlots,
  isSlotAvailable,
} from '../slots';

// ---------------------------------------------------------------------------
// Pure helper tests
// ---------------------------------------------------------------------------

describe('parseTime', () => {
  it('parses "09:00"', () => expect(parseTime('09:00')).toEqual({ h: 9, m: 0 }));
  it('parses "18:30"', () => expect(parseTime('18:30')).toEqual({ h: 18, m: 30 }));
  it('parses "00:00"', () => expect(parseTime('00:00')).toEqual({ h: 0, m: 0 }));
  it('parses "23:59"', () => expect(parseTime('23:59')).toEqual({ h: 23, m: 59 }));
});

describe('buildUtcDate', () => {
  it('builds correct UTC date from date + time strings', () => {
    const d = buildUtcDate('2026-06-15', '09:30');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(5); // June (0-indexed)
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(9);
    expect(d.getUTCMinutes()).toBe(30);
  });
});

describe('dayOfWeekForDate', () => {
  it('returns 1 for 2026-06-15 (Monday)', () => {
    expect(dayOfWeekForDate('2026-06-15')).toBe(1);
  });
  it('returns 0 for 2026-06-14 (Sunday)', () => {
    expect(dayOfWeekForDate('2026-06-14')).toBe(0);
  });
  it('returns 6 for 2026-06-20 (Saturday)', () => {
    expect(dayOfWeekForDate('2026-06-20')).toBe(6);
  });
});

describe('dateInRange', () => {
  it('returns true when date equals startDate', () =>
    expect(dateInRange('2026-06-15', '2026-06-15', '2026-06-20')).toBe(true));
  it('returns true when date equals endDate', () =>
    expect(dateInRange('2026-06-20', '2026-06-15', '2026-06-20')).toBe(true));
  it('returns true when date is within range', () =>
    expect(dateInRange('2026-06-17', '2026-06-15', '2026-06-20')).toBe(true));
  it('returns false when date is before range', () =>
    expect(dateInRange('2026-06-14', '2026-06-15', '2026-06-20')).toBe(false));
  it('returns false when date is after range', () =>
    expect(dateInRange('2026-06-21', '2026-06-15', '2026-06-20')).toBe(false));
});

describe('intervalsOverlap', () => {
  const d = (h: number, m = 0) => new Date(Date.UTC(2026, 5, 15, h, m));

  it('overlaps when intervals share a middle range', () =>
    expect(intervalsOverlap(d(9), d(10), d(9, 30), d(10, 30))).toBe(true));
  it('overlaps when one contains the other', () =>
    expect(intervalsOverlap(d(9), d(12), d(10), d(11))).toBe(true));
  it('does not overlap when A ends exactly when B starts', () =>
    expect(intervalsOverlap(d(9), d(10), d(10), d(11))).toBe(false));
  it('does not overlap when A is entirely before B', () =>
    expect(intervalsOverlap(d(8), d(9), d(10), d(11))).toBe(false));
  it('does not overlap when A is entirely after B', () =>
    expect(intervalsOverlap(d(12), d(13), d(9), d(10))).toBe(false));
});

describe('addMinutes', () => {
  it('adds 30 minutes correctly', () => {
    const base = new Date(Date.UTC(2026, 5, 15, 9, 0));
    const result = addMinutes(base, 30);
    expect(result.getUTCHours()).toBe(9);
    expect(result.getUTCMinutes()).toBe(30);
  });
  it('carries over hours', () => {
    const base = new Date(Date.UTC(2026, 5, 15, 9, 45));
    const result = addMinutes(base, 30);
    expect(result.getUTCHours()).toBe(10);
    expect(result.getUTCMinutes()).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// getAvailableSlots — mocked DB
//
// The mock handles two query shapes:
//   db.select().from(table).where(cond)   → uses where() to resolve
//   db.select().from(table)               → from() itself resolves (no where)
//
// Both share the same sequential response array indexed by the select() call.
// ---------------------------------------------------------------------------

type AvailabilityRow = { staffId: string; dayOfWeek: number; startTime: string; endTime: string; maxConcurrent: number };
type BlockedDateRow  = { staffId: string; startDate: string; endDate: string };
type ServiceRow      = { id: string; durationMinutes: number };
type SettingsRow     = { slotDurationMinutes: number };
type BookingRow      = { startTime: Date; endTime: Date; staffId: string; status: string };

function makeMockDb(overrides: {
  availability?: AvailabilityRow[];
  blockedDates?: BlockedDateRow[];
  services?: ServiceRow[];
  settings?: SettingsRow[];
  bookings?: BookingRow[];
} = {}) {
  const {
    availability = [],
    blockedDates = [],
    services = [],
    settings = [{ slotDurationMinutes: 30 }],
    bookings = [],
  } = overrides;

  // Query order in getAvailableSlots:
  //  0 — staffAvailability  (has .where)
  //  1 — staffBlockedDates  (has .where)
  //  2 — services           (has .where)
  //  3 — merchantSettings   (NO .where — from() resolves directly)
  //  4 — bookings           (has .where)
  const responses: Array<unknown[]> = [availability, blockedDates, services, settings, bookings];

  const schema = {
    staffAvailability: { staffId: 'staffId', dayOfWeek: 'dayOfWeek', startTime: 'startTime', endTime: 'endTime', maxConcurrent: 'maxConcurrent' },
    staffBlockedDates: { staffId: 'staffId', startDate: 'startDate', endDate: 'endDate' },
    services: { id: 'id', durationMinutes: 'durationMinutes' },
    merchantSettings: { slotDurationMinutes: 'slotDurationMinutes' },
    bookings: { staffId: 'staffId', status: 'status', startTime: 'startTime', endTime: 'endTime', id: 'id' },
  } as unknown as ReturnType<typeof import('../db/merchant-schema').createMerchantSchema>;

  let callIdx = 0;

  const mockSelect = vi.fn().mockImplementation(() => {
    const idx = callIdx++;
    const resp = responses[idx] ?? [];

    // Create a chainable object where from() returns a thenable that also has .where()
    const resolvedResp = Promise.resolve(resp);
    const chainWithWhere = Object.assign(Object.create(resolvedResp), {
      then: resolvedResp.then.bind(resolvedResp),
      catch: resolvedResp.catch.bind(resolvedResp),
      finally: resolvedResp.finally.bind(resolvedResp),
      where: vi.fn().mockResolvedValue(resp),
    });

    return {
      from: vi.fn().mockReturnValue(chainWithWhere),
    };
  });

  const db = { select: mockSelect } as unknown as Parameters<typeof getAvailableSlots>[0]['db'];
  return { db, schema };
}

describe('getAvailableSlots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when staff has no availability on that day', async () => {
    const { db, schema } = makeMockDb({ availability: [] });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15', // Monday
      db,
      schema,
    });
    expect(slots).toHaveLength(0);
  });

  it('returns empty array when date is blocked', async () => {
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', maxConcurrent: 1 }],
      blockedDates: [{ staffId: 'staff-1', startDate: '2026-06-15', endDate: '2026-06-15' }],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    expect(slots).toHaveLength(0);
  });

  it('returns empty array when service not found', async () => {
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', maxConcurrent: 1 }],
      blockedDates: [],
      services: [],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    expect(slots).toHaveLength(0);
  });

  it('generates correct slots for 9–10am window, 30-min service, 30-min step', async () => {
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', maxConcurrent: 1 }],
      blockedDates: [],
      services: [{ id: 'svc-1', durationMinutes: 30 }],
      settings: [{ slotDurationMinutes: 30 }],
      bookings: [],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    expect(slots).toHaveLength(2);
    expect(slots[0].startTime.getUTCHours()).toBe(9);
    expect(slots[0].startTime.getUTCMinutes()).toBe(0);
    expect(slots[1].startTime.getUTCHours()).toBe(9);
    expect(slots[1].startTime.getUTCMinutes()).toBe(30);
  });

  it('generates 16 slots for 9–17 window, 30-min service, 30-min step', async () => {
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', maxConcurrent: 1 }],
      blockedDates: [],
      services: [{ id: 'svc-1', durationMinutes: 30 }],
      settings: [{ slotDurationMinutes: 30 }],
      bookings: [],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    // 9:00–16:30 → 16 slots
    expect(slots).toHaveLength(16);
  });

  it('removes a booked slot when maxConcurrent=1', async () => {
    const bookedStart = buildUtcDate('2026-06-15', '09:00');
    const bookedEnd = buildUtcDate('2026-06-15', '09:30');
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', maxConcurrent: 1 }],
      blockedDates: [],
      services: [{ id: 'svc-1', durationMinutes: 30 }],
      settings: [{ slotDurationMinutes: 30 }],
      bookings: [{ startTime: bookedStart, endTime: bookedEnd, staffId: 'staff-1', status: 'confirmed' }],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    // 9:00 is taken, only 9:30 remains
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime.getUTCMinutes()).toBe(30);
  });

  it('keeps the slot when maxConcurrent=2 and only 1 booking exists', async () => {
    const bookedStart = buildUtcDate('2026-06-15', '09:00');
    const bookedEnd = buildUtcDate('2026-06-15', '09:30');
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', maxConcurrent: 2 }],
      blockedDates: [],
      services: [{ id: 'svc-1', durationMinutes: 30 }],
      settings: [{ slotDurationMinutes: 30 }],
      bookings: [{ startTime: bookedStart, endTime: bookedEnd, staffId: 'staff-1', status: 'confirmed' }],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    // 9:00 has 1 booking, maxConcurrent=2 → still available
    expect(slots).toHaveLength(2);
  });

  it('removes slot when maxConcurrent=2 and 2 bookings exist for same slot', async () => {
    const bookedStart = buildUtcDate('2026-06-15', '09:00');
    const bookedEnd = buildUtcDate('2026-06-15', '09:30');
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', maxConcurrent: 2 }],
      blockedDates: [],
      services: [{ id: 'svc-1', durationMinutes: 30 }],
      settings: [{ slotDurationMinutes: 30 }],
      bookings: [
        { startTime: bookedStart, endTime: bookedEnd, staffId: 'staff-1', status: 'confirmed' },
        { startTime: bookedStart, endTime: bookedEnd, staffId: 'staff-1', status: 'confirmed' },
      ],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    // 9:00 is full (2/2); 9:30 still available
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime.getUTCMinutes()).toBe(30);
  });

  it('slot step determines frequency (15-min step)', async () => {
    const { db, schema } = makeMockDb({
      availability: [{ staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', maxConcurrent: 1 }],
      blockedDates: [],
      services: [{ id: 'svc-1', durationMinutes: 30 }],
      settings: [{ slotDurationMinutes: 15 }],
      bookings: [],
    });
    const slots = await getAvailableSlots({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      date: '2026-06-15',
      db,
      schema,
    });
    // 9:00, 9:15, 9:30 → 3 slots (9:45+30=10:15 > 10:00)
    expect(slots).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// isSlotAvailable — mocked DB
// ---------------------------------------------------------------------------

describe('isSlotAvailable', () => {
  it('returns true when no bookings exist', async () => {
    const schema = {
      bookings: { staffId: 's', status: 's', startTime: 's', endTime: 's', id: 's' },
      staffAvailability: { staffId: 's', dayOfWeek: 'd', maxConcurrent: 'm' },
    } as unknown as ReturnType<typeof import('../db/merchant-schema').createMerchantSchema>;

    let callCount = 0;
    const responses = [[{ maxConcurrent: 1 }], []];
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve(responses[callCount++] ?? [])),
      })),
    } as unknown as Parameters<typeof isSlotAvailable>[0]['db'];

    const start = new Date(Date.UTC(2026, 5, 15, 10, 0));
    const end = new Date(Date.UTC(2026, 5, 15, 10, 30));
    const result = await isSlotAvailable({ staffId: 'staff-1', startTime: start, endTime: end, db, schema });
    expect(result).toBe(true);
  });

  it('returns false when slot is at capacity (maxConcurrent=1, 1 booking)', async () => {
    const schema = {
      bookings: { staffId: 's', status: 's', startTime: 's', endTime: 's', id: 's' },
      staffAvailability: { staffId: 's', dayOfWeek: 'd', maxConcurrent: 'm' },
    } as unknown as ReturnType<typeof import('../db/merchant-schema').createMerchantSchema>;

    let callCount = 0;
    const responses = [[{ maxConcurrent: 1 }], [{ id: 'existing-booking' }]];
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve(responses[callCount++] ?? [])),
      })),
    } as unknown as Parameters<typeof isSlotAvailable>[0]['db'];

    const start = new Date(Date.UTC(2026, 5, 15, 10, 0));
    const end = new Date(Date.UTC(2026, 5, 15, 10, 30));
    const result = await isSlotAvailable({ staffId: 'staff-1', startTime: start, endTime: end, db, schema });
    expect(result).toBe(false);
  });

  it('returns true when maxConcurrent=2 and only 1 booking exists', async () => {
    const schema = {
      bookings: { staffId: 's', status: 's', startTime: 's', endTime: 's', id: 's' },
      staffAvailability: { staffId: 's', dayOfWeek: 'd', maxConcurrent: 'm' },
    } as unknown as ReturnType<typeof import('../db/merchant-schema').createMerchantSchema>;

    let callCount = 0;
    const responses = [[{ maxConcurrent: 2 }], [{ id: 'booking-1' }]];
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve(responses[callCount++] ?? [])),
      })),
    } as unknown as Parameters<typeof isSlotAvailable>[0]['db'];

    const start = new Date(Date.UTC(2026, 5, 15, 10, 0));
    const end = new Date(Date.UTC(2026, 5, 15, 10, 30));
    const result = await isSlotAvailable({ staffId: 'staff-1', startTime: start, endTime: end, db, schema });
    expect(result).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Race-condition simulation (CRIT-2 load test logic unit-level verification)
  //
  // Simulates two concurrent `isSlotAvailable` calls for the same slot.
  // Both calls see 0 existing bookings at query time (the TOCTOU window that
  // the k6 race scenario tests at integration level). Both return `true`.
  //
  // This verifies that the optimistic check logic is consistent and that the
  // race condition the k6 load test is designed to catch is a real possibility
  // in an unserial concurrent environment — the DB-level constraint or
  // serialisation is the expected last line of defence.
  // ---------------------------------------------------------------------------

  it('race-condition: two simultaneous isSlotAvailable calls for the same empty slot both return true (TOCTOU window)', async () => {
    const schema = {
      bookings: { staffId: 's', status: 's', startTime: 's', endTime: 's', id: 's' },
      staffAvailability: { staffId: 's', dayOfWeek: 'd', maxConcurrent: 'm' },
    } as unknown as ReturnType<typeof import('../db/merchant-schema').createMerchantSchema>;

    // Both DB calls see 0 existing bookings (no committed booking yet)
    function makeDb() {
      let c = 0;
      return {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockImplementation(() =>
            Promise.resolve(c++ === 0 ? [{ maxConcurrent: 1 }] : [])
          ),
        })),
      } as unknown as Parameters<typeof isSlotAvailable>[0]['db'];
    }

    const start = new Date(Date.UTC(2027, 5, 15, 10, 0));
    const end   = new Date(Date.UTC(2027, 5, 15, 10, 30));
    const params = { staffId: 'staff-1', startTime: start, endTime: end, schema };

    // Fire both checks concurrently — both observe an empty slot
    const [r1, r2] = await Promise.all([
      isSlotAvailable({ ...params, db: makeDb() }),
      isSlotAvailable({ ...params, db: makeDb() }),
    ]);

    // Both return true — this is the TOCTOU gap the load test exercises.
    // The DB unique constraint / serialised insert is the backstop.
    expect(r1).toBe(true);
    expect(r2).toBe(true);
  });

  it('race-condition: second call sees first booking and returns false (post-commit state)', async () => {
    // First VU wins and inserts; second VU re-queries and sees the booking.
    const schema = {
      bookings: { staffId: 's', status: 's', startTime: 's', endTime: 's', id: 's' },
      staffAvailability: { staffId: 's', dayOfWeek: 'd', maxConcurrent: 'm' },
    } as unknown as ReturnType<typeof import('../db/merchant-schema').createMerchantSchema>;

    let c = 0;
    // Second query (overlapping check) returns the newly committed booking
    const responses = [[{ maxConcurrent: 1 }], [{ id: 'winner-booking' }]];
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve(responses[c++] ?? [])),
      })),
    } as unknown as Parameters<typeof isSlotAvailable>[0]['db'];

    const start = new Date(Date.UTC(2027, 5, 15, 10, 0));
    const end   = new Date(Date.UTC(2027, 5, 15, 10, 30));
    const result = await isSlotAvailable({ staffId: 'staff-1', startTime: start, endTime: end, db, schema });
    // Sees the winner's booking → slot full → returns false → 409 returned to loser
    expect(result).toBe(false);
  });
});
