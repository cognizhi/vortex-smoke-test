'use client';

/**
 * Merchant Registration Page — /register
 *
 * Multi-field form with real-time slug availability debouncing.
 * On success, API sets the session cookie and we redirect to /admin.
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const slugValue = watch('slug', '');
  const businessNameValue = watch('businessName', '');

  // Auto-suggest slug from business name
  useEffect(() => {
    if (businessNameValue && slugValue === '') {
      const suggested = toSlug(businessNameValue);
      if (suggested.length >= 3) {
        setValue('slug', suggested, { shouldValidate: false });
      }
    }
  }, [businessNameValue, slugValue, setValue]);

  // Debounced slug availability check
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    try {
      const res = await fetch(
        `/api/check-slug?slug=${encodeURIComponent(slug)}`
      );
      const json = await res.json() as {
        data: { available: boolean; reason?: string } | null;
        error: { message: string } | null;
      };
      if (json.data?.available) {
        setSlugStatus('available');
      } else if (json.data?.reason === 'reserved') {
        setSlugStatus('reserved');
      } else if (json.data?.reason === 'invalid') {
        setSlugStatus('invalid');
      } else {
        setSlugStatus('taken');
      }
    } catch {
      setSlugStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkSlug(slugValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [slugValue, checkSlug]);

  const onSubmit = async (data: RegisterInput): Promise<void> => {
    if (slugStatus === 'taken' || slugStatus === 'reserved' || slugStatus === 'invalid') return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json() as {
        data: { dashboardUrl: string } | null;
        error: { message: string } | null;
      };
      if (!res.ok || json.error) {
        setServerError(json.error?.message ?? 'Registration failed. Please try again.');
        return;
      }
      router.push('/admin');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slugStatusIcon = (): React.JSX.Element | null => {
    if (slugStatus === 'checking')
      return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
    if (slugStatus === 'available')
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (slugStatus === 'taken' || slugStatus === 'reserved' || slugStatus === 'invalid')
      return <XCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const slugStatusMessage = (): string | null => {
    if (slugStatus === 'available') return 'This subdomain is available!';
    if (slugStatus === 'taken') return 'This subdomain is already taken.';
    if (slugStatus === 'reserved') return 'This subdomain is reserved.';
    if (slugStatus === 'invalid')
      return 'Use 3–30 lowercase letters, digits, and hyphens. Must start and end with a letter or digit.';
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Launch your booking page</h1>
          <p className="text-slate-600 mt-1">Get set up in minutes — no credit card required</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
          <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} noValidate>
            {serverError && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Business name */}
            <div className="mb-5">
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-1">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                autoComplete="organization"
                placeholder="Glamour Studio"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                {...register('businessName')}
              />
              {errors.businessName && (
                <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>
              )}
            </div>

            {/* Subdomain / slug */}
            <div className="mb-5">
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
                Your booking subdomain
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="slug"
                    type="text"
                    autoComplete="off"
                    placeholder="glamour-studio"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 pr-8 text-sm font-mono shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    {...register('slug')}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    {slugStatusIcon()}
                  </span>
                </div>
                <span className="text-sm text-slate-500 whitespace-nowrap">.platform.com</span>
              </div>
              {slugStatusMessage() && (
                <p
                  className={`mt-1 text-xs ${
                    slugStatus === 'available' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {slugStatusMessage()}
                </p>
              )}
              {errors.slug && !slugStatusMessage() && (
                <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="ownerEmail"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                {...register('ownerEmail')}
              />
              {errors.ownerEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.ownerEmail.message}</p>
              )}
            </div>

            {/* Owner name */}
            <div className="mb-5">
              <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700 mb-1">
                Your full name
              </label>
              <input
                id="ownerName"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                {...register('ownerName')}
              />
              {errors.ownerName && (
                <p className="mt-1 text-xs text-red-600">{errors.ownerName.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || slugStatus === 'taken' || slugStatus === 'reserved'}
              className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating your page…
                </span>
              ) : (
                'Create booking page'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
