/**
 * Tests for the BrandingForm component.
 *
 * Covers:
 * - Renders form with siteName and avatarUrl fields
 * - Accepts user input and displays character counts
 * - Shows inline validation errors
 * - Submits with only siteName when avatarUrl is empty
 * - Submits with only avatarUrl when siteName is empty
 * - Submits with both fields when both are provided
 * - Shows loading state during submission
 * - Displays success toast on successful save
 * - Displays error toast on failed save
 * - Disables button while submitting
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrandingForm from '../BrandingForm';

afterEach(() => {
  vi.restoreAllMocks();
});

function renderForm(
  onSave = vi.fn().mockResolvedValue(undefined),
  initialBranding = {}
) {
  return render(
    <BrandingForm
      initialBranding={initialBranding}
      onSave={onSave}
    />
  );
}

describe('BrandingForm', () => {
  it('CT-01: renders the form with both fields', () => {
    renderForm();

    expect(screen.getByLabelText(/site name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/avatar url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('CT-02: displays character count for siteName field', async () => {
    const user = userEvent.setup();
    renderForm();

    const siteNameInput = screen.getByLabelText(/site name/i) as HTMLInputElement;
    await user.type(siteNameInput, 'My Salon');

    expect(screen.getByText('8/100 characters')).toBeInTheDocument();
  });

  it('CT-03: displays character count for avatarUrl field', async () => {
    const user = userEvent.setup();
    renderForm();

    const avatarInput = screen.getByLabelText(/avatar url/i) as HTMLInputElement;
    await user.type(avatarInput, 'https://example.com/logo.png');

    expect(screen.getByText('31/500 characters')).toBeInTheDocument();
  });

  it('CT-04: submits form with only siteName when avatarUrl is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i);
    await user.type(siteNameInput, 'My Salon');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ siteName: 'My Salon' });
    });
  });

  it('CT-05: submits form with only avatarUrl when siteName is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderForm(onSave);

    const avatarInput = screen.getByLabelText(/avatar url/i);
    await user.type(avatarInput, 'https://example.com/logo.png');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ avatarUrl: 'https://example.com/logo.png' });
    });
  });

  it('CT-06: submits form with both fields when both are provided', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i);
    const avatarInput = screen.getByLabelText(/avatar url/i);

    await user.type(siteNameInput, 'My Salon');
    await user.type(avatarInput, 'https://example.com/logo.png');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        siteName: 'My Salon',
        avatarUrl: 'https://example.com/logo.png',
      });
    });
  });

  it('CT-07: shows inline validation error for invalid avatarUrl format', async () => {
    const user = userEvent.setup();
    renderForm();

    const avatarInput = screen.getByLabelText(/avatar url/i);
    await user.type(avatarInput, 'not-a-url');
    fireEvent.blur(avatarInput);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
    });
  });

  it('CT-08: shows inline validation error for siteName exceeding max length', async () => {
    const user = userEvent.setup();
    renderForm();

    const siteNameInput = screen.getByLabelText(/site name/i);
    const longName = 'a'.repeat(101);
    await user.type(siteNameInput, longName);
    fireEvent.blur(siteNameInput);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/100 characters or fewer/i)).toBeInTheDocument();
    });
  });

  it('CT-09: shows loading state while submitting', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => new Promise(() => {})); // Never resolves
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i);
    await user.type(siteNameInput, 'My Salon');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });

  it('CT-10: disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => new Promise(() => {}));
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i);
    await user.type(siteNameInput, 'My Salon');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('CT-11: disables all form inputs while submitting', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => new Promise(() => {}));
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i) as HTMLInputElement;
    const avatarInput = screen.getByLabelText(/avatar url/i) as HTMLInputElement;

    await user.type(siteNameInput, 'My Salon');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(siteNameInput.disabled).toBe(true);
    expect(avatarInput.disabled).toBe(true);
  });

  it('CT-12: displays success toast on successful save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i);
    await user.type(siteNameInput, 'My Salon');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/branding updated successfully/i);
    });
  });

  it('CT-13: displays error toast on failed save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    renderForm(onSave);

    const siteNameInput = screen.getByLabelText(/site name/i);
    await user.type(siteNameInput, 'My Salon');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to save/i);
    });
  });

  it('CT-14: clears inline validation error when user corrects the field', async () => {
    const user = userEvent.setup();
    renderForm();

    const avatarInput = screen.getByLabelText(/avatar url/i);

    // Type invalid URL
    await user.type(avatarInput, 'not-a-url');
    fireEvent.blur(avatarInput);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Clear and type valid URL
    await user.clear(avatarInput);
    await user.type(avatarInput, 'https://example.com/logo.png');
    fireEvent.blur(avatarInput);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('CT-15: loads initial branding values when provided', async () => {
    renderForm(
      vi.fn(),
      {
        siteName: 'Existing Salon',
        avatarUrl: 'https://example.com/existing.png',
      }
    );

    const siteNameInput = screen.getByLabelText(/site name/i) as HTMLInputElement;
    const avatarInput = screen.getByLabelText(/avatar url/i) as HTMLInputElement;

    expect(siteNameInput.value).toBe('Existing Salon');
    expect(avatarInput.value).toBe('https://example.com/existing.png');
  });

  it('CT-16: does not submit when neither field has content', async () => {
    const onSave = vi.fn();
    renderForm(onSave);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    // Client-side validation should prevent submission
    expect(onSave).not.toHaveBeenCalled();
  });
});
