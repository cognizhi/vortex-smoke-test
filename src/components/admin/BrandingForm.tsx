"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBrandingSchema } from "@/lib/validations/admin";
import { Loader2 } from "lucide-react";
import type { UpdateBrandingInput } from "@/lib/validations/admin";

interface BrandingFormProps {
  initialBranding?: {
    siteName?: string;
    avatarUrl?: string;
  };
  onSave: (data: UpdateBrandingInput) => Promise<void>;
  onError?: (error: Error) => void;
}

export default function BrandingForm({
  initialBranding,
  onSave,
  onError,
}: BrandingFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateBrandingInput>({
    resolver: zodResolver(updateBrandingSchema),
    defaultValues: {
      siteName: initialBranding?.siteName ?? "",
      avatarUrl: initialBranding?.avatarUrl ?? "",
    },
  });

  const siteName = watch("siteName") || "";
  const avatarUrl = watch("avatarUrl") || "";

  useEffect(() => {
    if (initialBranding) {
      reset({
        siteName: initialBranding.siteName ?? "",
        avatarUrl: initialBranding.avatarUrl ?? "",
      });
    }
  }, [initialBranding, reset]);

  const onSubmit = async (values: UpdateBrandingInput) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Only send fields that are actually provided
      const dataToSend: UpdateBrandingInput = {};
      if (values.siteName) {
        dataToSend.siteName = values.siteName;
      }
      if (values.avatarUrl) {
        dataToSend.avatarUrl = values.avatarUrl;
      }

      await onSave(dataToSend);
      setSuccessMessage("Branding updated successfully");

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save branding. Please try again.";
      setErrorMessage(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Site Name Field */}
        <div>
          <label htmlFor="siteName" className="block text-sm font-medium text-gray-900 mb-1">
            Site Name
            <span className="text-gray-600 font-normal ml-1">(optional)</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">
            💡 Displayed at the top of your booking page
          </p>
          <input
            id="siteName"
            type="text"
            placeholder="Your booking page name"
            disabled={isSubmitting}
            maxLength={100}
            {...register("siteName")}
            className={`w-full px-3 py-2 border rounded-md text-sm font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.siteName ? "border-red-500" : "border-gray-300"
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {siteName.length}/100 characters
            </span>
            {errors.siteName && (
              <span role="alert" className="text-xs text-red-600">
                {errors.siteName.message}
              </span>
            )}
          </div>
        </div>

        {/* Avatar URL Field */}
        <div>
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-900 mb-1">
            Avatar URL
            <span className="text-gray-600 font-normal ml-1">(optional)</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">
            💡 Add an image URL for branding. Must be HTTPS.
          </p>
          <input
            id="avatarUrl"
            type="text"
            placeholder="https://example.com/logo.png"
            disabled={isSubmitting}
            maxLength={500}
            {...register("avatarUrl")}
            className={`w-full px-3 py-2 border rounded-md text-sm font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.avatarUrl ? "border-red-500" : "border-gray-300"
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {avatarUrl.length}/500 characters
            </span>
            {errors.avatarUrl && (
              <span role="alert" className="text-xs text-red-600">
                {errors.avatarUrl.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* General Form Error */}
      {errors.root && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div
          role="status"
          className="bg-green-50 border border-green-300 rounded-md p-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
