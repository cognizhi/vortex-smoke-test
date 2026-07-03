import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../sidebar-context';

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

// Test component that uses the sidebar hook
function TestComponent() {
  const { isCollapsed, toggleCollapse, isReady } = useSidebar();

  return (
    <div>
      <div data-testid="ready-status">{isReady ? 'ready' : 'loading'}</div>
      <div data-testid="collapse-status">{isCollapsed ? 'collapsed' : 'expanded'}</div>
      <button onClick={toggleCollapse} data-testid="toggle-button">
        Toggle
      </button>
    </div>
  );
}

describe('SidebarContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('renders provider with children', () => {
    render(
      <SidebarProvider>
        <div>Test Child</div>
      </SidebarProvider>,
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('initializes with collapsed state false by default', async () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('collapse-status')).toHaveTextContent('expanded');
  });

  it('restores collapsed state from localStorage', async () => {
    localStorageMock.setItem('sidebar-collapsed', 'true');

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('collapse-status')).toHaveTextContent('collapsed');
  });

  it('toggles collapse state', async () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
    });

    const toggleButton = screen.getByTestId('toggle-button');
    expect(screen.getByTestId('collapse-status')).toHaveTextContent('expanded');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('collapse-status')).toHaveTextContent('collapsed');
    });
  });

  it('persists collapse state to localStorage', async () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
    });

    const toggleButton = screen.getByTestId('toggle-button');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(localStorageMock.getItem('sidebar-collapsed')).toBe('true');
    });
  });

  it('returns default context outside provider', () => {
    const TestComponentWithoutProvider = () => {
      const { isCollapsed, isReady } = useSidebar();

      return (
        <div>
          <div data-testid="collapse-status">{isCollapsed ? 'collapsed' : 'expanded'}</div>
          <div data-testid="ready-status">{isReady ? 'ready' : 'loading'}</div>
        </div>
      );
    };

    render(<TestComponentWithoutProvider />);

    expect(screen.getByTestId('collapse-status')).toHaveTextContent('expanded');
    expect(screen.getByTestId('ready-status')).toHaveTextContent('loading');
  });

  it('persists multiple toggles correctly', async () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
    });

    const toggleButton = screen.getByTestId('toggle-button');

    // Toggle 1: false -> true
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(localStorageMock.getItem('sidebar-collapsed')).toBe('true');
    });

    // Toggle 2: true -> false
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(localStorageMock.getItem('sidebar-collapsed')).toBe('false');
    });

    // Toggle 3: false -> true
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(localStorageMock.getItem('sidebar-collapsed')).toBe('true');
    });
  });
});
