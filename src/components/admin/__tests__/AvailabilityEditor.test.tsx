import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AvailabilityEditor from '../AvailabilityEditor'
import type { StaffAvailability } from '@/types/admin'

const makeAvailability = (overrides?: Partial<StaffAvailability>[]): StaffAvailability[] => [
  { id: 'av-1', staffId: 'staff-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', maxConcurrent: 1 },
  { id: 'av-2', staffId: 'staff-1', dayOfWeek: 3, startTime: '10:00', endTime: '18:00', maxConcurrent: 1 },
  ...(overrides ?? []).map((o, i) => ({
    id: `av-extra-${i}`,
    staffId: 'staff-1',
    dayOfWeek: 5,
    startTime: '09:00',
    endTime: '17:00',
    maxConcurrent: 1,
    ...o,
  })),
]

describe('AvailabilityEditor', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all 7 days of the week', () => {
    render(
      <AvailabilityEditor
        staffId="staff-1"
        staffName="Alice"
        availability={[]}
        onSuccess={vi.fn()}
      />,
    )
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    days.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument()
    })
  })

  it('shows the staff name in the heading', () => {
    render(
      <AvailabilityEditor
        staffId="staff-1"
        staffName="Carol"
        availability={[]}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.getByText(/carol/i)).toBeInTheDocument()
  })

  it('marks enabled days as checked based on availability', () => {
    const availability = makeAvailability()
    render(
      <AvailabilityEditor
        staffId="staff-1"
        staffName="Alice"
        availability={availability}
        onSuccess={vi.fn()}
      />,
    )
    // Monday (dayOfWeek=1) and Wednesday (dayOfWeek=3) should be checked
    const checkboxes = screen.getAllByRole('checkbox')
    // DAY_ORDER: Mon=idx0, Tue=idx1, Wed=idx2, Thu=idx3, Fri=idx4, Sat=idx5, Sun=idx6
    expect(checkboxes[0]).toBeChecked()   // Monday
    expect(checkboxes[1]).not.toBeChecked() // Tuesday
    expect(checkboxes[2]).toBeChecked()   // Wednesday
  })

  it('toggles a day on/off when checkbox is clicked', () => {
    render(
      <AvailabilityEditor
        staffId="staff-1"
        staffName="Alice"
        availability={[]}
        onSuccess={vi.fn()}
      />,
    )
    const [mondayCheckbox] = screen.getAllByRole('checkbox')
    expect(mondayCheckbox).not.toBeChecked()
    fireEvent.click(mondayCheckbox!)
    expect(mondayCheckbox).toBeChecked()
  })

  it('calls the PUT endpoint and onSuccess when Save is clicked', async () => {
    const onSuccess = vi.fn()
    render(
      <AvailabilityEditor
        staffId="staff-1"
        staffName="Alice"
        availability={makeAvailability()}
        onSuccess={onSuccess}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /save availability/i }))
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/admin/staff/staff-1/availability',
        expect.objectContaining({ method: 'PUT' }),
      )
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows an error message when save fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      }),
    )
    render(
      <AvailabilityEditor
        staffId="staff-1"
        staffName="Alice"
        availability={[]}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /save availability/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
