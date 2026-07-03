import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile, Avatar } from '../user-profile';

describe('UserProfile Component', () => {
  it('should render UserProfile with user prop', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserProfile user={user} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render with default user when no user prop', () => {
    render(<UserProfile />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show dropdown menu when clicked', async () => {
    const actor = userEvent.setup();
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    // Menu should appear
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should call onLogout when logout button is clicked', async () => {
    const actor = userEvent.setup();
    const handleLogout = vi.fn();
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserProfile user={user} onLogout={handleLogout} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));
    await actor.click(screen.getByRole('menuitem', { name: /log out/i }));

    expect(handleLogout).toHaveBeenCalled();
  });

  it('should render an Edit profile link to /admin/profile', async () => {
    const actor = userEvent.setup();
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    expect(screen.getByRole('menuitem', { name: /edit profile/i })).toHaveAttribute(
      'href',
      '/admin/profile'
    );
  });

  it('should close dropdown when clicking outside', async () => {
    const actor = userEvent.setup();
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(
      <div>
        <UserProfile user={user} />
        <div data-testid="outside">Outside content</div>
      </div>
    );

    // Open menu
    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click outside
    await actor.click(screen.getByTestId('outside'));

    // Menu should be closed (role="menu" should not exist)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should close dropdown when Escape key is pressed', async () => {
    const actor = userEvent.setup();
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserProfile user={user} />);

    // Open menu
    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Press Escape
    await actor.keyboard('{Escape}');

    // Menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should position dropdown with correct classes based on available space', async () => {
    const actor = userEvent.setup();
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserProfile user={user} />);

    await actor.click(screen.getByRole('button', { name: /john doe profile menu/i }));

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    // Should have either 'top-full' or 'bottom-full' class applied
    expect(
      menu.className.includes('top-full') || menu.className.includes('bottom-full')
    ).toBe(true);
  });
});

describe('Avatar Component', () => {
  it('should display user initials', () => {
    const { container } = render(<Avatar name="John Doe" />);
    expect(container.textContent).toContain('J');
  });

  it('should display image if src is provided', () => {
    render(<Avatar name="John Doe" src="/avatar.jpg" />);

    const image = screen.getByAltText(/John Doe/i);
    expect(image).toHaveAttribute('src', '/avatar.jpg');
  });

  it('should handle null or empty name', () => {
    const { container } = render(<Avatar name={null} />);
    expect(container.textContent).toContain('U');
  });

  it('should apply size variant correctly', () => {
    const { container } = render(<Avatar name="John" size="lg" />);
    const avatar = container.firstChild;
    expect(avatar).toHaveClass('w-12', 'h-12');
  });
});
