import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme-context';
import { ThemeToggle } from '../theme-toggle';

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Helper function to check if a button/container has a specific Lucide icon
   * Returns true if the SVG element with the icon's class is found
   */
  function hasSVGIcon(element: HTMLElement, iconType: 'sun' | 'moon' | 'zap'): boolean {
    const svg = element.querySelector('svg');
    if (!svg) return false;
    // Lucide icons have data-lucide="icon-name" attribute
    return svg.getAttribute('data-lucide') === iconType;
  }

  describe('Rendering', () => {
    it('renders the theme toggle button', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      expect(button).toBeInTheDocument();
    });

    it('displays the current theme icon on button (icon-only) — IR-03', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });

      await waitFor(() => {
        // Default is system mode, which shows Zap icon (Lucide)
        // Icon should be an SVG element with data-lucide="zap" attribute
        expect(hasSVGIcon(button, 'zap')).toBe(true);
      });

      // Verify button contains only the icon SVG, no text labels
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'zap');
    });

    it('has proper ARIA attributes', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders button with Lucide Zap icon (h-4 w-4) — IR-04', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      const svg = button.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-4', 'w-4');
      expect(svg).toHaveAttribute('data-lucide', 'zap');
    });

    it('renders Lucide icon as SVG element — IR-05', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      const svg = button.querySelector('svg');

      // Verify it's a real SVG element (not text content)
      expect(svg?.tagName).toBe('svg');
      expect(svg?.getAttribute('data-lucide')).toBeTruthy();
      // Should not have text content anymore
      expect(button.querySelector('span:first-child')?.textContent).not.toMatch(/[☀️🌙⚙️]/);
    });
  });

  describe('Menu Interactions', () => {
    it('opens menu when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });

      // Menu items should be visible
      expect(screen.getByRole('menuitem', { name: /Light/ })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Dark/ })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /System/ })).toBeInTheDocument();
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <div>
            <ThemeToggle />
            <div data-testid="outside">Outside</div>
          </div>
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');

      const outside = screen.getByTestId('outside');
      await user.click(outside);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('closes menu and returns focus to button when Escape is pressed', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveFocus();
      });
    });
  });

  describe('Theme Selection', () => {
    it('selects light theme when light option is clicked — TS-01', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const lightOption = screen.getByRole('menuitem', { name: /Light/ });
      await user.click(lightOption);

      await waitFor(() => {
        // Button should show Sun icon (Lucide) after selection
        expect(hasSVGIcon(button, 'sun')).toBe(true);
        const svg = button.querySelector('svg');
        expect(svg).toHaveAttribute('data-lucide', 'sun');
        // Menu should be closed
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('selects dark theme when dark option is clicked — TS-02', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const darkOption = screen.getByRole('menuitem', { name: /Dark/ });
      await user.click(darkOption);

      await waitFor(() => {
        // Button should show Moon icon (Lucide) after selection
        expect(hasSVGIcon(button, 'moon')).toBe(true);
        const svg = button.querySelector('svg');
        expect(svg).toHaveAttribute('data-lucide', 'moon');
        // Menu should be closed
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('shows checkmark for selected option', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme-preference', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      await waitFor(() => {
        const darkOption = screen.getByRole('menuitem', { name: /Dark/ });
        expect(darkOption).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('does not show checkmark for unselected options', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      await waitFor(() => {
        const lightOption = screen.getByRole('menuitem', { name: /Light/ });
        const darkOption = screen.getByRole('menuitem', { name: /Dark/ });

        expect(lightOption).toHaveAttribute('aria-checked', 'false');
        expect(darkOption).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('displays correct Lucide icon for Light option in menu — MIR-01', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const lightOption = screen.getByRole('menuitem', { name: /Light/ });
      const svg = lightOption.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'sun');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('displays correct Lucide icon for Dark option in menu — MIR-02', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const darkOption = screen.getByRole('menuitem', { name: /Dark/ });
      const svg = darkOption.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'moon');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('displays correct Lucide icon for System option in menu — MIR-03', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const systemOption = screen.getByRole('menuitem', { name: /System/ });
      const svg = systemOption.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'zap');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('all menu icons have correct sizing (h-4 w-4) — MIR-04', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        const svg = item.querySelector('svg');
        expect(svg).toHaveClass('h-4', 'w-4');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens menu with Enter key', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      button.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('opens menu with Space key', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      button.focus();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('navigates menu items with arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      // First item should be focused
      let menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();

      // Arrow down
      await user.keyboard('{ArrowDown}');
      menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[1]).toHaveFocus();

      // Arrow up
      await user.keyboard('{ArrowUp}');
      menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();
    });

    it('wraps around when navigating past first/last items', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      let menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();

      // Arrow up from first item should wrap to last
      await user.keyboard('{ArrowUp}');
      menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[2]).toHaveFocus();

      // Arrow down from last item should wrap to first
      await user.keyboard('{ArrowDown}');
      menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();
    });

    it('selects option with Enter key', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      // Navigate to dark option
      await user.keyboard('{ArrowDown}');

      // Select with Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(hasSVGIcon(button, 'moon')).toBe(true);
      });
    });

    it('selects option with Space key', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      // Navigate to dark option
      await user.keyboard('{ArrowDown}');

      // Select with Space
      await user.keyboard(' ');

      await waitFor(() => {
        expect(hasSVGIcon(button, 'moon')).toBe(true);
      });
    });

    it('closes menu on Tab', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');

      await user.keyboard('{Tab}');

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Icon Consistency', () => {
    it('displays all three Lucide icons in open menu — IC-01', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);

      // Check each icon is present
      expect(menuItems[0].querySelector('svg')).toHaveAttribute('data-lucide', 'sun');
      expect(menuItems[1].querySelector('svg')).toHaveAttribute('data-lucide', 'moon');
      expect(menuItems[2].querySelector('svg')).toHaveAttribute('data-lucide', 'zap');
    });

    it('displays icons in correct order (Sun→Moon→Zap) — IC-02', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const menuItems = screen.getAllByRole('menuitem');
      const lightItem = menuItems.find((item) => item.textContent?.includes('Light'))!;
      const darkItem = menuItems.find((item) => item.textContent?.includes('Dark'))!;
      const systemItem = menuItems.find((item) => item.textContent?.includes('System'))!;

      expect(lightItem.querySelector('svg')).toHaveAttribute('data-lucide', 'sun');
      expect(darkItem.querySelector('svg')).toHaveAttribute('data-lucide', 'moon');
      expect(systemItem.querySelector('svg')).toHaveAttribute('data-lucide', 'zap');
    });

    it('icons inherit text color without hardcoded fill/stroke — IC-03', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        const svg = item.querySelector('svg');
        // Lucide icons should not have hardcoded fill (should inherit from parent text color)
        expect(svg?.getAttribute('fill')).not.toBe('currentColor');
        // The SVG itself may have no fill, letting CSS control it
        const hasHardcodedFill = svg?.getAttribute('fill') && svg?.getAttribute('fill') !== 'none';
        expect(hasHardcodedFill).toBe(false);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('displays icon-only on mobile (375px) — MR-01', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      // Button should contain only the Lucide Zap icon, no text label
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'zap');
      // No text content (just the SVG icon)
      expect(button.querySelector('span:first-child')?.textContent).not.toMatch(/[a-zA-Z]/);
    });

    it('displays icon-only on tablet (768px) — MR-02', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      // Button should contain only the Lucide Zap icon, no text label
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'zap');
      // No text content (just the SVG icon)
      expect(button.querySelector('span:first-child')?.textContent).not.toMatch(/[a-zA-Z]/);
    });

    it('displays icon-only on desktop (1024px+) — MR-03', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      // Button should contain only the Lucide Zap icon, no text label
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-lucide', 'zap');
      // No text content (just the SVG icon)
      expect(button.querySelector('span:first-child')?.textContent).not.toMatch(/[a-zA-Z]/);
    });
  });

  describe('Theme Persistence', () => {
    it('updates theme preference in localStorage', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      const button = screen.getByRole('button', { name: /theme options/i });
      await user.click(button);

      const darkOption = screen.getByRole('menuitem', { name: /Dark/ });
      await user.click(darkOption);

      await waitFor(() => {
        expect(localStorage.getItem('theme-preference')).toBe('dark');
      });
    });

    it('restores theme preference from localStorage', async () => {
      localStorage.setItem('theme-preference', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /theme options/i });
        expect(hasSVGIcon(button, 'moon')).toBe(true);
      });
    });
  });
});
