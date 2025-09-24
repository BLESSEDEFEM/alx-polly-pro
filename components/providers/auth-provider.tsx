/**
 * @fileoverview Authentication context provider for managing user authentication state
 * Provides authentication context and state management throughout the application
 * Enhanced for Polly-API compatibility with adaptive backend support
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adaptiveClient } from '@/lib/adaptive-client';
import { getCookie, deleteCookie } from '@/lib/utils';

/**
 * Generic user interface for Polly-API compatibility
 */
interface PollyUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  created_at?: string;
  last_sign_in_at?: string;
}

/**
 * Generic session interface for Polly-API compatibility
 */
interface PollySession {
  access_token?: string;
  token_type?: string;
  expires_at?: string;
  expires_in?: number;
  user?: PollyUser;
}

/**
 * Authentication context type definition
 * 
 * Defines the shape of the authentication context that will be available
 * to all components wrapped by the AuthProvider.
 */
interface AuthContextType {
  /** Current authenticated user object, null if not authenticated */
  user: PollyUser | null;
  /** Current session object containing tokens and user data */
  session: PollySession | null;
  /** Loading state for initial authentication check */
  isLoading: boolean;
  /** Loading state for initial authentication check (alias for compatibility) */
  loading: boolean;
  /** Function to sign out the current user */
  signOut: () => Promise<void>;
  /** Function to refresh the current session */
  refreshSession: () => Promise<void>;
}

/**
 * Authentication context
 * 
 * React context that provides authentication state and methods to child components.
 * Should be accessed using the useAuth hook rather than directly.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component props
 */
interface AuthProviderProps {
  /** Child components that will have access to authentication context */
  children: React.ReactNode;
}

/**
 * Authentication provider component
 * 
 * Wraps the application (or parts of it) to provide authentication context.
 * Manages user authentication state, session handling, and auth state changes.
 * 
 * Features:
 * - Automatic session restoration on app load
 * - Real-time auth state change listening
 * - Session management and token refresh
 * - Loading states for better UX
 * 
 * @param props - Component props containing children
 * @returns JSX element providing authentication context
 * 
 * @example
 * ```tsx
 * // Wrap your app or specific routes
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PollyUser | null>(null);
  const [session, setSession] = useState<PollySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Sign out the current user
   * Clears the session and redirects to login page
   */
  const signOut = async () => {
    try {
      // Use adaptive client for logout
      const result = await adaptiveClient.auth.logout();
      if (!result.success) {
        console.error('Error signing out:', result.error);
      }
      
      // Clear local state
      setSession(null);
      setUser(null);
      
      // Clear any stored auth data
      sessionStorage.removeItem('authRedirect');
      sessionStorage.removeItem('authRedirectPath');
      localStorage.removeItem('authRedirectPath');
      deleteCookie('authRedirect');
      
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Refresh the session data
   * This is used to update the session after login/logout
   */
  const refreshSession = useCallback(async () => {
    console.log('Refreshing session...');
    try {
      // Use adaptive client to get session
      const result = await adaptiveClient.auth.getSession();
      
      if (!result.success) {
        console.error('Error refreshing session:', result.error);
        setSession(null);
        setUser(null);
        return;
      }
      
      // Handle session data from adaptive client
      if (result.data?.session?.user || (result.data?.authenticated && result.data?.user)) {
        const sessionData = result.data.session || result.data;
        const userData = sessionData.user || result.data.user;
        
        console.log('Session active for user:', userData.email);
        
        // Create standardized session object
        const pollySession: PollySession = {
          access_token: sessionData.access_token || result.data.token || result.data.access_token,
          token_type: sessionData.token_type || result.data.token_type || 'Bearer',
          expires_at: sessionData.expires_at || result.data.expires_at,
          expires_in: sessionData.expires_in || result.data.expires_in,
          user: {
            id: userData.id,
            email: userData.email,
            username: userData.username || userData.user_metadata?.username,
            name: userData.name || userData.user_metadata?.full_name || userData.user_metadata?.name,
            created_at: userData.created_at,
            last_sign_in_at: userData.last_sign_in_at,
          }
        };
        
        setSession(pollySession);
        setUser(pollySession.user!);
      } else {
        console.log('No active session found');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
      setSession(null);
      setUser(null);
      throw error;
    }
  }, []);

  // Check for stored redirect paths and verify session persistence
  const checkStoredRedirects = () => {
    try {
      // Check for stored redirect paths
      const sessionRedirect = sessionStorage.getItem('authRedirectPath');
      const localRedirect = localStorage.getItem('authRedirectPath');
      
      if (sessionRedirect || localRedirect) {
        console.log('Found stored redirect path:', sessionRedirect || localRedirect);
      }
      
      // Check for auth cookies
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const authCookie = cookies.find(cookie => cookie.startsWith('authRedirect='));
      
      if (authCookie) {
        const cookieValue = decodeURIComponent(authCookie.split('=')[1]);
        console.log('Found auth redirect cookie:', cookieValue);
      }
    } catch (error) {
      console.error('Error checking stored redirects:', error);
    }
  };

  useEffect(() => {
    /**
     * Get initial session on component mount
     * This restores the user's authentication state if they have a valid session
     */
    const getSession = async () => {
      console.log('AuthProvider - Initializing');
      try {
        // First check for stored redirects
        checkStoredRedirects();
        
        // Get the current session using adaptive client
        await refreshSession();
        
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    /**
     * Set up periodic session refresh
     * This ensures the session stays valid and handles token refresh
     */
    const sessionRefreshInterval = setInterval(async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error('Error in periodic session refresh:', error);
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(sessionRefreshInterval);
    };
  }, [refreshSession]);

  // Context value object
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    loading: isLoading, // Alias for compatibility
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * 
 * Provides a convenient way to access authentication state and methods
 * from any component within the AuthProvider tree.
 * 
 * @returns Authentication context object
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, signOut } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       {user ? (
 *         <div>
 *           Welcome {user.email}!
 *           <button onClick={signOut}>Sign Out</button>
 *         </div>
 *       ) : (
 *         <div>Please sign in</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
