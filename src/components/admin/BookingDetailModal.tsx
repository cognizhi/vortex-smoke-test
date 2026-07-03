"use client"

import { useState } from "react"
import { X, Calendar, Clock, User, Scissors } from "lucide-react"
import { Booking } from "@/types/admin"

interface BookingDetailModalProps {
  booking: Booking | null
  onClose: () => void
  onReschedule: (booking: Booking) => void
  onCancel: (booking: Booking) => void
  onCancelSuccess: () => void
}

const STATUS_LABELS: Record<Booking["status"], string> = {
  confirmed: "Confirmed",
  cancelled_customer: "Cancelled (Customer)",
  cancelled_admin: "Cancelled (Admin)",
  rescheduled: "Rescheduled",
}

const STATUS_CLASSES: Record<Booking["status"], string> = {
  confirmed: "bg-green-100 text-green-800",
  cancelled_customer: "bg-red-100 text-red-800",
  cancelled_admin: "bg-red-100 text-red-800",
  rescheduled: "bg-yellow-100 text-yellow-800",
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
  return { date, time }
}

function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "—"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function BookingDetailModal({
  booking,
  onClose,
  onReschedule,
  onCancel,
  onCancelSuccess,
}: BookingDetailModalProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  if (!booking) return null

  const start = formatDateTime(booking.startTime)
  const end = formatDateTime(booking.endTime)
  const bookedAt = formatDateTime(booking.createdAt)

  function handleCancelClick() {
    setConfirmingCancel(true)
  }

  function handleConfirmCancel() {
    onCancel(booking!)
    setConfirmingCancel(false)
    onCancelSuccess()
  }

  function handleAbortCancel() {
    setConfirmingCancel(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Confirmation & Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Confirmation #{booking.confirmationNumber}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[booking.status]}`}
            >
              {STATUS_LABELS[booking.status]}
            </span>
          </div>

          {/* Date & Time */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{start.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {start.time} – {end.time}
              </span>
            </div>
          </div>

          {/* Service */}
          {booking.service && (
            <div className="flex items-start gap-3">
              <Scissors className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{booking.service.name}</p>
                <p className="text-xs text-gray-500">
                  {booking.service.durationMinutes} min
                  {booking.service.priceCents != null && (
                    <> &middot; {formatPrice(booking.service.priceCents)}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Staff */}
          {booking.staff && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{booking.staff.name}</p>
                <p className="text-xs text-gray-500">Staff</p>
              </div>
            </div>
          )}

          {/* Customer */}
          {booking.customer && (
            <div className="border-t pt-4 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Customer</p>
              <p className="text-sm font-medium text-gray-900">{booking.customer.firstName}</p>
              <p className="text-sm text-gray-600">{booking.customer.email}</p>
              <p className="text-sm text-gray-600">{booking.customer.contactNumber}</p>
            </div>
          )}

          {/* Booked at */}
          <p className="text-xs text-gray-400">
            Booked on {bookedAt.date} at {bookedAt.time}
          </p>

          {/* Inline cancel confirmation */}
          {confirmingCancel && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-medium text-red-800">
                Are you sure you want to cancel this booking?
              </p>
              <p className="text-xs text-red-600">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Yes, cancel booking
                </button>
                <button
                  onClick={handleAbortCancel}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  No, keep it
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {booking.status === "confirmed" && !confirmingCancel && (
            <>
              <button
                onClick={() => onReschedule(booking)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reschedule
              </button>
              <button
                onClick={handleCancelClick}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Cancel booking
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
