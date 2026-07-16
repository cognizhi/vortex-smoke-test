/**
 * Tests for CreateDiscountForm component
 * Form validation, submission, and error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateDiscountForm from '../CreateDiscountForm'

// Mock fetch
global.fetch = vi.fn()

describe('CreateDiscountForm', () => {
  let mockOnClose: ReturnType<typeof vi.fn>
  let mockOnSuccess: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnClose = vi.fn()
    mockOnSuccess = vi.fn()
    ;(global.fetch as any).mockClear()
  })

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      expect(screen.getByLabelText(/Code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Discount Type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Discount (Percentage|Amount)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    })

    it('should render form title', () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByRole('dialog', { name: /Create discount/i })).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      expect(screen.getByRole('button', { name: /Create Discount/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument()
    })
  })

  describe('Client-side Validation', () => {
    it('should show error when code is too short', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const codeInput = screen.getByLabelText(/Code/i)

      await userEvent.type(codeInput, 'AB')
      await userEvent.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument()
      })
    })

    it('should show error when code is too long', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const codeInput = screen.getByLabelText(/Code/i)

      const longCode = 'A'.repeat(51)
      await userEvent.type(codeInput, longCode)
      await userEvent.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/50 characters or fewer/i)).toBeInTheDocument()
      })
    })

    it('should show error when code contains invalid characters', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const codeInput = screen.getByLabelText(/Code/i)

      await userEvent.type(codeInput, 'SUMMER_20!')
      await userEvent.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/letters, numbers, and hyphens/i)).toBeInTheDocument()
      })
    })

    it('should show error when percentage value is out of range', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const typeSelect = screen.getByLabelText(/Discount Type/i)
      await userEvent.selectOptions(typeSelect, 'percentage')

      const valueInput = screen.getByLabelText(/Discount Percentage/i)
      await userEvent.type(valueInput, '150')
      await userEvent.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/between 0.01 and 100/i)).toBeInTheDocument()
      })
    })

    it('should show error when fixed amount value is out of range', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const typeSelect = screen.getByLabelText(/Discount Type/i)
      await userEvent.selectOptions(typeSelect, 'fixed_amount')

      const valueInput = screen.getByLabelText(/Discount Amount/i)
      await userEvent.type(valueInput, '999999')
      await userEvent.tab() // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/between 0.01 and 99,999.99/i)).toBeInTheDocument()
      })
    })

    it('should show error when expiration date is in the past', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const expirationInput = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      fireEvent.change(expirationInput, {
        target: { value: pastDate.toISOString().slice(0, 16) },
      })
      fireEvent.blur(expirationInput)

      await waitFor(() => {
        expect(screen.getByText(/1 day in the future/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit valid form with correct data', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          data: { id: '1', code: 'SUMMER20', type: 'percentage', value: '20' },
        }),
      })

      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const codeInput = screen.getByLabelText(/Code/i)
      const typeSelect = screen.getByLabelText(/Discount Type/i)
      const valueInput = screen.getByLabelText(/Discount Percentage/i)
      const expirationInput = screen.getByLabelText(/Expiration Date/i)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await userEvent.type(codeInput, 'SUMMER20')
      await userEvent.selectOptions(typeSelect, 'percentage')
      await userEvent.type(valueInput, '20')
      fireEvent.change(expirationInput, {
        target: { value: futureDate.toISOString().slice(0, 16) },
      })

      const submitButton = screen.getByRole('button', { name: /Create Discount/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/discounts',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should show success toast on successful creation', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          data: { id: '1', code: 'SUMMER20' },
        }),
      })

      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const codeInput = screen.getByLabelText(/Code/i)
      const typeSelect = screen.getByLabelText(/Discount Type/i)
      const valueInput = screen.getByLabelText(/Discount Percentage/i)
      const expirationInput = screen.getByLabelText(/Expiration Date/i)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await userEvent.type(codeInput, 'SUMMER20')
      await userEvent.selectOptions(typeSelect, 'percentage')
      await userEvent.type(valueInput, '20')
      fireEvent.change(expirationInput, {
        target: { value: futureDate.toISOString().slice(0, 16) },
      })

      const submitButton = screen.getByRole('button', { name: /Create Discount/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/created successfully/i)).toBeInTheDocument()
      })
    })

    it('should show error for duplicate code', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        status: 409,
        json: async () => ({
          data: null,
          error: { code: 'DUPLICATE_CODE', message: 'Discount code already exists' },
        }),
      })

      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const codeInput = screen.getByLabelText(/Code/i)
      const typeSelect = screen.getByLabelText(/Discount Type/i)
      const valueInput = screen.getByLabelText(/Discount Percentage/i)
      const expirationInput = screen.getByLabelText(/Expiration Date/i)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await userEvent.type(codeInput, 'SUMMER20')
      await userEvent.selectOptions(typeSelect, 'percentage')
      await userEvent.type(valueInput, '20')
      fireEvent.change(expirationInput, {
        target: { value: futureDate.toISOString().slice(0, 16) },
      })

      const submitButton = screen.getByRole('button', { name: /Create Discount/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument()
      })
    })

    it('should keep form open on error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          data: null,
          error: { code: 'INVALID_INPUT', message: 'Invalid value' },
        }),
      })

      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const codeInput = screen.getByLabelText(/Code/i)
      const typeSelect = screen.getByLabelText(/Discount Type/i)
      const valueInput = screen.getByLabelText(/Discount Percentage/i)
      const expirationInput = screen.getByLabelText(/Expiration Date/i)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await userEvent.type(codeInput, 'SUMMER20')
      await userEvent.selectOptions(typeSelect, 'percentage')
      await userEvent.type(valueInput, '20')
      fireEvent.change(expirationInput, {
        target: { value: futureDate.toISOString().slice(0, 16) },
      })

      const submitButton = screen.getByRole('button', { name: /Create Discount/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled()
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })
  })

  describe('Cancel Button', () => {
    it('should close form when cancel button is clicked', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await userEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close form when close button is clicked', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const closeButton = screen.getByRole('button', { name: /Close/i })
      await userEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Dynamic Behavior', () => {
    it('should update help text when type changes', async () => {
      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const typeSelect = screen.getByLabelText(/Discount Type/i)

      await userEvent.selectOptions(typeSelect, 'percentage')
      expect(screen.getByText(/0.01% – 100%/)).toBeInTheDocument()

      await userEvent.selectOptions(typeSelect, 'fixed_amount')
      expect(screen.getByText(/\$0.01 – \$99,999.99/)).toBeInTheDocument()
    })

    it('should disable submit button during submission', async () => {
      ;(global.fetch as any).mockImplementationOnce(() => new Promise(() => {})) // Never resolves

      render(<CreateDiscountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const codeInput = screen.getByLabelText(/Code/i)
      const typeSelect = screen.getByLabelText(/Discount Type/i)
      const valueInput = screen.getByLabelText(/Discount Percentage/i)
      const expirationInput = screen.getByLabelText(/Expiration Date/i)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      await userEvent.type(codeInput, 'SUMMER20')
      await userEvent.selectOptions(typeSelect, 'percentage')
      await userEvent.type(valueInput, '20')
      fireEvent.change(expirationInput, {
        target: { value: futureDate.toISOString().slice(0, 16) },
      })

      const submitButton = screen.getByRole('button', { name: /Create Discount/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })
})
