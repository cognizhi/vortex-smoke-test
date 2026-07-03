'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, RefreshCw, Loader2 } from 'lucide-react';
import type { Booking, Staff } from '@/types/admin';

interface RescheduleModalProps {
  booking: Booking | null;
  staff: Staff[];
  onClose: () => void;
  onSuccess: () => void;
}

const rescheduleSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  staffId: z.string().optional(),
});

type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

function getInitialDate(startTime: string): string {
  const d = new Date(startTime);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getInitialTime(startTime: string): string {
  const d = new Date(startTime);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export default function RescheduleModal({
  booking,
  staff,
  onClose,
  onSuccess,
}: RescheduleModalProps): React.JSX.Element | null {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: booking ? getInitialDate(booking.startTime) : '',
      time: booking ? getInitialTime(booking.startTime) : '',
      staffId: booking?.staffId ?? '',
    },
  });

  if (!booking) return null;

  const onSubmit = async (values: RescheduleFormValues): Promise<void> => {
    setSubmitError(null);

    const startTime = new Date(`${values.date}T${values.time}:00`).toISOString();

    const body: { startTime: string; staffId?: string } = { startTime };
    if (values.staffId && values.staffId !== '') {
      body.staffId = values.staffId;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = 'Failed to reschedule booking.';
        try {
          const data = (await res.json()) as { error?: string; message?: string };
          message = data.error ?? data.message ?? message;
        } catch {
          // ignore JSON parse errors
        }
        setSubmitError(message);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-indigo-600" />
            <h2
              id="reschedule-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              Reschedule Booking
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
          className="px-6 py-5 space-y-4"
        >
          {/* Booking reference */}
          <p className="text-sm text-slate-500">
            Booking{' '}
            <span className="font-mono font-medium text-slate-700">
              #{booking.confirmationNumber}
            </span>
          </p>

          {/* Date field */}
          <div className="space-y-1">
            <label
              htmlFor="reschedule-date"
              className="block text-sm font-medium text-slate-700"
            >
              New Date
            </label>
            <input
              id="reschedule-date"
              type="date"
              {...register('date')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Time field */}
          <div className="space-y-1">
            <label
              htmlFor="reschedule-time"
              className="block text-sm font-medium text-slate-700"
            >
              New Time
            </label>
            <input
              id="reschedule-time"
              type="time"
              {...register('time')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isSubmitting}
            />
            {errors.time && (
              <p className="text-xs text-red-600">{errors.time.message}</p>
            )}
          </div>

          {/* Staff select */}
          {staff.length > 0 && (
            <div className="space-y-1">
              <label
                htmlFor="reschedule-staff"
                className="block text-sm font-medium text-slate-700"
              >
                Staff{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <select
                id="reschedule-staff"
                {...register('staffId')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 bg-white"
                disabled={isSubmitting}
              >
                <option value="">No preference</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error message */}
          {submitError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rescheduling…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reschedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
