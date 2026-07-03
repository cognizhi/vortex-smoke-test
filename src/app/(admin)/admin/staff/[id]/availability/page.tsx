'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, CalendarX } from 'lucide-react'
import AvailabilityEditor from '@/components/admin/AvailabilityEditor'
import type { Staff, StaffAvailability, StaffBlockedDate } from '@/types/admin'

// ─── Block date modal ─────────────────────────────────────────────────────────

interface BlockDateModalProps {
  staffId: string
  onClose: () => void
  onSuccess: () => void
}

function BlockDateModal({ staffId, onClose, onSuccess }: BlockDateModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Start date and end date are required.')
      return
    }
    if (endDate < startDate) {
      setError('End date must be on or after start date.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/blocked-dates`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason: reason.trim() || undefined }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Block dates</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-5 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="block-start">
              Start date <span className="text-red-500">*</span>
            </label>
            <input
              id="block-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="block-end">
              End date <span className="text-red-500">*</span>
            </label>
            <input
              id="block-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="block-reason">
              Reason <span className="text-gray-400 font-normal">(optional — internal note)</span>
            </label>
            <input
              id="block-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual leave"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Block dates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffAvailabilityPage() {
  const params = useParams()
  const id = params.id as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [availability, setAvailability] = useState<StaffAvailability[]>([])
  const [blockedDates, setBlockedDates] = useState<StaffBlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [staffRes, availRes, blockedRes] = await Promise.all([
        fetch(`/api/admin/staff/${id}`, { credentials: 'include' }),
        fetch(`/api/admin/staff/${id}/availability`, { credentials: 'include' }),
        fetch(`/api/admin/staff/${id}/blocked-dates`, { credentials: 'include' }),
      ])

      if (!staffRes.ok) {
        const json = await staffRes.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? `Failed to load staff (${staffRes.status})`)
      }
      if (!availRes.ok) {
        const json = await availRes.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? `Failed to load availability (${availRes.status})`)
      }

      const staffJson = await staffRes.json() as { data: Staff }
      const availJson = await availRes.json() as { data: { availability: StaffAvailability[] } }
      const blockedJson = blockedRes.ok
        ? await blockedRes.json() as { data: { blockedDates: StaffBlockedDate[] } }
        : { data: { blockedDates: [] } }

      setStaff(staffJson.data)
      setAvailability(availJson.data?.availability ?? [])
      setBlockedDates(blockedJson.data?.blockedDates ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  async function deleteBlockedDate(blockId: string) {
    setDeletingBlockId(blockId)
    try {
      const res = await fetch(`/api/admin/staff/${id}/blocked-dates/${blockId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setBlockedDates((prev) => prev.filter((b) => b.id !== blockId))
      }
    } finally {
      setDeletingBlockId(null)
    }
  }

  function formatDate(dateStr: string) {
    // dateStr is "YYYY-MM-DD" — parse as UTC to avoid timezone shifts
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to staff
        </Link>
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

      {!loading && !error && staff && (
        <div className="max-w-2xl space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{staff.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Manage working hours and leave for this staff member.</p>
          </div>

          {/* Working hours */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <AvailabilityEditor
              staffId={id}
              staffName={staff.name}
              availability={availability}
              onSuccess={() => void fetchData()}
            />
          </div>

          {/* Blocked dates / leave */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Blocked dates</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Dates when {staff.name} is unavailable (leave, public holidays, etc.)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlockModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Block a date range
              </button>
            </div>

            {blockedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-10 text-center">
                <CalendarX className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No blocked dates set</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {blockedDates.map((block) => (
                  <li key={block.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(block.startDate)}
                        {block.startDate !== block.endDate && (
                          <> – {formatDate(block.endDate)}</>
                        )}
                      </p>
                      {block.reason && (
                        <p className="text-xs text-gray-500 mt-0.5">{block.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteBlockedDate(block.id)}
                      disabled={deletingBlockId === block.id}
                      aria-label="Remove blocked date"
                      className="shrink-0 rounded-md border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {blockModalOpen && (
        <BlockDateModal
          staffId={id}
          onClose={() => setBlockModalOpen(false)}
          onSuccess={() => void fetchData()}
        />
      )}
    </div>
  )
}
