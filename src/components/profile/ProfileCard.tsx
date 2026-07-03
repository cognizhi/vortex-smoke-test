'use client';

import { type ReactElement, type ReactNode } from 'react';
import { Avatar } from '@/components/layout/user-profile';

interface ProfileCardProps {
  name: string;
  email: string;
  role: 'owner' | 'admin';
  avatarUrl: string | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Optional interactive avatar (e.g. AvatarUpload); falls back to a static Avatar. */
  avatarSlot?: ReactNode;
}

/**
 * Presentational profile card with loading / loaded / error states.
 * The avatar can be supplied via `avatarSlot` (interactive) or rendered as a
 * static image from `avatarUrl`.
 */
export function ProfileCard({
  name,
  email,
  role,
  avatarUrl,
  loading = false,
  error = null,
  onRetry,
  avatarSlot,
}: ProfileCardProps): ReactElement {
  if (loading) {
    return (
      <div
        data-testid="profile-card-skeleton"
        className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background p-6 sm:flex-row"
      >
        <div className="h-24 w-24 animate-pulse rounded-full bg-secondary motion-reduce:animate-none sm:h-32 sm:w-32" />
        <div className="flex w-full flex-col gap-2">
          <div className="h-5 w-40 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
          <div className="h-4 w-56 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-lg border border-border bg-red-50 p-6 text-sm text-red-600"
      >
        <p>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background p-6 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
      {avatarSlot ?? (
        <span className="block h-24 w-24 overflow-hidden rounded-full sm:h-32 sm:w-32">
          <Avatar name={name} src={avatarUrl} size="lg" className="h-full w-full" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{name}</h2>
        <p className="text-sm text-gray-500">{email}</p>
        <span className="mt-1 inline-flex w-fit items-center self-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground sm:self-start">
          {role}
        </span>
      </div>
    </div>
  );
}
