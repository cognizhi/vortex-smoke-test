'use client';

/**
 * CancelActions — client component that handles the cancel/keep buttons.
 *
 * We pass slug + token so the fetch can include the slug as a query param
 * fallback (for environments where x-merchant-slug header may not be present,
 * e.g. direct API testing). The main cancellation path relies on the
 * x-merchant-slug header set by middleware.
 */

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

interface CancelActionsProps {
  token: string;
  slug: string;
}

type State = 'idle' | 'loading' | 'cancelled' | 'error';

export default function CancelActions({ token, slug: _slug }: CancelActionsProps) {
  const [state, setState] = useState<State>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function handleCancel() {
    setState('loading');
    try {
      const res = await fetch(`/api/cancel/${token}`, {
        method: 'POST',
      });

      const json = (await res.json()) as {
        data: { success: boolean; confirmationNumber: string } | null;
        error: { code: string; message: string } | null;
      };

      if (res.status === 409) {
        setErrorMessage('This booking has already been cancelled.');
        setState('error');
        return;
      }
      if (res.status === 410) {
        setErrorMessage(
          'This cancel link has expired — the appointment time has already passed.'
        );
        setState('error');
        return;
      }
      if (!res.ok || json.error) {
        setErrorMessage(json.error?.message ?? 'Failed to cancel booking. Please try again.');
        setState('error');
        return;
      }

      setState('cancelled');
    } catch {
      setErrorMessage('Network error. Please try again.');
      setState('error');
    }
  }

  if (state === 'cancelled') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-5 w-5 text-emerald-600" />
        </div>
        <p className="font-semibold text-emerald-800">Booking cancelled</p>
        <p className="mt-1 text-sm text-emerald-600">
          Your booking has been cancelled and the time slot is now available for others.
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href="/"
        className="flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        Keep my booking
      </a>
      <button
        type="button"
        onClick={() => void handleCancel()}
        disabled={state === 'loading'}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {state === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Cancelling…
          </>
        ) : (
          'Yes, cancel this booking'
        )}
      </button>
    </div>
  );
}
