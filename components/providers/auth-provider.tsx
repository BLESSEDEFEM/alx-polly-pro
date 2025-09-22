/**
 * @fileoverview Authentication context provider for managing user authentication state
 * Provides authentication context and state management throughout the application
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCookie, deleteCookie } from '@/lib/utils';

/**
 * Authentication context type definition
 * 
 * Defines the shape of the authentication context that will be available
 * to all components wrapped by the AuthProvider.
 */
interface AuthContextType {
  /** Current authenticated user object, null if not authenticated */
  user: User | null;
  /** Current session object containing tokens and user data */
  session: Session | null;
  /** Loading state for initial authentication check */
  isLoading: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Sign out the current user
   * Clears the session and redirects to login page
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // State will be updated automatically by the auth state change listener
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
      // First try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        
        // If refresh fails, try to get the current session as fallback
        console.log('Falling back to getSession...');
        const { data: fallbackData, error: fallbackError } = await supabase.auth.getSession();
        
        if (fallbackError) {
          console.error('Error getting session:', fallbackError);
          throw fallbackError;
        }
        
        console.log('Session retrieved via fallback');
        setSession(fallbackData.session);
        setUser(fallbackData.session?.user ?? null);
        return;
      }
      
      console.log('Session refreshed successfully:', data.session?.user?.email);
      setSession(data.session);
      setUser(data.session?.user ?? null);
    } catch (error) {
      console.error('Error in refreshSession:', error);
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
        
        // Configure session persistence
        const { data: persistenceData, error: persistenceError } = await supabase.auth.getSession();
        
        if (persistenceError) {
          console.error('Error configuring session persistence:', persistenceError);
        } else {
          console.log('Session persistence configured:', !!persistenceData.session);
        }
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('AuthProvider - Initial session loaded:', !!session, session?.user?.email);
          console.log('AuthProvider - User authenticated:', !!session?.user);
          setSession(session);
          setUser(session?.user ?? null);
          
          // If we have a session but there's a stored redirect, handle it
          if (session && (sessionStorage.getItem('authRedirectPath') || localStorage.getItem('authRedirectPath'))) {
            console.log('Found session and stored redirect, refreshing session');
            try {
              await refreshSession();
            } catch (refreshError) {
              console.error('Error refreshing session with stored redirect:', refreshError);
            }
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    /**
     * Listen for auth state changes
     * This handles login, logout, token refresh, and other auth events
     */
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Update local state with the new session
        setSession(session);
        setUser(session?.user ?? null);
        
        // For login events, ensure we have the latest session data
        if (event === 'SIGNED_IN') {
          console.log('User signed in, refreshing session data');
          try {
            // Check for stored redirects
            checkStoredRedirects();
            
            // Check for stored redirect URL
            const storedRedirect = sessionStorage.getItem('authRedirect');
            const cookieRedirect = getCookie('authRedirect');
            const redirectUrl = storedRedirect || cookieRedirect;
            
            if (redirectUrl) {
              console.log('Found redirect URL:', redirectUrl);
              // Clean up stored redirects
              sessionStorage.removeItem('authRedirect');
              deleteCookie('authRedirect');
              
              // Use router for navigation instead of window.location
              setTimeout(() => {
                router.push(redirectUrl);
              }, 100);
            }
            
            await refreshSession();
          } catch (error) {
            console.error('Error refreshing session after sign in:', error);
          }
        }
        
        // Set loading to false after any auth state change
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Remove refreshSession from dependencies to prevent infinite loop

  // Context value object
  const value: AuthContextType = {
    user,
    session,
    isLoading,
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
