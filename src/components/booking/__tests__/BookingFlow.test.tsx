/**
 * Tests for the BookingFlow multi-step client component.
 *
 * We render it with stub data (no DB) and verify:
 *  - Step 1: staff cards are rendered; selecting one advances to step 2
 *  - Step 2: service cards are rendered; selecting one advances to step 3
 *  - Step 3: date selection triggers slot fetch; slot selection advances to step 4
 *  - Step 4: form validation fires; successful submit shows step 5
 *  - Back navigation works
 *  - Error states (slot fetch failure, submit 409) show messages
 *  - Empty states (no staff, no services) render gracefully
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import BookingFlow from '../../../app/site/[slug]/BookingFlow';
import type { BookingFlowProps } from '../../../app/site/[slug]/BookingFlow';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STAFF = [
  { id: 'staff-1', name: 'Alice', photoUrl: null },
  { id: 'staff-2', name: 'Bob', photoUrl: null },
];

const SERVICES = [
  { id: 'svc-1', name: 'Haircut', description: 'Includes wash', durationMinutes: 45, priceCents: 4500 },
  { id: 'svc-2', name: 'Beard Trim', description: null, durationMinutes: 30, priceCents: 2500 },
];

const DESIGN = {
  pageHeadline: 'Book now',
  pageSubheadline: 'Fast and easy',
  slotAvailableBg: '#ECFDF5',
  slotAvailableText: '#065F46',
  slotUnavailableBg: '#F1F5F9',
  slotUnavailableText: '#475569',
};

const DEFAULT_PROPS: BookingFlowProps = {
  slug: 'test-salon',
  customSiteName: 'Test Salon',
  staff: STAFF,
  services: SERVICES,
  design: DESIGN,
};

const SLOT = {
  startTime: '2026-08-01T09:00:00.000Z',
  endTime: '2026-08-01T09:45:00.000Z',
};

// ---------------------------------------------------------------------------
// fetch mock helpers
// ---------------------------------------------------------------------------

function mockSlotsOk(slots = [SLOT]) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ data: { slots }, error: null }),
  } as unknown as Response);
}

function mockSlotsError() {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({ data: null, error: { message: 'Server error' } }),
  } as unknown as Response);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderFlow(props: Partial<BookingFlowProps> = {}) {
  return render(<BookingFlow {...DEFAULT_PROPS} {...props} />);
}

/** Advance through staff + service selection */
async function goToStep3() {
  fireEvent.click(screen.getByRole('button', { name: /alice/i }));
  await waitFor(() => expect(screen.getByText(/select a service/i)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /haircut/i }));
  await waitFor(() => expect(screen.getByText(/choose a date/i)).toBeInTheDocument());
}

/** Click on the first available calendar date cell.
 *  Calendar day buttons render only the day-of-month number (1–31) as text,
 *  which is a reliable selector that survives Intl locale differences in jsdom.
 */
function pickDate() {
  const buttons = screen
    .getAllByRole('button')
    .filter(
      (b) =>
        !b.hasAttribute('disabled') &&
        /^\d{1,2}$/.test((b.textContent ?? '').trim())
    );
  if (buttons.length === 0) throw new Error('No selectable calendar date buttons found');
  // Click the first available (non-disabled) day
  fireEvent.click(buttons[0]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookingFlow — Step 1: Staff selection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the business name header', () => {
    renderFlow();
    expect(screen.getByText('Test Salon')).toBeInTheDocument();
  });

  it('renders merchant headline from design', () => {
    renderFlow();
    expect(screen.getByText('Book now')).toBeInTheDocument();
  });

  it('renders staff cards', () => {
    renderFlow();
    expect(screen.getByRole('button', { name: /alice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bob/i })).toBeInTheDocument();
  });

  it('shows empty state when no staff provided', () => {
    renderFlow({ staff: [] });
    expect(screen.getByText(/no staff available/i)).toBeInTheDocument();
  });

  it('advances to step 2 when a staff member is selected', async () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    await waitFor(() => {
      expect(screen.getByText(/select a service/i)).toBeInTheDocument();
    });
  });
});

describe('BookingFlow — Step 2: Service selection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders service cards after staff selection', async () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /haircut/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /beard trim/i })).toBeInTheDocument();
    });
  });

  it('shows service price', async () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    await waitFor(() => {
      expect(screen.getByText('$45.00')).toBeInTheDocument();
    });
  });

  it('shows empty state when no services provided', async () => {
    renderFlow({ services: [] });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    await waitFor(() => {
      expect(screen.getByText(/no services available/i)).toBeInTheDocument();
    });
  });

  it('goes back to step 1 via back button', async () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    await waitFor(() => expect(screen.getByText(/select a service/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /back to staff selection/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /alice/i })).toBeInTheDocument();
    });
  });

  it('advances to step 3 when a service is selected', async () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /haircut/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /haircut/i }));
    await waitFor(() => {
      expect(screen.getByText(/choose a date/i)).toBeInTheDocument();
    });
  });
});

describe('BookingFlow — Step 3: Date & slot selection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a calendar', async () => {
    renderFlow();
    await goToStep3();
    // Calendar month label should be visible
    const monthLabels = screen.getAllByText(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i);
    expect(monthLabels.length).toBeGreaterThan(0);
  });

  it('fetches slots when a date is selected', async () => {
    mockSlotsOk([SLOT]);
    renderFlow();
    await goToStep3();
    act(() => { pickDate(); });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/booking/slots')
      );
    });
  });

  it('shows available slot times after fetch', async () => {
    mockSlotsOk([SLOT]);
    renderFlow();
    await goToStep3();
    act(() => { pickDate(); });
    // findByRole waits until the element appears
    const slotBtn = await screen.findByRole('button', { name: /available/i });
    expect(slotBtn).toBeTruthy();
  });

  it('shows error message when slots fetch fails', async () => {
    mockSlotsError();
    renderFlow();
    await goToStep3();
    act(() => { pickDate(); });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows empty state when no slots returned', async () => {
    mockSlotsOk([]);
    renderFlow();
    await goToStep3();
    act(() => { pickDate(); });
    await waitFor(() => {
      expect(screen.getByText(/no available slots/i)).toBeInTheDocument();
    });
  });

  it('goes back to step 2 via back button', async () => {
    renderFlow();
    await goToStep3();
    fireEvent.click(screen.getByRole('button', { name: /back to service selection/i }));
    await waitFor(() => {
      expect(screen.getByText(/select a service/i)).toBeInTheDocument();
    });
  });
});

describe('BookingFlow — Step 4: Customer form', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function goToStep4() {
    // Queue one slots response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { slots: [SLOT] }, error: null }),
    } as unknown as Response);

    renderFlow();
    await goToStep3();

    // Pick a date (synchronous click, triggers async slot fetch)
    act(() => { pickDate(); });

    // Wait for slot button: aria-label contains "available" (set by SlotGrid)
    const slotBtn = await screen.findByRole('button', { name: /available/i });

    // Click slot to advance to step 4
    act(() => { fireEvent.click(slotBtn); });
    // Wait for the step-4 section heading (the badge span also says "Your Details",
    // so we target the <h2> specifically via role=heading)
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /your details/i })).toBeInTheDocument()
    );
  }

  it('renders customer form fields', async () => {
    await goToStep4();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument();
  });

  it('shows booking summary in step 4', async () => {
    await goToStep4();
    // Summary card shows staff name and service name
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/haircut/i).length).toBeGreaterThan(0);
  });

  it('shows validation errors on empty submit', async () => {
    await goToStep4();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('blocks submission without email and shows an alert', async () => {
    // Submitting with only firstName (skip email) → contact number required or validation fires
    await goToStep4();
    // Fill firstName but leave email and contactNumber empty → Zod fires for firstName/email
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Sarah' } });
    // Leave email empty intentionally → should get an email error
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    await waitFor(() => {
      // Any validation alert should appear (email or contact number error)
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('shows confirmation on successful submit', async () => {
    await goToStep4();

    // Queue confirm response AFTER goToStep4 (which sets up the slots mock and consumes it)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        data: { bookingId: 'bk-1', confirmationNumber: 'BK-1001', cancelToken: 'tok' },
        error: null,
      }),
    } as unknown as Response);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Sarah' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'sarah@test.com' } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: '555-1234' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument();
      expect(screen.getByText('BK-1001')).toBeInTheDocument();
    });
  });

  it('shows slot-taken error on 409 response', async () => {
    await goToStep4();

    // Queue the 409 response for the confirm call
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ data: null, error: { message: 'Slot taken' } }),
    } as unknown as Response);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Sarah' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'sarah@test.com' } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: '555-1234' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('BookingFlow — single-staff auto-advance', () => {
  it('still shows staff step but with only one option', () => {
    renderFlow({ staff: [STAFF[0]] });
    // Even with one staff, step 1 is shown
    expect(screen.getByRole('button', { name: /alice/i })).toBeInTheDocument();
  });
});

describe('BookingFlow — helper functions (exported via formatPrice)', () => {
  it('renders duration correctly for minutes under 60', () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    // "45 min" appears in service card for Haircut
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('renders price correctly', () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });
});
