import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

function getFileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

// Use fireEvent.change rather than userEvent.upload: userEvent enforces the
// input's `accept` attribute and would silently drop a wrong-type file, so the
// component's own client-side validation (the thing under test) would never run.
function selectFile(file: File): void {
  fireEvent.change(getFileInput(), { target: { files: [file] } });
}

describe('AvatarUpload', () => {
  let uploadAvatar: ReturnType<typeof vi.fn>;

  const defaultProps = () => ({
    src: '/api/avatars/current.jpg',
    name: 'Jane Smith',
    uploadAvatar,
  });

  beforeEach(() => {
    uploadAvatar = vi.fn(
      async (_file: File, onProgress: (n: number) => void): Promise<string> => {
        onProgress(50);
        onProgress(100);
        return '/api/avatars/new.jpg';
      },
    );
  });

  it('AU-01: renders the current avatar image', () => {
    render(<AvatarUpload {...defaultProps()} />);
    const img = screen.getByRole('img', { name: /jane smith/i });
    expect(img).toHaveAttribute('src', '/api/avatars/current.jpg');
  });

  it('AU-02: exposes an accessible "change profile picture" control', () => {
    render(<AvatarUpload {...defaultProps()} />);
    expect(screen.getByRole('button', { name: /change profile picture/i })).toBeInTheDocument();
  });

  it('AU-03: rejects an invalid file type client-side without uploading', async () => {
    render(<AvatarUpload {...defaultProps()} />);
    selectFile(new File(['gif'], 'a.gif', { type: 'image/gif' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/only jpeg and png/i);
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('AU-04: rejects an oversized file client-side without uploading', async () => {
    render(<AvatarUpload {...defaultProps()} />);
    selectFile(new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/5mb/i);
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('AU-05: uploads a valid file, reports progress, and swaps in the new avatar', async () => {
    const onUploadSuccess = vi.fn();
    render(<AvatarUpload {...defaultProps()} onUploadSuccess={onUploadSuccess} />);

    selectFile(new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(uploadAvatar).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByRole('img', { name: /jane smith/i })).toHaveAttribute(
        'src',
        '/api/avatars/new.jpg',
      ),
    );
    expect(onUploadSuccess).toHaveBeenCalledWith('/api/avatars/new.jpg');
  });

  it('AU-06: shows a recoverable error state when the upload fails', async () => {
    uploadAvatar.mockRejectedValueOnce(new Error('network'));
    render(<AvatarUpload {...defaultProps()} />);

    selectFile(new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/upload failed/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
