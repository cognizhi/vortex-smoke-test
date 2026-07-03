'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useStaff } from '@/hooks/useAdminData'
import { StaffForm } from '@/components/admin/StaffForm'
import type { Staff } from '@/types/admin'

export default function StaffPage() {
  const { data, error, loading, refetch } = useStaff()
  const [formOpen, setFormOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const staff = data?.staff ?? []

  function openCreate() {
    setEditingStaff(null)
    setFormOpen(true)
  }

  function openEdit(member: Staff) {
    setEditingStaff(member)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingStaff(null)
  }

  function handleFormSuccess() {
    closeForm()
    void refetch()
  }

  function openDelete(member: Staff) {
    setDeleteTarget(member)
    setDeleteError(null)
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDeleteError(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/admin/staff/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        const message = (json as { error?: string }).error ?? `Request failed (${res.status})`
        setDeleteError(message)
        return
      }
      closeDelete()
      void refetch()
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your team members and their availability.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && staff.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">No staff members yet. Add your first one above.</p>
        </div>
      )}

      {!loading && !error && staff.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Visible</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {member.email ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {member.contactNumber ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.isVisible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {member.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(member)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <Link
                        href={`/admin/staff/${member.id}/availability`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Availability
                      </Link>
                      <button
                        onClick={() => openDelete(member)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
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

      {/* Staff form modal */}
      {formOpen && (
        <StaffForm
          staff={editingStaff}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDelete()
          }}
        >
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Delete staff member</h2>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-medium">{deleteTarget.name}</span>? This action cannot be undone.
              </p>
              {deleteError && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={closeDelete}
                disabled={deleting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
