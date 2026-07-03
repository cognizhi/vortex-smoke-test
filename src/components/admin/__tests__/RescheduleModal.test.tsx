import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RescheduleModal from '../RescheduleModal'
import type { Booking, Staff } from '@/types/admin'

const makeBooking = (overrides?: Partial<Booking>): Booking => ({
  id: 'bk-1',
  confirmationNumber: 'BK-1001',
  status: 'confirmed',
  startTime: '2026-06-15T10:00:00Z',
  endTime: '2026-06-15T10:45:00Z',
  staffId: 'staff-1',
  serviceId: 'svc-1',
  customerId: 'cust-1',
  cancelToken: 'tok',
  cancelledAt: null,
  createdAt: '2026-06-01T00:00:00Z',
  ...overrides,
})

const STAFF: Staff[] = [
  { id: 'staff-1', name: 'Alice', photoUrl: null, contactNumber: null, email: null, isVisible: true, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'staff-2', name: 'Bob', photoUrl: null, contactNumber: null, email: null, isVisible: true, createdAt: '2026-06-01T00:00:00Z' },
]

describe('RescheduleModal', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing when booking is null', () => {
    const { container } = render(
      <RescheduleModal booking={null} staff={[]} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with booking reference when booking is provided', () => {
    render(
      <RescheduleModal booking={makeBooking()} staff={[]} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(screen.getByText('Reschedule Booking')).toBeInTheDocument()
    expect(screen.getByText(/#BK-1001/)).toBeInTheDocument()
  })

  it('shows date and time inputs pre-filled from booking', () => {
    render(
      <RescheduleModal booking={makeBooking()} staff={[]} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(screen.getByLabelText(/new date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new time/i)).toBeInTheDocument()
  })

  it('renders staff dropdown when staff is provided', () => {
    render(
      <RescheduleModal booking={makeBooking()} staff={STAFF} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('does not render staff dropdown when staff list is empty', () => {
    render(
      <RescheduleModal booking={makeBooking()} staff={[]} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(screen.queryByLabelText(/staff/i)).toBeNull()
  })

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn()
    render(
      <RescheduleModal booking={makeBooking()} staff={[]} onClose={onClose} onSuccess={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onSuccess and onClose on successful reschedule', async () => {
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    render(
      <RescheduleModal booking={makeBooking()} staff={[]} onClose={onClose} onSuccess={onSuccess} />,
    )

    // Update date and time to ensure fields are set (they're pre-filled from booking)
    const dateInput = screen.getByLabelText(/new date/i)
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })
    const timeInput = screen.getByLabelText(/new time/i)
    fireEvent.change(timeInput, { target: { value: '11:00' } })

    fireEvent.click(screen.getByRole('button', { name: /reschedule/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows error message when API call fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Slot no longer available' }),
      }),
    )

    render(
      <RescheduleModal booking={makeBooking()} staff={[]} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )

    const dateInput = screen.getByLabelText(/new date/i)
    fireEvent.change(dateInput, { target: { value: '2026-07-01' } })
    const timeInput = screen.getByLabelText(/new time/i)
    fireEvent.change(timeInput, { target: { value: '11:00' } })

    fireEvent.click(screen.getByRole('button', { name: /reschedule/i }))

    await waitFor(() => {
      expect(screen.getByText('Slot no longer available')).toBeInTheDocument()
    })
  })
})
