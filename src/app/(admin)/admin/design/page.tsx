'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Loader2, Eye } from 'lucide-react'

interface DesignSettings {
  slotAvailableBg: string
  slotAvailableText: string
  slotUnavailableBg: string
  slotUnavailableText: string
  calendarBorderWidth: string
  calendarBorderColor: string
  calendarBorderRadius: string
  calendarFontSize: string
  pageHeadline: string
  pageSubheadline: string
}

const defaultSettings: DesignSettings = {
  slotAvailableBg: '#22c55e',
  slotAvailableText: '#ffffff',
  slotUnavailableBg: '#e5e7eb',
  slotUnavailableText: '#9ca3af',
  calendarBorderWidth: '1',
  calendarBorderColor: '#e5e7eb',
  calendarBorderRadius: '8',
  calendarFontSize: '14',
  pageHeadline: 'Book an Appointment',
  pageSubheadline: 'Select a time that works for you',
}

type SaveState = 'idle' | 'loading' | 'success' | 'error'

export default function DesignPage() {
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [fetchError, setFetchError] = useState<string | null>(null)

  const { register, handleSubmit, watch, reset } = useForm<DesignSettings>({
    defaultValues: defaultSettings,
  })

  const values = watch()

  useEffect(() => {
    async function fetchDesign() {
      try {
        const res = await fetch('/api/admin/design')
        if (!res.ok) throw new Error('Failed to fetch design settings')
        const data = (await res.json()) as { settings?: DesignSettings }
        if (data.settings) {
          reset({ ...defaultSettings, ...data.settings })
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    void fetchDesign()
  }, [reset])

  const onSubmit = async (data: DesignSettings) => {
    setSaveState('loading')
    try {
      const res = await fetch('/api/admin/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save design settings')
      setSaveState('success')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Design Customization</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize the look and feel of your booking page
        </p>
        {fetchError && (
          <p className="text-sm text-red-600 mt-2">
            Could not load settings: {fetchError}. Showing defaults.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-6 items-start">
          {/* Left panel — controls */}
          <div
            className="shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6"
            style={{ width: '380px' }}
          >
            {/* Slot colours */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Slot Colours
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Available — Background</label>
                  <input
                    type="color"
                    {...register('slotAvailableBg')}
                    className="h-8 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Available — Text</label>
                  <input
                    type="color"
                    {...register('slotAvailableText')}
                    className="h-8 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Unavailable — Background</label>
                  <input
                    type="color"
                    {...register('slotUnavailableBg')}
                    className="h-8 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Unavailable — Text</label>
                  <input
                    type="color"
                    {...register('slotUnavailableText')}
                    className="h-8 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Calendar style */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Calendar Style
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-600 shrink-0">Border Width (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    {...register('calendarBorderWidth')}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Border Colour</label>
                  <input
                    type="color"
                    {...register('calendarBorderColor')}
                    className="h-8 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-600 shrink-0">Border Radius (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="32"
                    {...register('calendarBorderRadius')}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-600 shrink-0">Font Size (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="24"
                    {...register('calendarFontSize')}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Page text */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Page Text
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Headline</label>
                  <input
                    type="text"
                    {...register('pageHeadline')}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Book an Appointment"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Subheadline</label>
                  <input
                    type="text"
                    {...register('pageSubheadline')}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Select a time that works for you"
                  />
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saveState === 'loading'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saveState === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveState === 'loading' ? 'Saving…' : 'Save Changes'}
              </button>

              {saveState === 'success' && (
                <span className="text-sm text-green-600 font-medium">Saved successfully</span>
              )}
              {saveState === 'error' && (
                <span className="text-sm text-red-600 font-medium">Save failed — try again</span>
              )}
            </div>
          </div>

          {/* Right panel — preview */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Preview
              </h2>
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{
                border: `${values.calendarBorderWidth}px solid ${values.calendarBorderColor}`,
                borderRadius: `${values.calendarBorderRadius}px`,
                fontSize: `${values.calendarFontSize}px`,
              }}
            >
              {/* Page header */}
              <div className="bg-gray-50 px-6 py-5 border-b" style={{ borderColor: values.calendarBorderColor }}>
                <h3
                  className="font-bold text-gray-900"
                  style={{ fontSize: `${Math.round(Number(values.calendarFontSize) * 1.5)}px` }}
                >
                  {values.pageHeadline || 'Book an Appointment'}
                </h3>
                <p className="text-gray-500 mt-1" style={{ fontSize: `${values.calendarFontSize}px` }}>
                  {values.pageSubheadline || 'Select a time that works for you'}
                </p>
              </div>

              {/* Calendar-like grid */}
              <div className="p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-medium">
                  Available Time Slots
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'].map(
                    (time, i) => {
                      const isAvailable = i % 3 !== 2
                      return (
                        <div
                          key={time}
                          className="rounded text-center py-2 px-1 font-medium cursor-pointer select-none"
                          style={{
                            backgroundColor: isAvailable
                              ? values.slotAvailableBg
                              : values.slotUnavailableBg,
                            color: isAvailable
                              ? values.slotAvailableText
                              : values.slotUnavailableText,
                            fontSize: `${values.calendarFontSize}px`,
                            borderRadius: `${Math.min(Number(values.calendarBorderRadius), 8)}px`,
                          }}
                        >
                          {time}
                        </div>
                      )
                    }
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: values.calendarBorderColor }}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: values.slotAvailableBg, borderRadius: '3px' }}
                    />
                    <span className="text-xs text-gray-500">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: values.slotUnavailableBg, borderRadius: '3px' }}
                    />
                    <span className="text-xs text-gray-500">Unavailable</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              This preview reflects your current settings. Save to apply changes to your live booking page.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
