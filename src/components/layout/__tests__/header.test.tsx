import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { Header } from '../header';
import { useAuth } from '@/lib/auth-context';

// ThemeToggle pulls in theme/localStorage concerns irrelevant to these tests.
vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: (): null => null,
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('Header — avatar menu (PROJ-43)', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(useAuth).mockReturnValue({
      user: {
        userId: 'u1',
        merchantId: 'm1',
        slug: 'acme',
        role: 'owner',
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: null,
      },
      isLoading: false,
      error: null,
      isReady: true,
      refresh: vi.fn(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { success: true }, error: null }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the logout API and redirects to /login when Log out is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /john doe profile menu/i }));
    await user.click(screen.getByRole('menuitem', { name: /log out/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('exposes an Edit profile link to /admin/profile', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    expect(screen.getByRole('menuitem', { name: /edit profile/i })).toHaveAttribute(
      'href',
      '/admin/profile'
    );
  });
});
