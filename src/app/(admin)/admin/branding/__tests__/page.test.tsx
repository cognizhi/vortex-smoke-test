import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrandingPage from '../page';

describe('BrandingPage - Error Message Extraction (BKNG-0109)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, branding: {} }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('CT-01: Save Handler - Error Message Extraction', () => {
    /**
     * BKNG-0109 Bug: When API returns error object { code, message },
     * the component tries to render the entire object as a string.
     * This test verifies the fix extracts error.message properly.
     *
     * Current behavior (FAILS): React throws "Objects are not valid as a React child"
     * Expected behavior (AFTER FIX): Toast displays "Invalid input"
     */
    it('should extract error.message from error object and display in toast', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Site name is too long',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      // Fill in form with valid data
      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'Test Brand');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      // Verify error toast displays extracted message (string, not object)
      await waitFor(() => {
        expect(screen.getByText('Site name is too long')).toBeInTheDocument();
      });
    });
  });

  describe('CT-02: Reset Handler - Error Message Extraction', () => {
    /**
     * BKNG-0109 Bug: The reset handler has the same issue as save handler.
     * This test verifies error.message is extracted from reset error responses.
     *
     * Current behavior (FAILS): React throws "Objects are not valid as a React child"
     * Expected behavior (AFTER FIX): Toast displays "Cannot reset at this time"
     */
    it('should extract error.message from reset error and display in toast', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'RESET_FAILED',
            message: 'Cannot reset at this time',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      // Click reset site name button
      const resetButton = screen.getByRole('button', { name: /Reset Site Name/i });

      // Mock confirm dialog
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await user.click(resetButton);

      // Verify error toast displays extracted message
      await waitFor(() => {
        expect(screen.getByText('Cannot reset at this time')).toBeInTheDocument();
      });
    });
  });

  describe('CT-03: Fallback Message When error.message is Undefined', () => {
    /**
     * BKNG-0109: Edge case - API returns error object without message property
     * Test verifies fallback message displays when error.message is undefined
     *
     * Current behavior: May fail trying to render { code: 'ERROR' } object
     * Expected behavior (AFTER FIX): Display "Failed to save branding" fallback
     */
    it('should display fallback message when error.message is undefined in save', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            // message is intentionally missing
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save branding')).toBeInTheDocument();
      });
    });
  });

  describe('CT-04: Fallback Message When error is Null/Undefined', () => {
    /**
     * BKNG-0109: Another edge case - API returns error: null or undefined
     * Test verifies fallback message displays in this scenario
     *
     * Current behavior: May attempt to render null as object
     * Expected behavior (AFTER FIX): Display "Failed to save branding" fallback
     */
    it('should display fallback message when error is null', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: null,
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save branding')).toBeInTheDocument();
      });
    });

    it('should display fallback message when error is undefined in reset', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: undefined,
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const resetButton = screen.getByRole('button', { name: /Reset Site Name/i });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to reset branding')).toBeInTheDocument();
      });
    });
  });

  describe('CT-05: No React Console Errors on Error Response', () => {
    /**
     * BKNG-0109: Verify no React rendering errors occur
     * This test checks that the React "Objects are not valid as a React child" error
     * does NOT appear in the console when error objects are received.
     *
     * Current behavior (FAILS): Console has React error
     * Expected behavior (AFTER FIX): No React errors in console
     */
    it('should not throw React rendering error when save fails with error object', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID',
            message: 'Invalid input',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
      });

      // Verify no React rendering error was logged
      const reactErrors = consoleErrorSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('Objects are not valid')
      );
      expect(reactErrors).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });

    it('should not throw React rendering error when reset fails with error object', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'RESET_ERROR',
            message: 'Reset not allowed',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const resetButton = screen.getByRole('button', { name: /Reset Site Name/i });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Reset not allowed')).toBeInTheDocument();
      });

      // Verify no React rendering error was logged
      const reactErrors = consoleErrorSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('Objects are not valid')
      );
      expect(reactErrors).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('CT-06: Save Success Path (Regression Test)', () => {
    /**
     * BKNG-0109 Fix Acceptance Criteria FIX-07:
     * Verify existing save success tests still pass (no regressions)
     */
    it('should display success message when save succeeds', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          branding: {
            siteName: 'My Brand',
            avatarUrl: 'https://example.com/avatar.png',
            updatedAt: '2026-07-01T12:00:00Z',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'My Brand');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Branding saved successfully')).toBeInTheDocument();
      });
    });

    it('should update form fields with response data on success', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          branding: {
            siteName: 'Updated Brand',
            avatarUrl: null,
            updatedAt: '2026-07-01T12:00:00Z',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i) as HTMLInputElement;
      await user.type(siteNameInput, 'Updated Brand');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Branding saved successfully')).toBeInTheDocument();
        expect(siteNameInput.value).toBe('Updated Brand');
      });
    });
  });

  describe('CT-07: Reset Success Path (Regression Test)', () => {
    /**
     * BKNG-0109 Fix Acceptance Criteria FIX-07:
     * Verify existing reset success tests still pass (no regressions)
     */
    it('should display success message when reset succeeds', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          branding: {
            siteName: '',
            avatarUrl: null,
            updatedAt: '2026-07-01T12:00:00Z',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const resetButton = screen.getByRole('button', { name: /Reset Site Name/i });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Branding reset successfully')).toBeInTheDocument();
      });
    });

    it('should clear site name field after successful reset', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          branding: {
            siteName: '',
            avatarUrl: null,
            updatedAt: '2026-07-01T12:00:00Z',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i) as HTMLInputElement;

      // Pre-fill the field
      await user.type(siteNameInput, 'Test Brand');
      expect(siteNameInput.value).toBe('Test Brand');

      // Reset
      const resetButton = screen.getByRole('button', { name: /Reset Site Name/i });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Branding reset successfully')).toBeInTheDocument();
        expect(siteNameInput.value).toBe('');
      });
    });
  });

  describe('CT-08: Avatar Reset Success Path (Regression Test)', () => {
    /**
     * BKNG-0109 Fix Acceptance Criteria FIX-07:
     * Verify avatar reset success still works (no regressions)
     */
    it('should clear avatar after successful reset', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          branding: {
            siteName: 'Brand',
            avatarUrl: null,
            updatedAt: '2026-07-01T12:00:00Z',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      // Upload file
      const fileInput = screen.getByLabelText(/Avatar/i) as HTMLInputElement;
      const file = new File(['avatar content'], 'avatar.png', { type: 'image/png' });

      // Use fireEvent for file input as userEvent.upload has limitations
      await userEvent.upload(fileInput, file);

      // Wait for preview to appear
      await waitFor(() => {
        const preview = screen.queryByAltText(/Avatar preview/i);
        expect(preview).toBeInTheDocument();
      });

      // Click reset avatar
      const resetAvatarButton = screen.getByRole('button', { name: /Reset Avatar/i });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await user.click(resetAvatarButton);

      await waitFor(() => {
        expect(screen.getByText('Branding reset successfully')).toBeInTheDocument();
        // Preview should be gone
        expect(screen.queryByAltText(/Avatar preview/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('CT-09: Network Error Fallback (No API Response)', () => {
    /**
     * BKNG-0109 Related: Verify network error path is unaffected
     * This test ensures the catch block still works properly
     */
    it('should display network error message when fetch fails', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('CT-10: Type Safety - Error Object Structure', () => {
    /**
     * BKNG-0109 Fix Acceptance Criteria FIX-08:
     * Verify TypeScript compilation with correct error type
     * This is a structural test that verifies the component accepts
     * error objects with code and message properties
     */
    it('should handle error responses with code and message structure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is invalid',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<BrandingPage />);

      const siteNameInput = screen.getByPlaceholderText(/Enter your custom site name/i);
      await user.type(siteNameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      // Should successfully extract and display the message
      await waitFor(() => {
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      });
    });
  });
});
