'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * User session data from /api/auth/me
 */
export interface User {
  userId: string;
  merchantId: string;
  slug: string;
  role: 'owner' | 'admin';
  /** Optional: email from user profile (if available from extended endpoint) */
  email?: string;
  /** Optional: name from user profile (if available from extended endpoint) */
  name?: string;
  /** Optional: avatar URL from user profile (if available from extended endpoint) */
  avatarUrl?: string | null;
}

/**
 * Auth context type for managing user session
 */
interface AuthContextType {
  /** Current authenticated user, or null if not authenticated */
  user: User | null;
  /** Whether the auth state is still loading from the server */
  isLoading: boolean;
  /** Error message if session fetch failed */
  error: string | null;
  /** Whether the context is ready (hydrated from server) */
  isReady: boolean;
  /** Re-fetch the session from the server (e.g. after an avatar upload) */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component for managing user session
 *
 * Fetches session data from GET /api/auth/me on mount and provides it to child components.
 * Works seamlessly with httpOnly cookie JWT authentication.
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  /**
   * Fetch the current user session from the API
   */
  const fetchSession = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        // Credentials are automatically included for same-origin requests,
        // but we explicitly set it for clarity (httpOnly cookies)
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Parse response regardless of status (both success and error have consistent format)
      const result = await response.json() as {
        data: User | null;
        error: { code: string; message: string } | null;
      };

      if (!response.ok || result.error) {
        // Not authenticated or error occurred
        setUser(null);
        setError(result.error?.message || 'Failed to fetch session');
      } else if (result.data) {
        // Successfully authenticated
        setUser(result.data);
        setError(null);
      } else {
        // Unexpected response format
        setUser(null);
        setError('Invalid session response');
      }
    } catch (err) {
      // Network or parsing error
      setUser(null);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  };

  /**
   * Fetch session on component mount
   */
  useEffect(() => {
    fetchSession();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isReady,
    refresh: fetchSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the auth context
 *
 * Returns the auth context with user data and loading state.
 * Provides a default context if not within a provider (for SSR compatibility).
 *
 * @example
 * ```tsx
 * const { user, isLoading, isReady } = useAuth();
 *
 * if (!isReady) return <div>Loading...</div>;
 * if (!user) return <div>Not authenticated</div>;
 *
 * return <div>Welcome, {user.slug}</div>;
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    // Return a default context for SSR compatibility
    // This allows components to render during pre-rendering without errors
    return {
      user: null,
      isLoading: true,
      error: null,
      isReady: false,
      refresh: async (): Promise<void> => {},
    };
  }

  return context;
}
