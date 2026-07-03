"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, Loader2, DollarSign } from "lucide-react"
import { Service } from "@/types/admin"

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Duration must be a number" })
    .min(5, "Duration must be at least 5 minutes"),
  priceDisplay: z.string().optional(),
  description: z.string().optional(),
  isEnabled: z.boolean(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  service?: Service | null
  onClose: () => void
  onSuccess: () => void
}

export default function ServiceForm({ service, onClose, onSuccess }: ServiceFormProps) {
  const isEdit = service != null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      durationMinutes: 30,
      priceDisplay: "",
      description: "",
      isEnabled: true,
    },
  })

  useEffect(() => {
    if (service) {
      setValue("name", service.name)
      setValue("durationMinutes", service.durationMinutes)
      setValue(
        "priceDisplay",
        service.priceCents != null ? (service.priceCents / 100).toFixed(2) : ""
      )
      setValue("description", service.description ?? "")
      setValue("isEnabled", service.isEnabled)
    }
  }, [service, setValue])

  const isEnabled = watch("isEnabled")

  const onSubmit = async (values: ServiceFormValues) => {
    const rawPrice = values.priceDisplay?.trim()
    let priceCents: number | null = null
    if (rawPrice && rawPrice !== "") {
      const parsed = parseFloat(rawPrice)
      if (!isNaN(parsed)) {
        priceCents = Math.round(parsed * 100)
      }
    }

    const body = {
      name: values.name,
      durationMinutes: values.durationMinutes,
      priceCents,
      description: values.description?.trim() || null,
      isEnabled: values.isEnabled,
    }

    const url = isEdit
      ? `/api/admin/services/${service!.id}`
      : "/api/admin/services"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error ?? "Failed to save service")
    }

    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit service" : "Add service"}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isEdit ? "Edit Service" : "Add Service"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5 px-6 py-5">
            {/* Name */}
            <div>
              <label
                htmlFor="sf-name"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="sf-name"
                type="text"
                {...register("name")}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                placeholder="e.g. Haircut"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="sf-duration"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                id="sf-duration"
                type="number"
                min={5}
                step={5}
                {...register("durationMinutes")}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                placeholder="30"
              />
              {errors.durationMinutes && (
                <p className="mt-1 text-xs text-red-500">{errors.durationMinutes.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="sf-price"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Price (optional)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                  <DollarSign className="h-4 w-4" />
                </span>
                <input
                  id="sf-price"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register("priceDisplay")}
                  className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  placeholder="45.00"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Leave empty if price varies or is not applicable.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="sf-description"
                className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Description (optional)
              </label>
              <textarea
                id="sf-description"
                rows={3}
                {...register("description")}
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                placeholder="Brief description of the service…"
              />
            </div>

            {/* isEnabled toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Service enabled
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Disabled services won&apos;t appear in the booking flow.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => setValue("isEnabled", !isEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isEnabled ? "bg-indigo-600" : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t px-6 py-4 dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? "Saving…" : "Save Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
