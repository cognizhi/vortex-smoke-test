import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FoundersPage from '../page';

describe('FoundersPage', () => {
  it('renders the page heading', () => {
    render(<FoundersPage />);
    expect(
      screen.getByRole('heading', { level: 1 })
    ).toBeInTheDocument();
  });

  it('displays the correct h1 text', () => {
    render(<FoundersPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /The minds behind Vortex/i })
    ).toBeInTheDocument();
  });

  it('renders exactly two founder cards', () => {
    render(<FoundersPage />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
  });

  it('renders two h3 headings for founder names', () => {
    render(<FoundersPage />);
    const nameHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(nameHeadings).toHaveLength(2);
    nameHeadings.forEach((h) => {
      expect(h).toHaveTextContent('Founder Name');
    });
  });

  it('displays Co-founder & CEO title', () => {
    render(<FoundersPage />);
    expect(screen.getByText('Co-founder & CEO')).toBeInTheDocument();
  });

  it('displays Co-founder & CTO title', () => {
    render(<FoundersPage />);
    expect(screen.getByText('Co-founder & CTO')).toBeInTheDocument();
  });

  it('renders bio placeholder text for both founders', () => {
    render(<FoundersPage />);
    const bios = screen.getAllByText(/Short bio goes here/i);
    expect(bios).toHaveLength(2);
  });

  it('renders the placeholder footer note', () => {
    render(<FoundersPage />);
    expect(
      screen.getByText(/Placeholder profiles — real photos and bios coming soon/i)
    ).toBeInTheDocument();
  });

  it('renders the Meet the Team badge', () => {
    render(<FoundersPage />);
    expect(screen.getByText(/Meet the Team/i)).toBeInTheDocument();
  });

  it('has a visually-hidden section heading for accessibility', () => {
    render(<FoundersPage />);
    const srHeading = screen.getByRole('heading', { level: 2 });
    expect(srHeading).toBeInTheDocument();
    expect(srHeading).toHaveTextContent('Meet the founders');
  });
});
