'use client';

/**
 * BookingFlow — multi-step customer booking form.
 *
 * Step 1: Staff selection
 * Step 2: Service selection
 * Step 3: Date & time slot selection
 * Step 4: Customer details form + submission
 * Step 5: Booking confirmed (inline confirmation)
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Scissors, Calendar, ChevronLeft, Loader2, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number | null;
}

export interface MerchantDesign {
  pageHeadline: string | null;
  pageSubheadline: string | null;
  slotAvailableBg: string;
  slotAvailableText: string;
  slotUnavailableBg: string;
  slotUnavailableText: string;
}

export interface BookingFlowProps {
  slug: string;
  customSiteName?: string | null;
  customAvatarUrl?: string | null;
  staff: StaffMember[];
  services: Service[];
  design: MerchantDesign;
}

interface TimeSlot {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

interface BookingResult {
  confirmationNumber: string;
  startTime: string;
  endTime: string;
}

// ---------------------------------------------------------------------------
// Validation schema (step 4)
// ---------------------------------------------------------------------------

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  contactNumber: z.string().min(6, 'Phone number too short').max(30),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(priceCents: number | null): string {
  if (priceCents === null) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    priceCents / 100
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const datePart = start.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${startTime} – ${endTime}`;
}

/** Build YYYY-MM-DD strings for the next N days starting from today */
function buildCalendarDays(count = 42): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepBadge({ step, label, done }: { step: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold
          ${done ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
      >
        {done ? <Check className="h-3 w-3" /> : step}
      </span>
      <span className={`text-xs font-medium ${done ? 'text-indigo-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}

function StaffCard({
  member,
  selected,
  onClick,
}: {
  member: StaffMember;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${
          selected
            ? 'border-indigo-600 bg-indigo-50 shadow-md'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
        }`}
    >
      {/* Avatar */}
      <div
        className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold
          ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
      >
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photoUrl}
            alt={member.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <User className="h-8 w-8" />
        )}
      </div>
      <span className="text-sm font-medium text-slate-900">{member.name}</span>
      {selected && (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-600">
          <Check className="h-3 w-3" /> Selected
        </span>
      )}
    </button>
  );
}

function ServiceCard({
  service,
  selected,
  onClick,
}: {
  service: Service;
  selected: boolean;
  onClick: () => void;
}) {
  const priceLabel = formatPrice(service.priceCents);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-xl border-2 px-5 py-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${
          selected
            ? 'border-indigo-600 bg-indigo-50 shadow-md'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
        }`}
    >
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{service.name}</p>
        {service.description && (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{service.description}</p>
        )}
        <p className="mt-1 text-sm text-slate-500">{formatDuration(service.durationMinutes)}</p>
      </div>
      <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
        {priceLabel && (
          <span className="text-sm font-semibold text-slate-800">{priceLabel}</span>
        )}
        {selected && <Check className="h-4 w-4 text-indigo-600" />}
      </div>
    </button>
  );
}

function MiniCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const [offset, setOffset] = useState(0); // weeks offset (0 = current 6-week window)
  const today = todayStr();
  const allDays = buildCalendarDays(84); // 12 weeks forward

  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Compute first day of the first displayed week
  const firstDay = new Date(allDays[0] + 'T12:00:00Z');
  firstDay.setDate(firstDay.getDate() + offset * 7 * 6); // skip by 6-week windows
  const startOfWindow = new Date(firstDay);
  // Align to start of week (Sunday)
  startOfWindow.setDate(startOfWindow.getDate() - startOfWindow.getUTCDay());

  // Build 6 weeks of days
  const windowDays: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startOfWindow);
    d.setUTCDate(startOfWindow.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    windowDays.push(`${y}-${m}-${day}`);
  }

  // Month label: use the month that appears most
  const midDay = windowDays[21]; // middle of window
  const midDate = new Date(midDay + 'T12:00:00Z');
  const monthLabel = midDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const maxDay = allDays[allDays.length - 1];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous weeks"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          disabled={windowDays[41] >= maxDay}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next weeks"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {windowDays.map((ds) => {
          const isPast = ds < today;
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const isInRange = ds >= today && ds <= maxDay;
          return (
            <button
              key={ds}
              type="button"
              disabled={!isInRange}
              onClick={() => onSelectDate(ds)}
              aria-label={formatDateLabel(ds)}
              aria-pressed={isSelected}
              className={`flex h-8 w-full items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400
                ${isSelected ? 'bg-indigo-600 text-white' : ''}
                ${isToday && !isSelected ? 'ring-2 ring-indigo-400 text-slate-900' : ''}
                ${isPast ? 'text-slate-300 cursor-not-allowed' : ''}
                ${isInRange && !isSelected && !isToday ? 'text-slate-700 hover:bg-indigo-50' : ''}
                ${!isInRange && !isPast ? 'text-slate-300 cursor-not-allowed' : ''}
              `}
            >
              {new Date(ds + 'T12:00:00Z').getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  design,
}: {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  design: MerchantDesign;
}) {
  if (slots.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No available slots on this date. Please try another day.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.startTime === slot.startTime;
        return (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onSelectSlot(slot)}
            aria-pressed={isSelected}
            aria-label={`${formatSlotTime(slot.startTime)}, available`}
            className="rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            style={
              isSelected
                ? { backgroundColor: '#4F46E5', color: '#ffffff' }
                : {
                    backgroundColor: design.slotAvailableBg,
                    color: design.slotAvailableText,
                  }
            }
          >
            {formatSlotTime(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main BookingFlow component
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4 | 5;

// Constants
const DEFAULT_SITE_NAME = 'SimplyBook';
const DEFAULT_AVATAR_URL = '/logo.svg';

export default function BookingFlow({
  slug,
  customSiteName,
  customAvatarUrl,
  staff,
  services,
  design,
}: BookingFlowProps) {
  // slug is sourced from route param and used for booking confirmation
  const [step, setStep] = useState<Step>(1);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  // Auto-advance: if only one staff member, skip to step 2
  const effectiveStaff = staff.length === 1 ? [staff[0]] : staff;
  const autoSelectedStaff = staff.length === 1 ? staff[0] : null;

  // ── Step 1 helpers ─────────────────────────────────────────────────────────

  function handleSelectStaff(member: StaffMember) {
    setSelectedStaff(member);
    setSelectedService(null);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setStep(2);
  }

  // ── Step 2 helpers ─────────────────────────────────────────────────────────

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setStep(3);
  }

  // ── Step 3 helpers ─────────────────────────────────────────────────────────

  const fetchSlots = useCallback(
    async (date: string, staffId: string, serviceId: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      setSlots([]);
      setSelectedSlot(null);
      try {
        // The path /api/booking/slots is rewritten by middleware to
        // /site/{slug}/api/booking/slots when on the merchant subdomain.
        const qs = new URLSearchParams({ staffId, serviceId, date, slug });
        const res = await fetch(`/api/booking/slots?${qs.toString()}`);
        const json = (await res.json()) as {
          data: { slots: TimeSlot[] } | null;
          error: { message: string } | null;
        };
        if (!res.ok || json.error) {
          setSlotsError(json.error?.message ?? 'Failed to load slots.');
        } else {
          setSlots(json.data?.slots ?? []);
        }
      } catch {
        setSlotsError('Network error. Please try again.');
      } finally {
        setSlotsLoading(false);
      }
    },
    [] // slug no longer needed as query param — it's in the URL path via middleware rewrite
  );

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    if (selectedStaff && selectedService) {
      void fetchSlots(date, selectedStaff.id, selectedService.id);
    }
  }

  function handleSelectSlot(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep(4);
  }

  // ── Step 4 helpers ─────────────────────────────────────────────────────────

  const onSubmit = async (values: CustomerFormValues): Promise<void> => {
    if (!selectedStaff || !selectedService || !selectedSlot) return;
    setSubmitError(null);

    try {
      // /api/booking/confirm is rewritten by middleware to /site/{slug}/api/booking/confirm
      const res = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          serviceId: selectedService.id,
          startTime: selectedSlot.startTime,
          firstName: values.firstName,
          email: values.email,
          contactNumber: values.contactNumber,
          slug,
        }),
      });

      const json = (await res.json()) as {
        data: { bookingId: string; confirmationNumber: string; cancelToken: string } | null;
        error: { message: string } | null;
      };

      if (!res.ok || json.error) {
        if (res.status === 409) {
          setSubmitError(
            'This slot was just taken. Please go back and pick another time.'
          );
        } else {
          setSubmitError(json.error?.message ?? 'Booking failed. Please try again.');
        }
        return;
      }

      setBookingResult({
        confirmationNumber: json.data!.confirmationNumber,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      setStep(5);
    } catch {
      setSubmitError('Network error. Please try again.');
    }
  };

  // ── Back navigation ────────────────────────────────────────────────────────

  function handleBack() {
    if (step === 2) {
      setSelectedStaff(null);
      setStep(1);
    } else if (step === 3) {
      setSelectedService(null);
      setSelectedDate(null);
      setSlots([]);
      setSelectedSlot(null);
      setStep(2);
    } else if (step === 4) {
      setSelectedSlot(null);
      setStep(3);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeStaff = selectedStaff ?? autoSelectedStaff;

  // Display values with fallbacks
  const displaySiteName = customSiteName || DEFAULT_SITE_NAME;
  const displayAvatarUrl = customAvatarUrl || DEFAULT_AVATAR_URL;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:text-left">
            {/* Avatar */}
            <img
              src={displayAvatarUrl}
              alt={displaySiteName}
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover shadow-sm md:h-20 md:w-20"
            />
            {/* Text content */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{displaySiteName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {design.pageHeadline ?? 'Book an appointment online'}
              </p>
              {design.pageSubheadline && (
                <p className="mt-0.5 text-xs text-slate-400">{design.pageSubheadline}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Step progress indicator */}
        {step < 5 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            <StepBadge step={1} label="Staff" done={step > 1} />
            <span className="text-slate-300">›</span>
            <StepBadge step={2} label="Service" done={step > 2} />
            <span className="text-slate-300">›</span>
            <StepBadge step={3} label="Date & Time" done={step > 3} />
            <span className="text-slate-300">›</span>
            <StepBadge step={4} label="Your Details" done={step > 4} />
          </div>
        )}

        {/* ── Step 1: Staff selection ── */}
        {step === 1 && (
          <section aria-labelledby="step1-heading">
            <h2 id="step1-heading" className="mb-4 text-lg font-semibold text-slate-800">
              Select a staff member
            </h2>
            {effectiveStaff.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                <p className="text-sm text-slate-500">
                  No staff available at the moment. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {effectiveStaff.map((member) => (
                  <StaffCard
                    key={member.id}
                    member={member}
                    selected={selectedStaff?.id === member.id}
                    onClick={() => handleSelectStaff(member)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Step 2: Service selection ── */}
        {step === 2 && (
          <section aria-labelledby="step2-heading">
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Back to staff selection"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 id="step2-heading" className="text-lg font-semibold text-slate-800">
                Select a service
              </h2>
            </div>

            {/* Selected staff summary */}
            {activeStaff && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm">
                <User className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-indigo-700">{activeStaff.name}</span>
                <span className="text-indigo-500">selected</span>
              </div>
            )}

            {services.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                <p className="text-sm text-slate-500">No services available at the moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    selected={selectedService?.id === svc.id}
                    onClick={() => handleSelectService(svc)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Step 3: Date & time ── */}
        {step === 3 && (
          <section aria-labelledby="step3-heading">
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Back to service selection"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 id="step3-heading" className="text-lg font-semibold text-slate-800">
                Choose a date & time
              </h2>
            </div>

            {/* Selection summary */}
            <div className="mb-4 flex flex-wrap gap-2">
              {activeStaff && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                  <User className="h-3 w-3" /> {activeStaff.name}
                </span>
              )}
              {selectedService && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                  <Scissors className="h-3 w-3" /> {selectedService.name}
                </span>
              )}
            </div>

            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            {/* Slots */}
            {selectedDate && (
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-medium text-slate-700">
                  Available times for{' '}
                  <span className="font-semibold">{formatDateLabel(selectedDate)}</span>
                </h3>

                {slotsLoading && (
                  <div
                    className="flex items-center gap-2 py-4 text-sm text-slate-500"
                    role="status"
                    aria-label="Loading"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading available times…
                  </div>
                )}

                {slotsError && !slotsLoading && (
                  <p className="py-2 text-sm text-red-600" role="alert">
                    {slotsError}
                  </p>
                )}

                {!slotsLoading && !slotsError && (
                  <SlotGrid
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSelectSlot}
                    design={design}
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Step 4: Customer details form ── */}
        {step === 4 && (
          <section aria-labelledby="step4-heading">
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Back to date selection"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 id="step4-heading" className="text-lg font-semibold text-slate-800">
                Your details
              </h2>
            </div>

            {/* Booking summary */}
            {activeStaff && selectedService && selectedSlot && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Booking summary
                </p>
                <div className="space-y-1 text-slate-700">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {activeStaff.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-slate-400" />
                    {selectedService.name} · {formatDuration(selectedService.durationMinutes)}
                    {selectedService.priceCents !== null &&
                      ` · ${formatPrice(selectedService.priceCents)}`}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDateTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                void handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  {...register('firstName')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Sarah"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="sarah@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contactNumber"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Contact number <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  {...register('contactNumber')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="+65 9123 4567"
                />
                {errors.contactNumber && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>

              {submitError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  'Confirm booking →'
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                A confirmation email with your cancel link will be sent to your email address.
              </p>
            </form>
          </section>
        )}

        {/* ── Step 5: Confirmed ── */}
        {step === 5 && bookingResult && (
          <section aria-labelledby="confirmed-heading">
            <div className="mx-auto max-w-3xl">
              {/* Confirmation header with custom branding */}
              <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 sm:flex-row flex-col sm:items-center">
                  {/* Avatar */}
                  <img
                    src={displayAvatarUrl}
                    alt={displaySiteName}
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover shadow-sm"
                  />
                  {/* Text */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{displaySiteName}</h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Booking confirmed
                    </p>
                  </div>
                </div>
              </div>

              {/* Success message */}
              <div className="mb-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h2
                  id="confirmed-heading"
                  className="mb-2 text-2xl font-bold text-slate-900"
                >
                  Booking confirmed!
                </h2>
                <p className="mb-6 text-sm text-slate-600">
                  Thank you for booking with {displaySiteName}. A confirmation email has been sent
                  with your cancel link.
                </p>
              </div>

              {/* Receipt card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm mb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Booking receipt
                </p>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-start justify-between">
                    <dt className="text-slate-500">Reference</dt>
                    <dd className="font-mono font-semibold text-slate-900">
                      {bookingResult.confirmationNumber}
                    </dd>
                  </div>
                  {activeStaff && (
                    <div className="flex items-start justify-between">
                      <dt className="text-slate-500">Staff</dt>
                      <dd className="font-medium text-slate-900">{activeStaff.name}</dd>
                    </div>
                  )}
                  {selectedService && (
                    <div className="flex items-start justify-between">
                      <dt className="text-slate-500">Service</dt>
                      <dd className="font-medium text-slate-900">
                        {selectedService.name}
                        {selectedService.priceCents !== null && (
                          <span className="ml-1 text-slate-500">
                            · {formatPrice(selectedService.priceCents)}
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <dt className="text-slate-500">Date & Time</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {formatDateTimeRange(bookingResult.startTime, bookingResult.endTime)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Back link */}
              <div className="text-center">
                <a
                  href="/"
                  className="inline-block text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Back to {displaySiteName}
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
