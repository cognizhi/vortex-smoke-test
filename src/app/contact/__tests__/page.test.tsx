import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactPage from '../page';

describe('ContactPage', () => {
  it('renders the page heading', () => {
    render(<ContactPage />);
    expect(
      screen.getByRole('heading', { level: 1 })
    ).toBeInTheDocument();
  });

  it('displays a placeholder email address', () => {
    render(<ContactPage />);
    expect(screen.getByText('hello@example.com')).toBeInTheDocument();
  });

  it('displays a placeholder phone number', () => {
    render(<ContactPage />);
    expect(screen.getByText('+1 (555) 000-0000')).toBeInTheDocument();
  });

  it('email link has correct href', () => {
    render(<ContactPage />);
    const emailLink = screen.getByRole('link', { name: 'hello@example.com' });
    expect(emailLink).toHaveAttribute('href', 'mailto:hello@example.com');
  });

  it('phone link has correct href', () => {
    render(<ContactPage />);
    const phoneLink = screen.getByRole('link', { name: '+1 (555) 000-0000' });
    expect(phoneLink).toHaveAttribute('href', 'tel:+15550000000');
  });

  it('has an Email label', () => {
    render(<ContactPage />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('has a Phone label', () => {
    render(<ContactPage />);
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });
});
