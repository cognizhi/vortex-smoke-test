'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  /** Upload progress (0–100) of the most recent avatar upload. */
  progress: number;
  refetch: () => Promise<void>;
  /**
   * Upload a new avatar. Resolves with the new avatar URL, rejects on failure.
   * Uses XHR so real upload progress can be reported to `onProgress`.
   */
  uploadAvatar: (file: File, onProgress?: (pct: number) => void) => Promise<string>;
}

/**
 * Fetches the signed-in admin's profile and exposes an avatar uploader with
 * progress. Modelled on the fetch conventions in `useAdminData.ts`.
 */
export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/profile', { credentials: 'include' });
      const json = (await res.json()) as { data: Profile | null; error: { message: string } | null };
      if (!res.ok || json.error) {
        setProfile(null);
        setError(json.error?.message ?? 'Failed to load profile');
      } else {
        setProfile(json.data);
      }
    } catch (e) {
      setProfile(null);
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const uploadAvatar = useCallback(
    (file: File, onProgress?: (pct: number) => void): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        const form = new FormData();
        form.set('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/profile/avatar');
        xhr.withCredentials = true;

        xhr.upload.onprogress = (e: ProgressEvent): void => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
            onProgress?.(pct);
          }
        };

        xhr.onload = (): void => {
          try {
            const json = JSON.parse(xhr.responseText) as {
              data: { avatarUrl: string } | null;
              error: { message: string } | null;
            };
            const data = json.data;
            if (xhr.status >= 200 && xhr.status < 300 && data) {
              setProfile((prev) => (prev ? { ...prev, avatarUrl: data.avatarUrl } : prev));
              resolve(data.avatarUrl);
            } else {
              reject(new Error(json.error?.message ?? 'Upload failed'));
            }
          } catch {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = (): void => reject(new Error('Upload failed'));

        xhr.send(form);
      });
    },
    [],
  );

  return { profile, loading, error, progress, refetch, uploadAvatar };
}
