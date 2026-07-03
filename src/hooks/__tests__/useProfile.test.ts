import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from '@/hooks/useProfile';

const PROFILE = { id: 'u1', name: 'Jane', email: 'jane@acme.com', avatarUrl: '/api/avatars/j.jpg' };

describe('useProfile', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: PROFILE, error: null }),
    }) as unknown as typeof fetch;
  });

  it('UPH-01: fetches the profile on mount', async () => {
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toMatchObject(PROFILE);
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/profile', expect.objectContaining({ credentials: 'include' }));
  });

  it('UPH-02: surfaces an error when the profile fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ data: null, error: { message: 'boom' } }),
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('UPH-03: uploadAvatar POSTs the file and reports progress', async () => {
    class MockXHR {
      upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = {
        onprogress: null,
      };
      status = 200;
      responseText = JSON.stringify({ data: { avatarUrl: '/api/avatars/new.jpg' }, error: null });
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = vi.fn();
      setRequestHeader = vi.fn();
      send = vi.fn(function (this: MockXHR) {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
        this.onload?.();
      });
    }
    global.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const progress: number[] = [];
    let url = '';
    await act(async () => {
      url = await result.current.uploadAvatar(
        new File(['jpeg'], 'p.jpg', { type: 'image/jpeg' }),
        (n) => progress.push(n),
      );
    });

    expect(url).toBe('/api/avatars/new.jpg');
    expect(progress).toContain(50);
  });
});
