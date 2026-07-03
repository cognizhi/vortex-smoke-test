'use client';

/**
 * Admin Dashboard — /admin
 *
 * Dual-view dashboard: Calendar (month grid with booking dots) + List (table).
 * Default view: list.
 */

import { useState, useMemo, useCallback } from 'react';
import { CalendarDays, List, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useBookings, useStaff } from '@/hooks/useAdminData';
import BookingListTable from '@/components/admin/BookingListTable';
import { BookingDetailModal } from '@/components/admin/BookingDetailModal';
import RescheduleModal from '@/components/admin/RescheduleModal';
import type { Booking } from '@/types/admin';

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}): React.JSX.Element {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(Date.UTC(year, month, 1));
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  bookings,
  onSelectDate,
  selectedDate,
}: {
  bookings: Booking[];
  onSelectDate: (date: string | null) => void;
  selectedDate: string | null;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = getDaysInMonth(year, month);

  // bookings grouped by date
  const byDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bookings) {
      const d = b.startTime.slice(0, 10);
      map[d] = (map[d] ?? 0) + 1;
    }
    return map;
  }, [bookings]);

  // first day of month (0=Sun…6=Sat), shift so Mon=0
  const firstDow = ((new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7);

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_NAMES = ['Mo','Tu','We','Th','Fr','Sa','Su'];

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const todayDate = todayStr();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded p-1 hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-900">{MONTH_NAMES[month]} {year}</span>
        <button type="button" onClick={nextMonth} className="rounded p-1 hover:bg-slate-100">
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const ds = toDateStr(day);
          const count = byDate[ds] ?? 0;
          const isToday = ds === todayDate;
          const isSelected = ds === selectedDate;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : ds)}
              className={`relative flex flex-col items-center rounded-md p-1.5 text-xs transition-colors
                ${isToday ? 'bg-indigo-600 text-white' : ''}
                ${isSelected && !isToday ? 'bg-indigo-50 ring-2 ring-indigo-400' : ''}
                ${!isToday && !isSelected ? 'hover:bg-slate-50 text-slate-700' : ''}
              `}
            >
              <span className={`font-medium ${isToday ? 'text-white' : ''}`}>{day.getUTCDate()}</span>
              {count > 0 && (
                <span className={`mt-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[10px] font-semibold
                  ${isToday ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type View = 'list' | 'calendar';

export default function AdminDashboardPage() {
  const [view, setView] = useState<View>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: bookingsData, loading: bookingsLoading, error: bookingsError, refetch } = useBookings();
  const { data: staffData } = useStaff();

  const allBookings = bookingsData?.bookings ?? [];
  const staff = staffData?.staff ?? [];

  function showToast(msg: string): void {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  const displayedBookings = useMemo(() => {
    if (!selectedDate) return allBookings;
    return allBookings.filter(b => b.startTime.startsWith(selectedDate));
  }, [allBookings, selectedDate]);

  const handleCancel = useCallback(async (booking: Booking) => {
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        showToast('Failed to cancel booking. Please try again.');
        return;
      }
      void refetch();
      if (detailBooking?.id === booking.id) setDetailBooking(null);
      showToast(`Booking ${booking.confirmationNumber} cancelled.`);
    } catch {
      showToast('Network error while cancelling booking.');
    }
  }, [refetch, detailBooking]);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {allBookings.length} booking{allBookings.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* + New booking (disabled — shows toast) */}
          <button
            type="button"
            onClick={() => showToast('Creating bookings from the admin panel is coming soon.')}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New booking
          </button>

          {/* View toggle */}
          <div className="flex rounded-md border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-l-md px-3 py-2 text-sm transition-colors
                ${view === 'calendar' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CalendarDays className="h-4 w-4" /> Calendar
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-r-md border-l border-slate-200 px-3 py-2 text-sm transition-colors
                ${view === 'list' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Loading / error states */}
      {bookingsLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading bookings…
        </div>
      )}
      {bookingsError && !bookingsLoading && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Failed to load bookings: {bookingsError}
        </div>
      )}

      {/* Calendar view */}
      {!bookingsLoading && view === 'calendar' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <CalendarView
              bookings={allBookings}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>
          <div className="lg:col-span-2">
            {selectedDate ? (
              <>
                <h2 className="mb-3 text-sm font-semibold text-slate-700">
                  {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' · '}{displayedBookings.length} booking{displayedBookings.length !== 1 ? 's' : ''}
                </h2>
                <BookingListTable
                  bookings={displayedBookings}
                  onViewDetail={setDetailBooking}
                  onReschedule={setRescheduleBooking}
                  onCancel={handleCancel}
                />
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                Select a date to view bookings
              </div>
            )}
          </div>
        </div>
      )}

      {/* List view */}
      {!bookingsLoading && view === 'list' && (
        <BookingListTable
          bookings={displayedBookings}
          onViewDetail={setDetailBooking}
          onReschedule={setRescheduleBooking}
          onCancel={handleCancel}
        />
      )}

      {/* Modals */}
      <BookingDetailModal
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
        onReschedule={(b) => { setDetailBooking(null); setRescheduleBooking(b); }}
        onCancel={handleCancel}
        onCancelSuccess={() => { setDetailBooking(null); void refetch(); }}
      />

      <RescheduleModal
        booking={rescheduleBooking}
        staff={staff}
        onClose={() => setRescheduleBooking(null)}
        onSuccess={() => {
          setRescheduleBooking(null);
          void refetch();
          showToast('Booking rescheduled successfully.');
        }}
      />

      {/* Toast notification */}
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
