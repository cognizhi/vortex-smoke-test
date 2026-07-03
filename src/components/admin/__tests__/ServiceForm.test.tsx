import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ServiceForm from '../ServiceForm'
import type { Service } from '@/types/admin'

const makeService = (overrides?: Partial<Service>): Service => ({
  id: 'svc-1',
  name: 'Haircut',
  description: null,
  durationMinutes: 30,
  priceCents: 4500,
  isEnabled: true,
  createdAt: '2026-06-01T00:00:00Z',
  ...overrides,
})

describe('ServiceForm', () => {
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

  it('renders "Add Service" title when no service prop is provided', () => {
    render(<ServiceForm onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByText('Add Service')).toBeInTheDocument()
  })

  it('renders "Edit Service" title when a service prop is provided', () => {
    render(
      <ServiceForm service={makeService({ name: 'Haircut' })} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )
    expect(screen.getByText('Edit Service')).toBeInTheDocument()
  })

  it('shows validation error when name is submitted empty', async () => {
    render(<ServiceForm onClose={vi.fn()} onSuccess={vi.fn()} />)
    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save service/i }))
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('calls POST /api/admin/services for a new service', async () => {
    const onSuccess = vi.fn()
    render(<ServiceForm onClose={vi.fn()} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Manicure' } })
    fireEvent.click(screen.getByRole('button', { name: /save service/i }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/admin/services',
        expect.objectContaining({ method: 'POST' }),
      )
    })
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('calls PATCH /api/admin/services/:id when editing an existing service', async () => {
    const onSuccess = vi.fn()
    const service = makeService({ id: 'svc-42', name: 'Haircut' })
    render(<ServiceForm service={service} onClose={vi.fn()} onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: /save service/i }))

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/admin/services/svc-42',
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })
})
