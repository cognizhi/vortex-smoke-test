'use client';

import { useRef, useState, type ReactElement } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/layout/user-profile';
import { ALLOWED_AVATAR_MIME, MAX_AVATAR_BYTES } from '@/lib/validations/profile';

interface AvatarUploadProps {
  /** Current avatar URL (null → initials placeholder). */
  src: string | null;
  /** Display name — used for alt text and initials fallback. */
  name: string;
  /** Performs the upload and resolves with the new avatar URL. */
  uploadAvatar: (file: File, onProgress: (pct: number) => void) => Promise<string>;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (err: Error) => void;
  disabled?: boolean;
}

type Status = 'idle' | 'uploading' | 'error';

/**
 * Accessible avatar uploader (PROJ-42). Validates type + size client-side
 * (fail fast, no network), reports upload progress, and exposes a recoverable
 * error state. The actual transport is injected via `uploadAvatar`.
 */
export function AvatarUpload({
  src,
  name,
  uploadAvatar,
  onUploadSuccess,
  onUploadError,
  disabled = false,
}: AvatarUploadProps): ReactElement {
  const [displaySrc, setDisplaySrc] = useState<string | null>(src);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastFileRef = useRef<File | null>(null);

  const busy = disabled || status === 'uploading';

  function openPicker(): void {
    inputRef.current?.click();
  }

  async function startUpload(file: File): Promise<void> {
    lastFileRef.current = file;
    setStatus('uploading');
    setProgress(0);
    setMessage(null);
    try {
      const url = await uploadAvatar(file, setProgress);
      setDisplaySrc(url);
      setStatus('idle');
      onUploadSuccess?.(url);
      buttonRef.current?.focus();
    } catch (err) {
      setStatus('error');
      setMessage('Upload failed. Please try again.');
      onUploadError?.(err instanceof Error ? err : new Error('Upload failed'));
    }
  }

  function handleFile(file: File | undefined): void {
    if (!file) return;
    if (!(ALLOWED_AVATAR_MIME as readonly string[]).includes(file.type)) {
      setStatus('error');
      setMessage('Only JPEG and PNG files are supported.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setStatus('error');
      setMessage(`File must be under 5MB. Yours is ${mb}MB.`);
      return;
    }
    void startUpload(file);
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={openPicker}
          disabled={busy}
          aria-label="Change profile picture"
          className="group relative block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        >
          <span className="block h-24 w-24 overflow-hidden rounded-full sm:h-32 sm:w-32">
            <Avatar name={name} src={displaySrc} size="lg" className="h-full w-full" />
          </span>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100 motion-reduce:transition-none">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </span>
          {status === 'uploading' && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white">
              <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            // Reset so selecting the same file again re-triggers onChange.
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
        >
          Change photo
        </button>
        <p className="text-xs text-gray-500">JPEG or PNG, up to 5MB.</p>

        {status === 'uploading' && (
          <div aria-live="polite">
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Uploading your profile picture"
              className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <span className="mt-1 block text-xs text-gray-500">
              Uploading your profile picture… {progress}%
            </span>
          </div>
        )}

        {status === 'error' && message && (
          <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {message}
            {lastFileRef.current && (
              <button
                type="button"
                onClick={() => {
                  const f = lastFileRef.current;
                  if (f) void startUpload(f);
                }}
                className="ml-2 font-semibold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
