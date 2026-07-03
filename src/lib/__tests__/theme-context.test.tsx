import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../theme-context';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component
function TestComponent() {
  const { mode, setMode } = useTheme();
  return (
    <div>
      <div data-testid="current-mode">{mode}</div>
      <button onClick={() => setMode('light')} data-testid="btn-light">
        Light
      </button>
      <button onClick={() => setMode('dark')} data-testid="btn-dark">
        Dark
      </button>
      <button onClick={() => setMode('system')} data-testid="btn-system">
        System
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('ThemeProvider', () => {
    it('provides default theme mode (system)', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(
        () => {
          const element = screen.getByTestId('current-mode');
          expect(element).toBeInTheDocument();
          expect(element).toHaveTextContent('system');
        },
        { timeout: 3000 },
      );
    });

    it('restores saved theme from localStorage', async () => {
      localStorage.setItem('theme-preference', 'dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(
        () => {
          const element = screen.getByTestId('current-mode');
          expect(element).toBeInTheDocument();
          expect(element).toHaveTextContent('dark');
        },
        { timeout: 3000 },
      );
    });

    it('persists theme preference to localStorage', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(
        () => {
          const darkButton = screen.getByTestId('btn-dark');
          expect(darkButton).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const darkButton = screen.getByTestId('btn-dark');
      await user.click(darkButton);

      await waitFor(
        () => {
          expect(localStorage.getItem('theme-preference')).toBe('dark');
        },
        { timeout: 3000 },
      );
    });

    it('clears localStorage when switching to system mode', async () => {
      const user = userEvent.setup();
      localStorage.setItem('theme-preference', 'dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(
        () => {
          const systemButton = screen.getByTestId('btn-system');
          expect(systemButton).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const systemButton = screen.getByTestId('btn-system');
      await user.click(systemButton);

      await waitFor(
        () => {
          expect(localStorage.getItem('theme-preference')).toBeNull();
        },
        { timeout: 3000 },
      );
    });

    it('handles theme mode changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await waitFor(
        () => {
          const darkButton = screen.getByTestId('btn-dark');
          expect(darkButton).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const darkButton = screen.getByTestId('btn-dark');
      await user.click(darkButton);

      await waitFor(
        () => {
          const modeElement = screen.getByTestId('current-mode');
          expect(modeElement).toHaveTextContent('dark');
        },
        { timeout: 3000 },
      );
    });
  });

  describe('useTheme hook', () => {
    it('returns default context when used outside provider (SSR compatibility)', async () => {
      const TestComponentWithoutProvider = () => {
        const context = useTheme();
        return (
          <div>
            <div data-testid="mode">{context.mode}</div>
            <div data-testid="effective-mode">{context.effectiveMode}</div>
            <div data-testid="is-ready">{context.isReady ? 'ready' : 'not-ready'}</div>
          </div>
        );
      };

      render(<TestComponentWithoutProvider />);

      await waitFor(
        () => {
          expect(screen.getByTestId('mode')).toHaveTextContent('system');
          expect(screen.getByTestId('effective-mode')).toHaveTextContent('light');
          expect(screen.getByTestId('is-ready')).toHaveTextContent('not-ready');
        },
        { timeout: 3000 },
      );
    });

    it('provides proper context when used inside provider', async () => {
      const TestComponentWithProvider = () => {
        const context = useTheme();
        return (
          <div>
            <div data-testid="mode">{context.mode}</div>
            <div data-testid="is-ready">{context.isReady ? 'ready' : 'not-ready'}</div>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponentWithProvider />
        </ThemeProvider>,
      );

      await waitFor(
        () => {
          expect(screen.getByTestId('is-ready')).toHaveTextContent('ready');
        },
        { timeout: 3000 },
      );
    });
  });
});
