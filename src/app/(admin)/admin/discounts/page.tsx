'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Tag } from 'lucide-react'
import { useDiscounts } from '@/hooks/useAdminData'
import CreateDiscountForm from '@/components/admin/CreateDiscountForm'
import type { Discount } from '@/types/admin'

function formatPrice(value: string | number, type: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (type === 'percentage') {
    return numValue.toFixed(2) + '%'
  }
  return '$' + numValue.toFixed(2)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isExpired(expirationDate: string): boolean {
  return new Date(expirationDate) < new Date()
}

export default function DiscountsPage() {
  const { data, error, loading, refetch } = useDiscounts()
  const [formOpen, setFormOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const discounts = data?.discounts ?? []

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await refetch()
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const handleToggleActive = async (discount: Discount) => {
    try {
      await fetch(`/api/admin/discounts/${discount.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !discount.isActive }),
      })
      await refetch()
    } catch (err) {
      console.error('Failed to toggle discount:', err)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Discounts</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage discount codes for your bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Create Discount
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="ml-3 text-sm text-neutral-500 dark:text-neutral-400">Loading discounts…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Failed to load discounts: {error}
        </div>
      )}

      {!loading && !error && discounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <Tag className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">No discounts yet.</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Create your first discount
          </button>
        </div>
      )}

      {!loading && !error && discounts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-900">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{discount.code}</div>
                    {discount.description && (
                      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {discount.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                    {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                    {formatPrice(discount.value, discount.type)}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isExpired(discount.expirationDate)
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDate(discount.expirationDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(discount)}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      {discount.isActive ? (
                        <ToggleRight className="h-6 w-6 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-neutral-400" />
                      )}
                      <span className={discount.isActive ? 'text-indigo-600' : 'text-neutral-400'}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(discount.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        aria-label={`Delete ${discount.code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Discount Form Modal */}
      {formOpen && (
        <CreateDiscountForm
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false)
            void refetch()
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Delete discount?</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              This action cannot be undone. The discount will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === confirmDeleteId}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
