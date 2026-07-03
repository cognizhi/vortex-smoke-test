'use client';

/**
 * Admin Branding Settings Page
 *
 * Allows admin users to customize:
 * - Site name (custom name displayed on booking page)
 * - Avatar/logo image (custom image displayed on booking page)
 *
 * Features:
 * - Form submission to POST /api/admin/branding
 * - File upload with validation
 * - Reset buttons for individual fields
 * - Success/error toast notifications
 * - Loading states during submission
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';

// Types
interface BrandingResponse {
  siteName?: string | null;
  avatarUrl?: string | null;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  branding?: T;
  error?: { code: string; message: string };
}

// Toast component
interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

function Toast({ type, message, onClose }: ToastProps) {
  const bgColor = type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-emerald-900' : 'text-red-900';
  const iconColor = type === 'success' ? 'text-emerald-600' : 'text-red-600';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor} ${textColor} flex items-center gap-3 max-w-md shadow-lg animate-in fade-in slide-in-from-right-full`}
    >
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
      <p className="text-sm">{message}</p>
      <button
        onClick={onClose}
        className={`ml-auto text-lg leading-none ${textColor} hover:opacity-70`}
      >
        ✕
      </button>
    </div>
  );
}

export default function BrandingPage() {
  const [siteName, setSiteName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedMimes.includes(file.type)) {
      setFileError('Invalid file format. Allowed: PNG, JPG, WebP, GIF');
      return;
    }

    if (file.size > maxSize) {
      setFileError(`File size must be less than 2MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setAvatarFile(file);
  };

  // Save branding
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setToast(null);

    try {
      // Create FormData
      const formData = new FormData();
      if (siteName.trim()) {
        formData.append('siteName', siteName.trim());
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Send request
      const response = await fetch('/api/admin/branding', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as ApiResponse<BrandingResponse>;

      if (!response.ok || !data.success) {
        setToast({
          type: 'error',
          message: data.error?.message || 'Failed to save branding',
        });
        return;
      }

      // Success
      setToast({
        type: 'success',
        message: 'Branding saved successfully',
      });

      // Update form with response data
      setSiteName(data.branding?.siteName || '');
      setAvatarUrl(data.branding?.avatarUrl || null);
      setAvatarFile(null);
      setAvatarPreview(null);

      // Clear file input
      const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      console.error('Error saving branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset field
  const handleReset = async (field: 'site_name' | 'avatar_url') => {
    if (!confirm(`Reset ${field === 'site_name' ? 'site name' : 'avatar'} to default?`)) {
      return;
    }

    setIsLoading(true);
    setToast(null);

    try {
      const response = await fetch('/api/admin/branding/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: [field] }),
      });

      const data = (await response.json()) as ApiResponse<BrandingResponse>;

      if (!response.ok || !data.success) {
        setToast({
          type: 'error',
          message: data.error?.message || 'Failed to reset branding',
        });
        return;
      }

      // Success
      setToast({
        type: 'success',
        message: 'Branding reset successfully',
      });

      // Update form
      if (field === 'site_name') {
        setSiteName('');
      } else {
        setAvatarUrl(null);
        setAvatarPreview(null);
        const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        setAvatarFile(null);
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      console.error('Error resetting branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Branding Settings</h1>

        <form onSubmit={handleSave} className="space-y-8 bg-white rounded-lg shadow-sm p-6">
          {/* Site Name */}
          <div>
            <label htmlFor="site-name" className="block text-sm font-medium text-slate-700 mb-2">
              Site Name
            </label>
            <input
              id="site-name"
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter your custom site name"
              maxLength={100}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Max 100 characters</p>
            <button
              type="button"
              onClick={() => handleReset('site_name')}
              disabled={isLoading}
              className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Site Name
            </button>
          </div>

          {/* Avatar */}
          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-slate-700 mb-2">
              Avatar
            </label>

            {/* Preview */}
            {(avatarPreview || avatarUrl) && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-2">Current Avatar:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview || avatarUrl || ''}
                  alt="Avatar preview"
                  className="h-32 w-32 rounded-lg object-cover border border-slate-200"
                />
              </div>
            )}

            {/* File Input */}
            <div className="relative">
              <input
                id="avatar-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="hidden"
              />
              <label
                htmlFor="avatar-input"
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-sm text-slate-600">Choose File</span>
              </label>
            </div>

            {/* File Error */}
            {fileError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {fileError}
              </p>
            )}

            {/* File Info */}
            {avatarFile && (
              <p className="mt-2 text-sm text-slate-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {avatarFile.name} ({(avatarFile.size / 1024 / 1024).toFixed(1)}MB)
              </p>
            )}

            <p className="text-xs text-slate-500 mt-2">Accepted: PNG, JPG, WebP, GIF. Max size: 2MB</p>

            <button
              type="button"
              onClick={() => handleReset('avatar_url')}
              disabled={isLoading}
              className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Avatar
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
