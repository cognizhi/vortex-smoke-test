# VRTX-0221: TDD Test Matrix

## Test Design - RED PHASE

All tests are written first, before implementation, to drive development (TDD approach).

### Test Suite: GET /api/healthz-smoke-519443986

#### Category 1: Response Status and Body
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-01 | returns HTTP 200 status | response.status === 200 |
| RH-02 | returns valid JSON with exact response body | json === { ok: true, variant: '519443986' } |
| RH-03 | response body has exactly 2 fields | Object.keys(json).length === 2; has 'ok' and 'variant' |
| RH-04 | ok field is boolean true | json.ok === true and typeof json.ok === 'boolean' |
| RH-05 | variant field is string "519443986" | json.variant === '519443986' and typeof json.variant === 'string' |

#### Category 2: HTTP Headers
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-06 | Content-Type header is application/json | response.headers.get('Content-Type').includes('application/json') |

#### Category 3: Consistency
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-07 | multiple calls return identical responses | All 5 concurrent calls return same JSON { ok: true, variant: '519443986' } |

#### Category 4: Performance
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-08 | response completes in less than 100ms | elapsed < 100ms |
| RH-09 | response completes in less than 50ms under typical conditions | elapsed < 50ms |

#### Category 5: Load Testing
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-10 | handles 50 concurrent requests with all returning 200 | All 50 responses have status 200 |
| RH-11 | all concurrent requests return correct response body | All 50 responses return { ok: true, variant: '519443986' } |

#### Category 6: No Dependencies
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-12 | handler executes without making database queries | No DB connection needed; response.status === 200 |
| RH-13 | handler returns response without requiring authentication | No auth context needed; response.status === 200 and json.ok === true |
| RH-14 | handler has no external side effects | Multiple calls return identical responses with no side effects |

#### Category 7: Type Safety
| Test ID | Test Name | Expectation |
|---------|-----------|-------------|
| RH-15 | response is a NextResponse instance | response instanceof NextResponse |

## RED Phase Test Count: 15 tests
## Expected Coverage: 100% (simple handler with no branches)

## Implementation Strategy
- Use Vitest with jsdom environment (default for API routes)
- Import GET handler directly from route.ts
- Use performance.now() for timing tests
- Use Promise.all() for concurrent test scenarios
- Verify JSON shape without schema validation library (inline checks)
