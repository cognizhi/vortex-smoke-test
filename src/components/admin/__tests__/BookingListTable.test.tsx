import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookingListTable from '../BookingListTable'
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
  customer: { id: 'cust-1', firstName: 'Jane', email: 'jane@example.com', contactNumber: '123' },
  staff: { id: 'staff-1', name: 'Alice' },
  service: { id: 'svc-1', name: 'Haircut', durationMinutes: 30, priceCents: 4500 },
  ...overrides,
})

describe('BookingListTable', () => {
  it('renders table with booking row', () => {
    render(
      <BookingListTable
        bookings={[makeBooking()]}
        onViewDetail={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('BK-1001')).toBeInTheDocument()
    expect(screen.getByText('Jane (jane@example.com)')).toBeInTheDocument()
  })

  it('shows empty state when bookings is empty', () => {
    render(
      <BookingListTable
        bookings={[]}
        onViewDetail={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('No bookings found')).toBeInTheDocument()
  })

  it('shows "Confirmed" badge for confirmed status', () => {
    render(
      <BookingListTable
        bookings={[makeBooking({ status: 'confirmed' })]}
        onViewDetail={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('shows "Cancelled" badge for cancelled_customer status', () => {
    render(
      <BookingListTable
        bookings={[makeBooking({ status: 'cancelled_customer', cancelledAt: '2026-06-10T00:00:00Z' })]}
        onViewDetail={vi.fn()}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('calls onViewDetail when View option is clicked', () => {
    const onViewDetail = vi.fn()
    const booking = makeBooking()
    render(
      <BookingListTable
        bookings={[booking]}
        onViewDetail={onViewDetail}
        onReschedule={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByLabelText('Open actions menu'))
    fireEvent.click(screen.getByRole('menuitem', { name: /view/i }))
    expect(onViewDetail).toHaveBeenCalledWith(booking)
  })
})
