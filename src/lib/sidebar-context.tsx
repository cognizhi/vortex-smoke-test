'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isReady: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-collapsed';

interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * Provides sidebar state management with localStorage persistence
 */
export function SidebarProvider({ children }: SidebarProviderProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize collapse state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState === 'true') {
      setIsCollapsed(true);
    }
    setIsReady(true);
  }, []);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, isCollapsed.toString());
    }
  }, [isCollapsed, isReady]);

  const toggleCollapse = (): void => {
    setIsCollapsed((prev) => !prev);
  };

  const value: SidebarContextType = {
    isCollapsed,
    toggleCollapse,
    isReady,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to access sidebar context
 */
export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);

  if (!context) {
    // Return a default context for SSR compatibility
    return {
      isCollapsed: false,
      toggleCollapse: () => {
        // No-op during SSR
      },
      isReady: false,
    };
  }

  return context;
}
