"use client"

import { useState } from "react"
import { Save, Loader2 } from "lucide-react"
import { StaffAvailability } from "@/types/admin"

interface AvailabilityEditorProps {
  staffId: string
  staffName: string
  availability: StaffAvailability[]
  onSuccess: () => void
}

interface DayState {
  dayOfWeek: number
  enabled: boolean
  startTime: string
  endTime: string
  maxConcurrent: number
}

// UI order: Monday first. dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
const DAY_ORDER: { dayOfWeek: number; label: string }[] = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
]

function buildInitialState(availability: StaffAvailability[]): DayState[] {
  const byDay = new Map<number, StaffAvailability>()
  for (const a of availability) {
    byDay.set(a.dayOfWeek, a)
  }

  return DAY_ORDER.map(({ dayOfWeek }) => {
    const existing = byDay.get(dayOfWeek)
    if (existing) {
      return {
        dayOfWeek,
        enabled: true,
        startTime: existing.startTime,
        endTime: existing.endTime,
        maxConcurrent: existing.maxConcurrent,
      }
    }
    return {
      dayOfWeek,
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
      maxConcurrent: 1,
    }
  })
}

export default function AvailabilityEditor({
  staffId,
  staffName,
  availability,
  onSuccess,
}: AvailabilityEditorProps) {
  const [days, setDays] = useState<DayState[]>(() =>
    buildInitialState(availability)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateDay(dayOfWeek: number, patch: Partial<DayState>) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = days
        .filter((d) => d.enabled)
        .map(({ dayOfWeek, startTime, endTime, maxConcurrent }) => ({
          dayOfWeek,
          startTime,
          endTime,
          maxConcurrent,
        }))

      const res = await fetch(`/api/admin/staff/${staffId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: payload }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? `Request failed (${res.status})`)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Weekly Availability — {staffName}
      </h2>

      <div className="space-y-2">
        {DAY_ORDER.map(({ dayOfWeek, label }) => {
          const day = days.find((d) => d.dayOfWeek === dayOfWeek)!
          return (
            <div
              key={dayOfWeek}
              className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
            >
              {/* Day name */}
              <span className="w-24 shrink-0 font-medium text-sm">{label}</span>

              {/* Enabled toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) =>
                    updateDay(dayOfWeek, { enabled: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {day.enabled ? "Open" : "Closed"}
                </span>
              </label>

              {/* Time inputs — only meaningful when enabled */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="time"
                  value={day.startTime}
                  disabled={!day.enabled}
                  onChange={(e) =>
                    updateDay(dayOfWeek, { startTime: e.target.value })
                  }
                  className="rounded border px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="time"
                  value={day.endTime}
                  disabled={!day.enabled}
                  onChange={(e) =>
                    updateDay(dayOfWeek, { endTime: e.target.value })
                  }
                  className="rounded border px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>

              {/* Max concurrent */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">
                  Max concurrent
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={day.maxConcurrent}
                  disabled={!day.enabled}
                  onChange={(e) =>
                    updateDay(dayOfWeek, {
                      maxConcurrent: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-16 rounded border px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Saving…" : "Save Availability"}
      </button>
    </div>
  )
}
