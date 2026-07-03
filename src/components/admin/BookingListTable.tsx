'use client';

import { useState } from 'react';
import { MoreHorizontal, Eye, RefreshCw, X } from 'lucide-react';
import type { Booking } from '@/types/admin';

interface BookingListTableProps {
  bookings: Booking[];
  onViewDetail: (booking: Booking) => void;
  onReschedule: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

function StatusBadge({ status }: { status: Booking['status'] }): React.JSX.Element {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Confirmed
      </span>
    );
  }
  if (status === 'rescheduled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        Rescheduled
      </span>
    );
  }
  // cancelled_customer | cancelled_admin
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Cancelled
    </span>
  );
}

function ActionMenu({
  booking,
  onViewDetail,
  onReschedule,
  onCancel,
}: {
  booking: Booking;
  onViewDetail: (b: Booking) => void;
  onReschedule: (b: Booking) => void;
  onCancel: (b: Booking) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const isConfirmed = booking.status === 'confirmed';

  const handle = (fn: (b: Booking) => void): void => {
    fn(booking);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        aria-label="Open actions menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-44 rounded-md bg-white shadow-lg ring-1 ring-slate-200 focus:outline-none"
          >
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => handle(onViewDetail)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4 text-slate-400" />
                View
              </button>

              {isConfirmed && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handle(onReschedule)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4 text-slate-400" />
                    Reschedule
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handle(onCancel)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 text-red-400" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BookingListTable({
  bookings,
  onViewDetail,
  onReschedule,
  onCancel,
}: BookingListTableProps): React.JSX.Element {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {[
              'Confirmation #',
              'Customer',
              'Date & Time',
              'Service',
              'Staff',
              'Status',
              'Actions',
            ].map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-slate-400 text-sm"
              >
                No bookings found
              </td>
            </tr>
          ) : (
            bookings.map((booking) => {
              const start = new Date(booking.startTime);
              const dateStr = start.toLocaleDateString();
              const timeStr = start.toLocaleTimeString();

              return (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {booking.confirmationNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {booking.customer
                      ? `${booking.customer.firstName} (${booking.customer.email})`
                      : booking.customerId}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <span className="font-medium">{dateStr}</span>
                    <span className="ml-1 text-slate-400">{timeStr}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {booking.service ? booking.service.name : booking.serviceId}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {booking.staff ? booking.staff.name : booking.staffId}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      booking={booking}
                      onViewDetail={onViewDetail}
                      onReschedule={onReschedule}
                      onCancel={onCancel}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
