"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, Loader2 } from "lucide-react"
import type { Staff } from "@/types/admin"

interface StaffFormProps {
  staff?: Staff | null
  onClose: () => void
  onSuccess: () => void
}

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactNumber: z.string().optional(),
  isVisible: z.boolean(),
})

type StaffFormValues = z.infer<typeof staffSchema>

export function StaffForm({ staff, onClose, onSuccess }: StaffFormProps) {
  const isEditing = staff != null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: staff?.name ?? "",
      email: staff?.email ?? "",
      contactNumber: staff?.contactNumber ?? "",
      isVisible: staff?.isVisible ?? true,
    },
  })

  const isVisible = watch("isVisible")

  useEffect(() => {
    if (staff) {
      setValue("name", staff.name)
      setValue("email", staff.email ?? "")
      setValue("contactNumber", staff.contactNumber ?? "")
      setValue("isVisible", staff.isVisible)
    }
  }, [staff, setValue])

  const onSubmit = async (values: StaffFormValues) => {
    try {
      const payload = {
        name: values.name,
        email: values.email || null,
        contactNumber: values.contactNumber || null,
        isVisible: values.isVisible,
      }

      const url = isEditing
        ? `/api/admin/staff/${staff.id}`
        : "/api/admin/staff"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const err = (data as { error?: { message?: string } | string }).error
        const message =
          typeof err === "string"
            ? err
            : err?.message ?? `Request failed with status ${res.status}`
        setError("root", { message })
        return
      }

      onSuccess()
    } catch {
      setError("root", { message: "An unexpected error occurred. Please try again." })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? `Edit ${staff.name}` : "Add staff member"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Root error */}
            {errors.root && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.root.message}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="staff-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="staff-name"
                type="text"
                autoComplete="off"
                {...register("name")}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="Jane Doe"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="staff-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="staff-email"
                type="email"
                autoComplete="off"
                {...register("email")}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="jane@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label
                htmlFor="staff-contact"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Contact number
              </label>
              <input
                id="staff-contact"
                type="tel"
                autoComplete="off"
                {...register("contactNumber")}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="+1 555 000 0000"
              />
              {errors.contactNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.contactNumber.message}
                </p>
              )}
            </div>

            {/* Visible toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Visible to customers
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isVisible}
                onClick={() => setValue("isVisible", !isVisible)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isVisible ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isVisible ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
