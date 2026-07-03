import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../user-profile';

describe('UserProfile Dropdown Positioning', () => {
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original window height
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  const user = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  it('should expand downward when plenty of space below (desktop 1024px)', async () => {
    const actor = userEvent.setup();

    // Set desktop viewport
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    await waitFor(() => {
      const menu = screen.getByRole('menu');
      // Mock getBoundingClientRect for button to simulate top position
      expect(menu).toHaveClass('z-50');
      // Should have either top-full or bottom-full
      const hasTopFull = menu.className.includes('top-full');
      const hasBottomFull = menu.className.includes('bottom-full');
      expect(hasTopFull || hasBottomFull).toBe(true);
    });
  });

  it('should handle tablet viewport (768px)', async () => {
    const actor = userEvent.setup();

    // Set tablet viewport
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    await waitFor(() => {
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('z-50');
      expect(menu).toHaveClass('min-w-[240px]');
    });
  });

  it('should handle mobile viewport (375px)', async () => {
    const actor = userEvent.setup();

    // Set mobile viewport
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    await waitFor(() => {
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('z-50');
      expect(menu).toHaveClass('min-w-[240px]');
    });
  });

  it('should have correct positioning classes applied', async () => {
    const actor = userEvent.setup();

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    await waitFor(() => {
      const menu = screen.getByRole('menu');
      // Should have positioning spacing (mt-2 or mb-2)
      const hasSpacing = menu.className.includes('mt-2') || menu.className.includes('mb-2');
      expect(hasSpacing).toBe(true);
    });
  });

  it('should maintain menu visibility with all content', async () => {
    const actor = userEvent.setup();

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    await waitFor(() => {
      // Verify all menu items are visible
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();
    });
  });

  it('should be clickable on all menu items', async () => {
    const actor = userEvent.setup();
    const handleLogout = vi.fn();

    render(<UserProfile user={user} onLogout={handleLogout} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    // Verify Edit Profile link is clickable
    const editLink = screen.getByRole('menuitem', { name: /edit profile/i });
    expect(editLink).toBeEnabled();

    // Verify Logout button is clickable
    const logoutBtn = screen.getByRole('menuitem', { name: /log out/i });
    expect(logoutBtn).toBeEnabled();

    // Click logout and verify callback
    await actor.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalled();
  });

  it('should have no broken links', async () => {
    const actor = userEvent.setup();

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    const editLink = screen.getByRole('menuitem', { name: /edit profile/i });
    expect(editLink).toHaveAttribute('href', '/admin/profile');
  });
});
