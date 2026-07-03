import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StaffForm } from '../StaffForm'
import type { Staff } from '@/types/admin'

const makeStaff = (overrides?: Partial<Staff>): Staff => ({
  id: 'staff-1',
  name: 'Alice',
  photoUrl: null,
  contactNumber: '555-0100',
  email: 'alice@example.com',
  isVisible: true,
  createdAt: '2026-06-01T00:00:00Z',
  ...overrides,
})

describe('StaffForm', () => {
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

  it('renders "Add staff member" title for a new staff form', () => {
    render(<StaffForm onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Add staff member')).toBeInTheDocument()
  })

  it('renders edit form pre-populated with staff data', () => {
    const staff = makeStaff({ name: 'Bob', email: 'bob@example.com', contactNumber: '555-9999' })
    render(<StaffForm staff={staff} onClose={vi.fn()} onSuccess={vi.fn()} />)

    expect(screen.getByText(`Edit ${staff.name}`)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
    expect(screen.getByDisplayValue('bob@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('555-9999')).toBeInTheDocument()
  })

  it('shows a validation error when name is submitted empty', async () => {
    render(<StaffForm onClose={vi.fn()} onSuccess={vi.fn()} />)
    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })
})
