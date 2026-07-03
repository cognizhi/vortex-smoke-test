/**
 * Tests for the CancelActions client component.
 *
 * Covers:
 *  - Renders keep and cancel buttons
 *  - Shows loading state during fetch
 *  - Shows success state on 200 response
 *  - Shows error state on 409 (already cancelled)
 *  - Shows error state on 410 (expired)
 *  - Shows generic error on network failure
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CancelActions from '../../../app/site/[slug]/cancel/[token]/CancelActions';

afterEach(() => {
  vi.restoreAllMocks();
});

function renderActions() {
  return render(<CancelActions token="test-token-abc" slug="my-salon" />);
}

describe('CancelActions', () => {
  it('renders keep and cancel buttons', () => {
    renderActions();
    expect(screen.getByRole('link', { name: /keep my booking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes, cancel/i })).toBeInTheDocument();
  });

  it('shows cancelled state on successful POST', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { success: true, confirmationNumber: 'BK-1001' }, error: null }),
    } as unknown as Response);

    renderActions();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/booking cancelled/i)).toBeInTheDocument();
    });
  });

  it('shows error message on 409 (already cancelled)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ data: null, error: { code: 'ALREADY_CANCELLED', message: 'Already cancelled' } }),
    } as unknown as Response);

    renderActions();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/already been cancelled/i)).toBeInTheDocument();
    });
  });

  it('shows error message on 410 (expired link)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({
        data: null,
        error: { code: 'EXPIRED', message: 'Expired' },
      }),
    } as unknown as Response);

    renderActions();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/cancel link has expired/i)).toBeInTheDocument();
    });
  });

  it('shows generic error on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    renderActions();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('disables cancel button while loading', async () => {
    // Never resolves — stays in loading state
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    renderActions();
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancelling/i })).toBeDisabled();
    });
  });
});
