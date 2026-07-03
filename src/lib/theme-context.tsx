'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveMode: 'light' | 'dark';
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';
const LIGHT_CLASS = 'light';
const DARK_CLASS = 'dark';

/**
 * Detects the system color scheme preference
 */
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Gets the effective theme mode (resolves 'system' to actual light/dark)
 */
function getEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemPreference();
  }
  return mode;
}

/**
 * Applies the theme to the document
 */
function applyTheme(mode: ThemeMode): void {
  const htmlElement = document.documentElement;
  const effectiveMode = getEffectiveMode(mode);

  // Remove existing classes
  htmlElement.classList.remove(LIGHT_CLASS, DARK_CLASS);

  // Apply effective theme class
  if (effectiveMode === 'dark') {
    htmlElement.classList.add(DARK_CLASS);
  } else {
    htmlElement.classList.add(LIGHT_CLASS);
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>('light');
  const [isReady, setIsReady] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Load saved preference from localStorage
    const savedMode = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;

    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setMode(savedMode);
    } else {
      setMode('system');
    }

    setIsReady(true);
  }, []);

  // Apply theme when mode changes
  useEffect(() => {
    const newEffectiveMode = getEffectiveMode(mode);
    setEffectiveMode(newEffectiveMode);
    applyTheme(mode);

    // Persist to localStorage
    if (mode === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (): void => {
      const newEffectiveMode = getSystemPreference();
      setEffectiveMode(newEffectiveMode);
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);

    return (): void => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [mode]);

  const value: ThemeContextType = {
    mode,
    setMode,
    effectiveMode,
    isReady,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Returns a default context if not within a provider (for SSR compatibility)
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    // Return a default context for SSR compatibility
    // This allows components to render during pre-rendering without errors
    return {
      mode: 'system',
      setMode: () => {
        // No-op during SSR
      },
      effectiveMode: 'light',
      isReady: false,
    };
  }

  return context;
}
