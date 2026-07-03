"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle, Clock } from "lucide-react"
import { Customer, Booking } from "@/types/admin"

interface CustomerDetailProps {
  customer: Customer | null
  onClose: () => void
}

interface CustomerDetailData extends Customer {
  bookings: Booking[]
}

export default function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
  const [detail, setDetail] = useState<CustomerDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customer) return

    setDetail(null)
    setError(null)
    setLoading(true)

    fetch(`/api/admin/customers/${customer.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch customer details")
        return res.json()
      })
      .then((data: CustomerDetailData) => {
        setDetail(data)
      })
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [customer])

  if (!customer) return null

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getStatusLabel(status: Booking["status"]): string {
    switch (status) {
      case "confirmed":
        return "Confirmed"
      case "cancelled_customer":
        return "Cancelled by Customer"
      case "cancelled_admin":
        return "Cancelled by Admin"
      case "rescheduled":
        return "Rescheduled"
      default:
        return status
    }
  }

  function getStatusClasses(status: Booking["status"]): string {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "cancelled_customer":
      case "cancelled_admin":
        return "bg-red-100 text-red-800"
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Customer Info */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-lg select-none">
              {customer.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-medium text-gray-900">{customer.firstName}</span>
                {customer.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    Unverified
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-500 truncate">{customer.email}</p>
              {customer.contactNumber && (
                <p className="mt-0.5 text-sm text-gray-500">{customer.contactNumber}</p>
              )}
            </div>
          </div>

          {/* Booking History */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Booking History
            </h3>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-gray-100 p-4">
                    <div className="mb-2 h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            {!loading && !error && detail && detail.bookings.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No bookings yet</p>
              </div>
            )}

            {!loading && !error && detail && detail.bookings.length > 0 && (
              <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {detail.bookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.service?.name ?? "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDate(booking.startTime)}
                        </p>
                        {booking.staff && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Staff: {booking.staff.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClasses(booking.status)}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
