import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookingDetailModal } from '../BookingDetailModal'
import type { Booking } from '@/types/admin'

const makeBooking = (overrides?: Partial<Booking>): Booking => ({
  id: 'bk-1',
  confirmationNumber: 'BK-1001',
  status: 'confirmed',
  startTime: '2026-06-15T10:00:00Z',
  endTime: '2026-06-15T10:30:00Z',
  staffId: 'staff-1',
  serviceId: 'svc-1',
  customerId: 'cust-1',
  cancelToken: 'tok',
  cancelledAt: null,
  createdAt: '2026-06-01T00:00:00Z',
  customer: { id: 'cust-1', firstName: 'Jane', email: 'jane@example.com', contactNumber: '555-0100' },
  staff: { id: 'staff-1', name: 'Alice' },
  service: { id: 'svc-1', name: 'Haircut', durationMinutes: 45, priceCents: 4500 },
  ...overrides,
})

describe('BookingDetailModal', () => {
  it('renders nothing when booking is null', () => {
    const { container } = render(
      <BookingDetailModal
        booking={null}
        onClose={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders booking details when booking is provided', () => {
    const booking = makeBooking()
    render(
      <BookingDetailModal
        booking={booking}
        onClose={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    expect(screen.getByText('Booking Details')).toBeInTheDocument()
    expect(screen.getByText(/BK-1001/)).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByText('Haircut')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('calls onClose when the X close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <BookingDetailModal
        booking={makeBooking()}
        onClose={onClose}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    // Use the aria-label="Close" X button in the header
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onReschedule when Reschedule button is clicked', () => {
    const onReschedule = vi.fn()
    const booking = makeBooking()
    render(
      <BookingDetailModal
        booking={booking}
        onClose={vi.fn()}
        onReschedule={onReschedule}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /reschedule/i }))
    expect(onReschedule).toHaveBeenCalledWith(booking)
  })

  it('shows cancel confirmation when Cancel booking is clicked', () => {
    render(
      <BookingDetailModal
        booking={makeBooking()}
        onClose={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }))
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
  })

  it('calls onCancel and onCancelSuccess when cancellation is confirmed', () => {
    const onCancel = vi.fn()
    const onCancelSuccess = vi.fn()
    const booking = makeBooking()
    render(
      <BookingDetailModal
        booking={booking}
        onClose={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={onCancel}
        onCancelSuccess={onCancelSuccess}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel booking/i }))
    expect(onCancel).toHaveBeenCalledWith(booking)
    expect(onCancelSuccess).toHaveBeenCalledTimes(1)
  })

  it('hides action buttons for cancelled bookings', () => {
    render(
      <BookingDetailModal
        booking={makeBooking({ status: 'cancelled_customer' })}
        onClose={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /cancel booking/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reschedule/i })).toBeNull()
  })

  it('shows "Cancelled (Customer)" badge for cancelled_customer status', () => {
    render(
      <BookingDetailModal
        booking={makeBooking({ status: 'cancelled_customer' })}
        onClose={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
        onCancelSuccess={vi.fn()}
      />,
    )
    expect(screen.getByText('Cancelled (Customer)')).toBeInTheDocument()
  })
})
