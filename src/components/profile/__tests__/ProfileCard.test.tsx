import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileCard } from '@/components/profile/ProfileCard';

describe('ProfileCard', () => {
  const base = {
    name: 'Jane Smith',
    email: 'jane@acme.com',
    role: 'owner' as const,
    avatarUrl: '/api/avatars/jane.jpg',
  };

  it('PC-01: shows name, email and role when loaded', () => {
    render(<ProfileCard {...base} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@acme.com')).toBeInTheDocument();
    expect(screen.getByText(/owner/i)).toBeInTheDocument();
  });

  it('PC-02: renders the avatar image when an avatarUrl is present', () => {
    render(<ProfileCard {...base} />);
    const img = screen.getByRole('img', { name: /jane smith/i });
    expect(img).toHaveAttribute('src', '/api/avatars/jane.jpg');
  });

  it('PC-03: shows a loading state', () => {
    render(<ProfileCard {...base} loading />);
    expect(screen.getByTestId('profile-card-skeleton')).toBeInTheDocument();
  });

  it('PC-04: shows an error state with a retry action', async () => {
    const onRetry = vi.fn();
    render(<ProfileCard {...base} error="Could not load your profile." onRetry={onRetry} />);
    expect(screen.getByText(/could not load your profile/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
