'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { createDiscountSchema, type CreateDiscountInput } from '@/lib/validations/admin'

interface CreateDiscountFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateDiscountForm({ onClose, onSuccess }: CreateDiscountFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDiscountInput>({
    resolver: zodResolver(createDiscountSchema),
    mode: 'onBlur',
  })

  const type = watch('type')

  const onSubmit = async (data: CreateDiscountInput) => {
    setSubmitError(null)
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (res.status === 201) {
        const code = responseData.data?.code || data.code
        setToastMessage({ message: `Discount '${code}' created successfully`, type: 'success' })
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else if (res.status === 409) {
        setSubmitError('Discount code already exists')
        setToastMessage({ message: 'Discount code already exists', type: 'error' })
      } else {
        const errorMessage = responseData.error?.message || 'Failed to create discount'
        setSubmitError(errorMessage)
        setToastMessage({ message: `Failed: ${errorMessage}`, type: 'error' })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setSubmitError(errorMessage)
      setToastMessage({ message: 'Failed to create discount', type: 'error' })
    }
  }

  const getValueHelpText = () => {
    if (!type) return 'Enter discount value'
    if (type === 'percentage') return '0.01% – 100%'
    return '$0.01 – $99,999.99'
  }

  const getValueMax = () => {
    return type === 'percentage' ? 100 : 99999.99
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create discount"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create Discount</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Message */}
        {toastMessage && (
          <div
            className={`px-6 pt-4 pb-0 ${
              toastMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2 rounded-lg p-3 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {toastMessage.message}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5 px-6 py-5">
            {/* Code */}
            <div>
              <label
                htmlFor="cdf-code"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Code <span className="text-red-500">*</span>
              </label>
              <input
                id="cdf-code"
                type="text"
                {...register('code')}
                placeholder="e.g., SUMMER20"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? 'cdf-code-error' : undefined}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-neutral-800 dark:text-white ${
                  errors.code
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-300 focus:border-indigo-500 dark:border-neutral-600'
                }`}
              />
              {errors.code && (
                <p id="cdf-code-error" className="mt-1 text-xs text-red-500">
                  {errors.code.message}
                </p>
              )}
              {!errors.code && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  3-50 characters, alphanumeric and hyphens only
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label
                htmlFor="cdf-type"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                id="cdf-type"
                {...register('type')}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? 'cdf-type-error' : undefined}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-neutral-800 dark:text-white ${
                  errors.type
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-300 focus:border-indigo-500 dark:border-neutral-600'
                }`}
              >
                <option value="">Select discount type</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount ($)</option>
              </select>
              {errors.type && (
                <p id="cdf-type-error" className="mt-1 text-xs text-red-500">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Value */}
            <div>
              <label
                htmlFor="cdf-value"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Discount {type === 'percentage' ? 'Percentage' : 'Amount'} <span className="text-red-500">*</span>
              </label>
              <input
                id="cdf-value"
                type="number"
                step="0.01"
                min="0.01"
                max={getValueMax()}
                {...register('value', { valueAsNumber: true })}
                placeholder={type === 'percentage' ? '0–100' : '0.01–99,999.99'}
                aria-invalid={!!errors.value}
                aria-describedby={errors.value ? 'cdf-value-error' : 'cdf-value-help'}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-neutral-800 dark:text-white ${
                  errors.value
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-300 focus:border-indigo-500 dark:border-neutral-600'
                }`}
              />
              {errors.value && (
                <p id="cdf-value-error" className="mt-1 text-xs text-red-500">
                  {errors.value.message}
                </p>
              )}
              {!errors.value && (
                <p id="cdf-value-help" className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {getValueHelpText()}
                </p>
              )}
            </div>

            {/* Expiration Date */}
            <div>
              <label
                htmlFor="cdf-expiration"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Expiration Date <span className="text-red-500">*</span>
              </label>
              <input
                id="cdf-expiration"
                type="datetime-local"
                {...register('expirationDate')}
                aria-invalid={!!errors.expirationDate}
                aria-describedby={errors.expirationDate ? 'cdf-expiration-error' : 'cdf-expiration-help'}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-neutral-800 dark:text-white ${
                  errors.expirationDate
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-300 focus:border-indigo-500 dark:border-neutral-600'
                }`}
              />
              {errors.expirationDate && (
                <p id="cdf-expiration-error" className="mt-1 text-xs text-red-500">
                  {errors.expirationDate.message}
                </p>
              )}
              {!errors.expirationDate && (
                <p id="cdf-expiration-help" className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Must be at least 1 day in the future
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="cdf-description"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Description (optional)
              </label>
              <textarea
                id="cdf-description"
                rows={3}
                maxLength={255}
                {...register('description')}
                placeholder="e.g., Summer sale 20% off all services"
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? 'Creating…' : 'Create Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
