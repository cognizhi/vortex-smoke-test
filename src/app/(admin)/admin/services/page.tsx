'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useServices } from '@/hooks/useAdminData'
import ServiceForm from '@/components/admin/ServiceForm'
import type { Service } from '@/types/admin'

function formatPrice(priceCents: number | null): string {
  if (priceCents === null) return '—'
  return '$' + (priceCents / 100).toFixed(2)
}

export default function ServicesPage() {
  const { data, error, loading, refetch } = useServices()
  const [formService, setFormService] = useState<Service | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const services = data?.services ?? []

  const handleToggleEnabled = async (service: Service) => {
    setTogglingId(service.id)
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !service.isEnabled }),
      })
      await refetch()
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      await refetch()
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Services</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage the services offered at your business.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormService(null)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="ml-3 text-sm text-neutral-500 dark:text-neutral-400">Loading services…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Failed to load services: {error}
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 py-16 dark:border-neutral-700">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No services yet.</p>
          <button
            type="button"
            onClick={() => setFormService(null)}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add your first service
          </button>
        </div>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Enabled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-900">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {service.name}
                    </div>
                    {service.description && (
                      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {service.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                    {service.durationMinutes} min
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                    {formatPrice(service.priceCents)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => void handleToggleEnabled(service)}
                      disabled={togglingId === service.id}
                      aria-label={service.isEnabled ? 'Disable service' : 'Enable service'}
                      className="flex items-center gap-1.5 text-sm disabled:opacity-50"
                    >
                      {service.isEnabled ? (
                        <ToggleRight className="h-6 w-6 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-neutral-400" />
                      )}
                      <span className={service.isEnabled ? 'text-indigo-600' : 'text-neutral-400'}>
                        {service.isEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setFormService(service)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                        aria-label={`Edit ${service.name}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(service.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        aria-label={`Delete ${service.name}`}
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

      {/* ServiceForm modal — undefined means closed, null means add, object means edit */}
      {formService !== undefined && (
        <ServiceForm
          service={formService}
          onClose={() => setFormService(undefined)}
          onSuccess={() => {
            setFormService(undefined)
            void refetch()
          }}
        />
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Delete service?
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              This action cannot be undone. The service will be permanently removed.
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
