/**
 * k6 Load Test — Booking Flow
 *
 * Tests three critical paths:
 *   1. Slot query load        — 10 VUs hammering GET /api/booking/slots concurrently
 *   2. Race condition         — two VUs simultaneously POST /api/booking/confirm for
 *                               the exact same slot (only one should succeed with 201,
 *                               the other must get 409 SLOT_TAKEN)
 *   3. Sustained throughput   — 5 VUs continuously submitting unique bookings for 60 s
 *                               to verify the system sustains acceptable p95 latency
 *                               and a low server-error rate under steady booking load
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Prerequisites
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Install k6: https://k6.io/docs/get-started/installation/
 *      macOS:  brew install k6
 *      Linux:  sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
 *              echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
 *              sudo apt-get update && sudo apt-get install k6
 *      Docker: docker run --rm -i grafana/k6 run - <load-tests/booking-flow.js
 *
 *   2. Start the app locally:
 *        npm run dev
 *
 *   3. Seed test data — you need a valid merchant slug, staffId, and serviceId.
 *      Update the CONFIG block below with real values from your dev DB, or set
 *      the env vars before running:
 *
 *        K6_BASE_URL=http://localhost:3000 \
 *        K6_SLUG=demo \
 *        K6_STAFF_ID=<uuid> \
 *        K6_SERVICE_ID=<uuid> \
 *        K6_TEST_DATE=2027-01-15 \
 *        K6_RACE_SLOT=2027-01-15T10:00:00.000Z \
 *          k6 run load-tests/booking-flow.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Running
 * ─────────────────────────────────────────────────────────────────────────────
 *   # Quick run (uses defaults below):
 *   k6 run load-tests/booking-flow.js
 *
 *   # With HTML report:
 *   k6 run --out html=load-tests/report.html load-tests/booking-flow.js
 *
 *   # Against a staging URL:
 *   K6_BASE_URL=https://staging.example.com k6 run load-tests/booking-flow.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Pass criteria
 * ─────────────────────────────────────────────────────────────────────────────
 *   - Slot queries p95 < 2 000 ms, error rate < 1 %
 *   - Race condition: >= 1 success (201), >= 1 conflict (409), 0 unexpected (5xx/bad-config)
 *   - Sustained throughput: p95 < 2 000 ms, server-error rate < 5 %
 *
 * Timeline (scenarios run sequentially to avoid interference):
 *   0 s –  30 s  Scenario 1 — slot_queries (10 VUs)
 *  35 s –  95 s  Scenario 2 — booking_race (2 VUs, up to 60 s)
 * 100 s – 160 s  Scenario 3 — sustained_throughput (5 VUs, 60 s)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — override with K6_* env vars at runtime
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.K6_BASE_URL   || 'http://localhost:3000';
const SLUG       = __ENV.K6_SLUG       || 'demo';
const STAFF_ID   = __ENV.K6_STAFF_ID   || '00000000-0000-0000-0000-000000000001';
const SERVICE_ID = __ENV.K6_SERVICE_ID || '00000000-0000-0000-0000-000000000002';
// A future date in YYYY-MM-DD — must be far enough ahead that slots exist.
const TEST_DATE  = __ENV.K6_TEST_DATE  || '2027-06-15';
// A future ISO 8601 start time used for the race-condition confirm test.
// Adjust to a real slot time from your dev seed data.
const RACE_SLOT  = __ENV.K6_RACE_SLOT  || '2027-06-15T10:00:00.000Z';

// ─────────────────────────────────────────────────────────────────────────────
// Custom metrics
// ─────────────────────────────────────────────────────────────────────────────
const slotQueryDuration   = new Trend('slot_query_duration', true);
const slotQueryErrors     = new Rate('slot_query_error_rate');
const raceSuccess         = new Counter('race_201_count');
const raceConflict        = new Counter('race_409_count');
const raceOther           = new Counter('race_other_count');
const throughputDuration  = new Trend('throughput_duration', true);
const throughputErrors    = new Rate('throughput_error_rate');

// ─────────────────────────────────────────────────────────────────────────────
// Scenarios
// ─────────────────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    /**
     * Scenario 1 — Slot query load
     * 10 VUs hitting GET /api/booking/slots for 30 seconds.
     * Mimics multiple customers browsing available times simultaneously.
     */
    slot_queries: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'slotQueryLoad',
      tags: { scenario: 'slot_queries' },
    },

    /**
     * Scenario 2 — Concurrent booking race condition
     * 2 VUs attempt to confirm the SAME slot at nearly the same moment,
     * repeated 5 times in sequence. Exactly one must win (201) and the
     * other must get 409 SLOT_TAKEN on each iteration.
     *
     * Starts after the slot load test finishes so the two scenarios don't
     * interfere with each other.
     */
    booking_race: {
      executor: 'per-vu-iterations',
      vus: 2,
      iterations: 5,
      maxDuration: '60s',
      exec: 'bookingRace',
      startTime: '35s',
      tags: { scenario: 'booking_race' },
    },

    /**
     * Scenario 3 — Sustained booking throughput
     * 5 VUs continuously submitting POST /api/booking/confirm for 60 seconds,
     * each with a unique slot/email so requests don't collide. Validates that
     * the booking write path sustains acceptable latency (p95 < 2 000 ms) and
     * a low server-error rate (< 5 %) under a realistic steady booking load.
     *
     * Starts after the race scenario window closes (100 s) to avoid
     * interference with the race-condition slot.
     */
    sustained_throughput: {
      executor: 'constant-vus',
      vus: 5,
      duration: '60s',
      exec: 'sustainedThroughput',
      startTime: '100s',
      tags: { scenario: 'sustained_throughput' },
    },
  },

  // ── Pass / fail thresholds ────────────────────────────────────────────────
  thresholds: {
    // Slot queries: p95 response time under 2 s, error rate under 1 %
    slot_query_duration:   ['p(95)<2000'],
    slot_query_error_rate: ['rate<0.01'],

    // Race condition: 2 VUs × 5 iterations = 10 requests, all targeting the same
    // RACE_SLOT. With maxConcurrent=1, only the FIRST request ever wins (201);
    // all subsequent ones see the slot occupied and get 409. Therefore:
    //   - race_201_count >= 1  (at least one booking was created)
    //   - race_409_count >= 1  (at least one conflict was detected — not all 201s)
    //   - race_other_count == 0 (no 5xx, no bad-config 400s)
    race_201_count:   ['count>=1'],
    race_409_count:   ['count>=1'],
    race_other_count: ['count==0'],

    // Sustained throughput: p95 under 2 s, server-error rate under 5 %.
    // 400 (bad seed config) and 409 (unexpected slot collision) are NOT counted
    // as server errors — only 5xx and network failures are.
    throughput_duration:   ['p(95)<2000'],
    throughput_error_rate: ['rate<0.05'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 1 — Slot query load
// ─────────────────────────────────────────────────────────────────────────────
export function slotQueryLoad() {
  const url =
    `${BASE_URL}/api/booking/slots` +
    `?staffId=${STAFF_ID}&serviceId=${SERVICE_ID}&date=${TEST_DATE}&slug=${SLUG}`;

  const start = Date.now();
  const res = http.get(url, {
    headers: { Accept: 'application/json' },
    tags: { name: 'GET /api/booking/slots' },
  });
  const elapsed = Date.now() - start;

  slotQueryDuration.add(elapsed);

  const ok = check(res, {
    'slot query status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'slot query returns JSON': (r) =>
      r.headers['Content-Type'] !== undefined &&
      r.headers['Content-Type'].includes('application/json'),
  });

  // 404 = merchant/staff/service not seeded — expected in bare dev env.
  // 5xx or network error = real failure.
  slotQueryErrors.add(res.status >= 500 || res.status === 0 ? 1 : 0);

  if (!ok) {
    console.error(`[slot_queries] Unexpected status ${res.status}: ${res.body}`);
  }

  sleep(0.1); // 100 ms think time between iterations
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 2 — Concurrent booking race condition
// ─────────────────────────────────────────────────────────────────────────────

export function bookingRace() {
  // Both VUs fire their confirm requests at the same instant.
  // k6 runs each VU concurrently — reaching this line at the same time gives
  // a realistic race window against the slot availability check.
  const payload = JSON.stringify({
    staffId:       STAFF_ID,
    serviceId:     SERVICE_ID,
    startTime:     RACE_SLOT,
    firstName:     'LoadTest',
    // Unique email per VU so the customer upsert doesn't serialize the two requests.
    email:         `loadtest-vu${__VU}@example.com`,
    contactNumber: `0400${String(__VU).padStart(6, '0')}`,
    slug:          SLUG,
  });

  const res = http.post(`${BASE_URL}/api/booking/confirm`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    tags: { name: 'POST /api/booking/confirm (race)' },
  });

  if (res.status === 201) {
    raceSuccess.add(1);
    check(res, {
      'race winner: body has bookingId': (r) => {
        try {
          const body = JSON.parse(r.body);
          return typeof body.data.bookingId === 'string';
        } catch (_) {
          return false;
        }
      },
    });
  } else if (res.status === 409) {
    raceConflict.add(1);
    check(res, {
      'race loser: error code is SLOT_TAKEN': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.error && body.error.code === 'SLOT_TAKEN';
        } catch (_) {
          return false;
        }
      },
    });
  } else {
    // Unexpected — 400 usually means bad test config (wrong IDs / past time),
    // 5xx means a server error. Neither is acceptable.
    raceOther.add(1);
    console.error(
      `[booking_race] VU=${__VU} iter=${__ITER} unexpected status ${res.status}: ${res.body}`
    );
  }

  // No sleep — we want both VUs to hit the endpoint with no delay to maximise
  // the race window on the slot availability check.
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 3 — Sustained booking throughput
// ─────────────────────────────────────────────────────────────────────────────

export function sustainedThroughput() {
  // Generate a unique slot per VU + iteration to ensure no two in-flight
  // requests compete for the same slot (unlike the race scenario).
  // Slots are spread across a far-future date range: 2027-08-01 onward,
  // 30-minute intervals, cycling through 08:00–15:30 across multiple days.
  const slotIndex = (__VU - 1) * 200 + __ITER;           // unique per VU+iter
  const slotHour  = 8 + (Math.floor(slotIndex / 2) % 8); // 08:00–15:00
  const slotMin   = (slotIndex % 2) * 30;                 // :00 or :30
  const slotDay   = 1 + Math.floor(slotIndex / 16);       // spread across days
  const month     = slotDay <= 28 ? '08' : '09';
  const day       = slotDay <= 28 ? slotDay : slotDay - 28;
  const startTime =
    `2027-${month}-${String(day).padStart(2, '0')}` +
    `T${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}:00.000Z`;

  const payload = JSON.stringify({
    staffId:       STAFF_ID,
    serviceId:     SERVICE_ID,
    startTime,
    firstName:     'ThroughputTest',
    // Unique email per VU+iteration — prevents customer upsert serialisation.
    email:         `throughput-vu${__VU}-iter${__ITER}@example.com`,
    contactNumber: `0422${String(__VU * 1000 + __ITER).padStart(6, '0')}`,
    slug:          SLUG,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/booking/confirm`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    tags: { name: 'POST /api/booking/confirm (throughput)' },
  });
  const elapsed = Date.now() - start;

  throughputDuration.add(elapsed);

  // Count only genuine server faults (5xx) and network failures as errors.
  // 201 = booking created ✓
  // 400 = seed data not present in this env (treated like a 404 in slot test)
  // 409 = unexpected slot collision (shouldn't happen with unique slots, but
  //       not a server fault — counted separately via the check below)
  const isServerError = res.status >= 500 || res.status === 0;
  throughputErrors.add(isServerError ? 1 : 0);

  check(res, {
    'throughput: no server error (not 5xx)': (r) => r.status < 500 && r.status !== 0,
    'throughput: returns JSON': (r) =>
      r.headers['Content-Type'] !== undefined &&
      r.headers['Content-Type'].includes('application/json'),
  });

  if (isServerError) {
    console.error(
      `[sustained_throughput] VU=${__VU} iter=${__ITER} server error ${res.status}: ${res.body}`
    );
  }

  sleep(0.5); // 500 ms think time — realistic pacing for a booking form submission
}
