import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import CustomerDetail from '../CustomerDetail'
import type { Customer } from '@/types/admin'

const makeCustomer = (overrides?: Partial<Customer>): Customer => ({
  id: 'cust-1',
  firstName: 'Sarah',
  email: 'sarah@example.com',
  contactNumber: '+65 9123 4567',
  isVerified: true,
  createdAt: '2026-05-01T00:00:00Z',
  ...overrides,
})

const CUSTOMER_DETAIL_RESPONSE = {
  id: 'cust-1',
  firstName: 'Sarah',
  email: 'sarah@example.com',
  contactNumber: '+65 9123 4567',
  isVerified: true,
  createdAt: '2026-05-01T00:00:00Z',
  bookings: [
    {
      id: 'bk-1',
      confirmationNumber: 'BK-1001',
      status: 'confirmed' as const,
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T10:45:00Z',
      staffId: 'staff-1',
      serviceId: 'svc-1',
      customerId: 'cust-1',
      cancelToken: 'tok',
      cancelledAt: null,
      createdAt: '2026-06-01T00:00:00Z',
      service: { id: 'svc-1', name: 'Haircut', durationMinutes: 45, priceCents: 4500 },
      staff: { id: 'staff-1', name: 'Alice' },
    },
  ],
}

describe('CustomerDetail', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => CUSTOMER_DETAIL_RESPONSE,
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing when customer is null', () => {
    const { container } = render(
      <CustomerDetail customer={null} onClose={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows customer name and email when customer is provided', async () => {
    render(<CustomerDetail customer={makeCustomer()} onClose={vi.fn()} />)
    expect(screen.getByText('Customer Details')).toBeInTheDocument()
    expect(screen.getByText('Sarah')).toBeInTheDocument()
    expect(screen.getByText('sarah@example.com')).toBeInTheDocument()
  })

  it('shows Verified badge for verified customers', () => {
    render(<CustomerDetail customer={makeCustomer({ isVerified: true })} onClose={vi.fn()} />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('shows Unverified badge for unverified customers', () => {
    render(
      <CustomerDetail customer={makeCustomer({ isVerified: false })} onClose={vi.fn()} />,
    )
    expect(screen.getByText('Unverified')).toBeInTheDocument()
  })

  it('renders booking history after fetching', async () => {
    render(<CustomerDetail customer={makeCustomer()} onClose={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
    })
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('shows empty state when customer has no bookings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...CUSTOMER_DETAIL_RESPONSE, bookings: [] }),
      }),
    )
    render(<CustomerDetail customer={makeCustomer()} onClose={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('No bookings yet')).toBeInTheDocument()
    })
  })

  it('shows error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false }),
    )
    render(<CustomerDetail customer={makeCustomer()} onClose={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch customer details/i)).toBeInTheDocument()
    })
  })

  it('calls onClose when the X close button is clicked', () => {
    const onClose = vi.fn()
    render(<CustomerDetail customer={makeCustomer()} onClose={onClose} />)
    // Use the aria-label="Close" X button in the header
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the footer Close button is clicked', () => {
    const onClose = vi.fn()
    render(<CustomerDetail customer={makeCustomer()} onClose={onClose} />)
    // The footer has a plain "Close" text button
    const closeButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent === 'Close',
    )
    if (closeButtons[0]) {
      fireEvent.click(closeButtons[0])
    }
    expect(onClose).toHaveBeenCalled()
  })
})
