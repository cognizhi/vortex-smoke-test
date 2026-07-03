import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';

// Mock fetch globally
global.fetch = vi.fn();

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide user data when authenticated', async () => {
    const mockUser = {
      userId: 'user-123',
      merchantId: 'merchant-456',
      slug: 'my-merchant',
      role: 'owner' as const,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockUser,
        error: null,
      }),
    });

    function TestComponent() {
      const { user, isReady, isLoading } = useAuth();

      if (!isReady) return <div>Loading auth...</div>;
      if (isLoading) return <div>Fetching session...</div>;
      if (!user) return <div>Not authenticated</div>;

      return (
        <div>
          <p data-testid="user-id">{user.userId}</p>
          <p data-testid="merchant-id">{user.merchantId}</p>
          <p data-testid="slug">{user.slug}</p>
          <p data-testid="role">{user.role}</p>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading auth...')).toBeInTheDocument();

    // Wait for session to be fetched
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
    expect(screen.getByTestId('merchant-id')).toHaveTextContent('merchant-456');
    expect(screen.getByTestId('slug')).toHaveTextContent('my-merchant');
    expect(screen.getByTestId('role')).toHaveTextContent('owner');
  });

  it('should handle authentication error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        data: null,
        error: { code: 'UNAUTHENTICATED', message: 'Not authenticated.' },
      }),
    });

    function TestComponent() {
      const { user, isReady, error } = useAuth();

      if (!isReady) return <div>Loading auth...</div>;
      if (!user) return <div data-testid="error-message">{error}</div>;

      return <div>Authenticated</div>;
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Not authenticated.');
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(
      new Error('Network error')
    );

    function TestComponent() {
      const { user, isReady, error } = useAuth();

      if (!isReady) return <div>Loading auth...</div>;
      if (!user) return <div data-testid="error-message">{error}</div>;

      return <div>Authenticated</div>;
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
  });

  it('should use httpOnly cookies (credentials: include)', async () => {
    const mockUser = {
      userId: 'user-123',
      merchantId: 'merchant-456',
      slug: 'my-merchant',
      role: 'admin' as const,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockUser,
        error: null,
      }),
    });

    function TestComponent() {
      const { isReady } = useAuth();
      return isReady ? <div>Ready</div> : <div>Loading</div>;
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    // Verify fetch was called with credentials
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('should provide default context in SSR mode', () => {
    function TestComponent() {
      const { user, isLoading, isReady } = useAuth();

      return (
        <div>
          <p data-testid="user">{user ? 'authenticated' : 'not authenticated'}</p>
          <p data-testid="is-loading">{isLoading ? 'loading' : 'not loading'}</p>
          <p data-testid="is-ready">{isReady ? 'ready' : 'not ready'}</p>
        </div>
      );
    }

    // Render without AuthProvider (SSR scenario)
    render(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('not authenticated');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('is-ready')).toHaveTextContent('not ready');
  });
});
